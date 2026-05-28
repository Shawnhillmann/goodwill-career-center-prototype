import express from 'express'

import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt.js'

import { getAiProvider, getOpenAiConfig } from '../lib/aiProvider.js'

import { bedrockErrorHint, invokeBedrockChat } from '../lib/bedrockChat.js'

import { logChat } from '../lib/chatLog.js'

import { getEnv, requireEnv } from '../lib/env.js'

import { sendError } from '../lib/errors.js'

import {

  looksLikePlaceholderTemplate,

  requiresFreshData,

} from '../lib/hallucinationGuard.js'

import { selectChatModel } from '../lib/openaiModels.js'

import { invokeOpenAiResponsesText } from '../lib/openaiResponses.js'

import { buildClarifyInstructions } from '../lib/responseStyle.js'
import { isLiveSearchIntent, resolveEffectiveSearchIntent, type SearchIntent } from '../lib/searchIntent.js'

import { appendWebGroundingToInstructions, formatWebResultsForInstructions } from '../lib/webGrounding.js'

import { webSearch } from '../lib/webSearch.js'

import { runLiveWebSearchPipeline } from '../lib/webSearchPipeline.js'



type ChatRequestBody = {

  messages: ChatMessage[]

  language: string

  uploadedDocumentText?: string

}



function isNonEmptyString(v: unknown): v is string {

  return typeof v === 'string' && v.trim().length > 0

}



function missingEnvForProvider(provider: 'openai' | 'bedrock') {

  const env = getEnv()

  if (provider === 'openai') {

    const missing: string[] = []

    if (!env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY')

    return missing

  }



  const missing: string[] = []

  if (!env.AWS_REGION) missing.push('AWS_REGION')

  if (!env.BEDROCK_MODEL_ID) missing.push('BEDROCK_MODEL_ID')

  if (!env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID')

  if (!env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY')

  return missing

}



function isExplicitDocumentRequest(q: string): boolean {
  const s = q.toLowerCase()
  const doc = /\b(resume|résumé|cv|curriculum vitae|cover letter)\b/
  const action = /\b(write|draft|generate|create|format|rewrite|revise|tailor|update|improve|edit|fix)\b/
  return doc.test(s) && (action.test(s) || /\btailored\b/.test(s))
}



function blockIfHallucinated(reply: string, lastUser: string): string | null {

  if (!lastUser || !requiresFreshData(lastUser)) return null

  if (looksLikePlaceholderTemplate(reply)) {

    return 'Unable to provide grounded results right now. Please try again with city + state and a timeframe.'

  }

  return null

}



export const chatRouter = express.Router()



chatRouter.post('/', async (req, res) => {

  const requestStarted = Date.now()

  const body = req.body as ChatRequestBody



  if (!body || !Array.isArray(body.messages) || !isNonEmptyString(body.language)) {

    return sendError(res, 400, 'Invalid request. Expected { messages: [...], language: string }.')

  }



  const aiProvider = getAiProvider()

  const missing = missingEnvForProvider(aiProvider)

  if (missing.length) {

    logChat('config_error', { provider: aiProvider, missing: missing.join(',') })

    return res.status(500).json({

      error: 'Missing required environment variable',

      missing,

      provider: aiProvider,

    })

  }



  const messages = body.messages

    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && isNonEmptyString(m.content))

    .slice(-30)



  if (messages.length === 0) {

    return sendError(res, 400, 'Please provide at least one message.')

  }



  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

  const hasUploadedDocument = Boolean(body.uploadedDocumentText?.trim())

  let intent = lastUser ? resolveEffectiveSearchIntent(messages, lastUser) : { kind: 'none' as const }



  const docOnly = Boolean(lastUser && isExplicitDocumentRequest(lastUser))

  const systemDocOnly = docOnly

    ? '\n\nIf the user requests a resume, CV, cover letter, or any written document, output ONLY the document text. Do NOT include any introduction, preface, commentary, or closing lines. Do not ask questions. The output must start immediately with the document content.'

    : ''



  let system = buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly



  // Bedrock: optional DuckDuckGo prefetch injected into system instructions (not fake assistant turns).

  if (aiProvider === 'bedrock' && isLiveSearchIntent(intent) && !intent.needsClarification) {

    try {

      const results = await webSearch(intent.query, 6)

      if (results.length) {

        system = appendWebGroundingToInstructions(system, formatWebResultsForInstructions(results))

        logChat('bedrock_grounding', { resultCount: results.length, intentKind: intent.kind })

      }

    } catch (err) {

      const hint = err instanceof Error ? err.message : String(err)

      return sendError(res, 502, 'Web search is temporarily unavailable. Please try again in a moment.', hint)

    }

  }



  if (aiProvider === 'openai') {

    const { apiKey } = getOpenAiConfig()

    if (!apiKey) {

      logChat('config_error', { provider: 'openai', missing: 'OPENAI_API_KEY' })

      return sendError(

        res,

        500,

        'Server is missing OpenAI configuration. Set OPENAI_API_KEY in your .env when AI_PROVIDER=openai.',

      )

    }



    try {

      const lastFewUser = [...messages].reverse().filter((m) => m.role === 'user').slice(0, 4).map((m) => m.content.toLowerCase())

      const convoJobContext = lastFewUser.some((t) =>

        /\b(job|jobs|hiring|openings|apply|positions?|roles?|work)\b/.test(t),

      )

      const explicitSearchAsk = /\b(web\s*search|search\s+the\s+web|look\s+this\s+up|use the web)\b/i.test(lastUser)



      const effectiveIntent: SearchIntent =

        intent.kind === 'none' && explicitSearchAsk && convoJobContext

          ? { kind: 'jobs', query: lastUser, needsClarification: false }

          : intent



      if (
        isLiveSearchIntent(effectiveIntent) &&
        effectiveIntent.needsClarification &&
        !isExplicitDocumentRequest(lastUser)
      ) {
        logChat('route_clarify', {
          intentKind: effectiveIntent.kind,
          queryLength: effectiveIntent.query.length,
        })

        const clarifyModel = selectChatModel({ hasUploadedDocument, isLiveWebSearch: false })
        const clarifyResult = await invokeOpenAiResponsesText({
          apiKey,
          model: clarifyModel,
          instructions: buildClarifyInstructions(system),
          messages,
          maxOutputTokens: 120,
        })

        const clarifyReply = clarifyResult.text.trim()
        if (!clarifyReply) {
          return sendError(res, 502, 'The AI did not return a response. Please try again.')
        }

        logChat('request_complete', {
          path: 'clarify',
          model: clarifyModel,
          latencyMs: Date.now() - requestStarted,
          replyLength: clarifyReply.length,
        })

        return res.json({ reply: clarifyReply })
      }

      if (isLiveSearchIntent(effectiveIntent)) {

        logChat('route_live_search', {

          intentKind: effectiveIntent.kind,

          needsClarification: effectiveIntent.needsClarification,

          queryLength: effectiveIntent.query.length,

        })



        const pipeline = await runLiveWebSearchPipeline({

          apiKey,

          baseInstructions: system,

          messages,

          intent: effectiveIntent,

        })



        if (!pipeline.ok) {

          return sendError(res, 502, pipeline.userMessage, pipeline.detail)

        }



        const blocked = blockIfHallucinated(pipeline.reply, lastUser)

        if (blocked) {

          return sendError(res, 502, blocked, 'post_search_hallucination_guard')

        }



        logChat('request_complete', {

          path: 'live_web_search',

          stage: pipeline.stage,

          model: pipeline.model,

          latencyMs: Date.now() - requestStarted,

          replyLength: pipeline.reply.length,

        })



        return res.json({ reply: pipeline.reply })

      }



      // Simple chat / resume analysis

      const primaryModel = selectChatModel({ hasUploadedDocument, isLiveWebSearch: false })

      const retryModel = selectChatModel({ hasUploadedDocument: true, isLiveWebSearch: false })



      logChat('route_chat', {

        model: primaryModel,

        hasUploadedDocument,

        messageCount: messages.length,

      })



      let result = await invokeOpenAiResponsesText({

        apiKey,

        model: primaryModel,

        instructions: system,

        messages,

        maxOutputTokens: hasUploadedDocument ? 700 : 400,

      })



      if (!result.text.trim() && primaryModel !== retryModel) {

        logChat('chat_empty_retry', { from: primaryModel, to: retryModel })

        result = await invokeOpenAiResponsesText({

          apiKey,

          model: retryModel,

          instructions: system,

          messages,

          maxOutputTokens: hasUploadedDocument ? 700 : 400,

        })

      }



      const reply = result.text.trim()

      if (!reply) {

        logChat('chat_empty_final', { model: primaryModel, latencyMs: result.latencyMs })

        return sendError(res, 502, 'The AI did not return a response. Please try again.')

      }



      const blocked = blockIfHallucinated(reply, lastUser)

      if (blocked) {

        return sendError(res, 502, blocked, 'chat_hallucination_guard')

      }



      logChat('request_complete', {

        path: 'chat',

        model: primaryModel,

        latencyMs: Date.now() - requestStarted,

        replyLength: reply.length,

      })



      return res.json({ reply })

    } catch (err: unknown) {

      logChat('openai_error', {

        error: err instanceof Error ? err.message : String(err),

        latencyMs: Date.now() - requestStarted,

      })

      const hint = err instanceof Error ? err.message : String(err)

      return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', hint)

    }

  }



  try {

    requireEnv('AWS_REGION', 'BEDROCK_MODEL_ID')

  } catch (e: unknown) {

    return sendError(

      res,

      500,

      'Server is missing AWS configuration. Set AWS_REGION and BEDROCK_MODEL_ID in your .env when AI_PROVIDER=bedrock.',

      e instanceof Error ? e.message : undefined,

    )

  }



  const modelId = getEnv().BEDROCK_MODEL_ID ?? ''



  try {

    const reply = (await invokeBedrockChat({ system, messages })).trim()



    if (!reply) {

      return sendError(res, 502, 'The AI did not return a response. Please try again.')

    }



    const blocked = blockIfHallucinated(reply, lastUser)

    if (blocked) {

      return sendError(res, 502, blocked, 'bedrock_hallucination_guard')

    }



    logChat('request_complete', {

      path: 'bedrock',

      latencyMs: Date.now() - requestStarted,

      replyLength: reply.length,

    })



    res.json({ reply })

  } catch (err: unknown) {

    logChat('bedrock_error', {

      error: err instanceof Error ? err.message : String(err),

      latencyMs: Date.now() - requestStarted,

    })

    const hint = bedrockErrorHint(err, modelId)

    return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', hint)

  }

})



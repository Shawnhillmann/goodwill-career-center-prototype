import express from 'express'

import { invokeAdvisorChat } from '../lib/advisorChat.js'
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

import { matchStarterPrompt, STARTER_TURN_INSTRUCTIONS } from '../lib/starterPrompts.js'
import {
  inferPendingOfferFromConversation,
  isLiveSearchIntent,
  resolveWebSearchAction,
  type PendingWebSearchConfirmation,
} from '../lib/searchIntent.js'

import { appendWebGroundingToInstructions, formatWebResultsForInstructions } from '../lib/webGrounding.js'

import { webSearch } from '../lib/webSearch.js'

import { runLiveWebSearchPipeline } from '../lib/webSearchPipeline.js'



type ChatRequestBody = {

  messages: ChatMessage[]

  language: string

  uploadedDocumentText?: string

  confirmWebSearch?: boolean

  pendingWebSearchConfirmation?: PendingWebSearchConfirmation

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



function isExplicitDocumentRequest(q: string, hasUploadedDocument: boolean): boolean {
  if (matchStarterPrompt(q)) return false
  const s = q.toLowerCase()
  const doc = /\b(resume|résumé|cv|curriculum vitae|cover letter)\b/
  const action = /\b(write|draft|generate|create|format|rewrite|revise|tailor|update|improve|edit|fix)\b/
  if (!doc.test(s) || (!action.test(s) && !/\btailored\b/.test(s))) return false
  if (!hasUploadedDocument && /\b(write|create|draft|build)\s+(my\s+)?(resume|cv)\b/.test(s)) return false
  return true
}



function blockIfHallucinated(reply: string, lastUser: string): string | null {

  if (!lastUser || !requiresFreshData(lastUser)) return null

  if (looksLikePlaceholderTemplate(reply)) {

    return 'Unable to provide grounded results right now. Please try again with city + state and a timeframe.'

  }

  return null

}



function chatJsonResponse(reply: string, pending: PendingWebSearchConfirmation | null) {
  return {
    reply,
    ...(pending ? { pendingWebSearchConfirmation: pending } : {}),
  }
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

    .slice(-20)



  if (messages.length === 0) {

    return sendError(res, 400, 'Please provide at least one message.')

  }



  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

  const hasUploadedDocument = Boolean(body.uploadedDocumentText?.trim())

  const searchAction = lastUser
    ? resolveWebSearchAction(messages, lastUser, {
        confirmWebSearch: body.confirmWebSearch,
        pendingWebSearchConfirmation: body.pendingWebSearchConfirmation,
      })
    : { action: 'none' as const }



  const starterKind = lastUser ? matchStarterPrompt(lastUser) : null

  const docOnly = Boolean(lastUser && isExplicitDocumentRequest(lastUser, hasUploadedDocument))

  const systemDocOnly = docOnly

    ? '\n\nIf the user requests a resume, CV, cover letter, or any written document, output ONLY the document text. Do NOT include any introduction, preface, commentary, or closing lines. Do not ask questions. The output must start immediately with the document content.'

    : ''



  let system = buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly



  // Bedrock: DuckDuckGo prefetch only after explicit search confirmation.

  if (aiProvider === 'bedrock' && searchAction.action === 'search') {

    try {

      const results = await webSearch(searchAction.intent.query, 3)

      if (results.length) {

        system = appendWebGroundingToInstructions(system, formatWebResultsForInstructions(results))

        logChat('bedrock_grounding', { resultCount: results.length, intentKind: searchAction.intent.kind })

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

      if (searchAction.action === 'search' && isLiveSearchIntent(searchAction.intent)) {

        logChat('route_live_search', {

          intentKind: searchAction.intent.kind,

          queryLength: searchAction.intent.query.length,

          confirmedViaButton: Boolean(body.confirmWebSearch),

        })



        const pipeline = await runLiveWebSearchPipeline({

          apiKey,

          baseInstructions: system,

          messages,

          intent: searchAction.intent,

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

      if (docOnly) {
        const docModel = selectChatModel({ hasUploadedDocument: true, isLiveWebSearch: false })
        logChat('route_document', { model: docModel })
        const docResult = await invokeOpenAiResponsesText({
          apiKey,
          model: docModel,
          instructions: system,
          messages,
          maxOutputTokens: 700,
        })
        const docReply = docResult.text.trim()
        if (!docReply) {
          return sendError(res, 502, 'The AI did not return a response. Please try again.')
        }
        logChat('request_complete', {
          path: 'document',
          model: docModel,
          latencyMs: Date.now() - requestStarted,
          replyLength: docReply.length,
        })
        return res.json({ reply: docReply })
      }

      const instructions = starterKind
        ? `${ system }\n\n${ STARTER_TURN_INSTRUCTIONS[starterKind] }`
        : system

      const chatResult = await invokeAdvisorChat({
        apiKey,
        instructions,
        messages,
        hasUploadedDocument,
        maxOutputTokens: hasUploadedDocument ? 700 : 500,
      })

      if (!chatResult.reply) {
        return sendError(res, 502, 'The AI did not return a response. Please try again.')
      }

      const blocked = blockIfHallucinated(chatResult.reply, lastUser)
      if (blocked) {
        return sendError(res, 502, blocked, 'chat_hallucination_guard')
      }

      logChat('request_complete', {
        path: starterKind ? 'starter' : 'chat',
        starterKind: starterKind ?? undefined,
        model: chatResult.model,
        structured: chatResult.structured,
        latencyMs: Date.now() - requestStarted,
        replyLength: chatResult.reply.length,
        hasPendingSearch: Boolean(chatResult.pendingWebSearchConfirmation),
      })

      return res.json(chatJsonResponse(chatResult.reply, chatResult.pendingWebSearchConfirmation))

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

  const bedrockSystem = starterKind
    ? `${ system }\n\n${ STARTER_TURN_INSTRUCTIONS[starterKind] }`
    : system

  try {

    const reply = (await invokeBedrockChat({ system: bedrockSystem, messages })).trim()



    if (!reply) {

      return sendError(res, 502, 'The AI did not return a response. Please try again.')

    }



    const blocked = blockIfHallucinated(reply, lastUser)

    if (blocked) {

      return sendError(res, 502, blocked, 'bedrock_hallucination_guard')

    }



    const pending = inferPendingOfferFromConversation(messages, {
      assistantAskedQuestion: reply.trimEnd().endsWith('?'),
    })

    logChat('request_complete', {

      path: 'bedrock',

      latencyMs: Date.now() - requestStarted,

      replyLength: reply.length,

      hasPendingSearch: Boolean(pending),

    })



    res.json(chatJsonResponse(reply, pending))
  } catch (err: unknown) {

    logChat('bedrock_error', {

      error: err instanceof Error ? err.message : String(err),

      latencyMs: Date.now() - requestStarted,

    })

    const hint = bedrockErrorHint(err, modelId)

    return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', hint)

  }

})


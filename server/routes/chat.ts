import express from 'express'

import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt.js'
import { getAiProvider, getOpenAiConfig } from '../lib/aiProvider.js'
import { logChat } from '../lib/chatLog.js'
import { getEnv, requireEnv } from '../lib/env.js'
import { sendError } from '../lib/errors.js'
import { looksLikePlaceholderTemplate } from '../lib/hallucinationGuard.js'
import { invokePlainAdvisorChat } from '../lib/plainChat.js'
import { invokeOpenAiResponsesText } from '../lib/openaiResponses.js'
import { selectChatModel } from '../lib/openaiModels.js'
import { matchStarterPrompt, STARTER_TURN_INSTRUCTIONS } from '../lib/starterPrompts.js'
import { shouldShowSearchOnline, type WebSearchTopic } from '../lib/searchIntent.js'
import { bedrockErrorHint, invokeBedrockChat } from '../lib/bedrockChat.js'

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

function isExplicitDocumentRequest(q: string, hasUploadedDocument: boolean): boolean {
  if (matchStarterPrompt(q)) return false
  const s = q.toLowerCase()
  const doc = /\b(resume|résumé|cv|curriculum vitae|cover letter)\b/
  const action = /\b(write|draft|generate|create|format|rewrite|revise|tailor|update|improve|edit|fix)\b/
  if (!doc.test(s) || (!action.test(s) && !/\btailored\b/.test(s))) return false
  if (!hasUploadedDocument && /\b(write|create|draft|build)\s+(my\s+)?(resume|cv)\b/.test(s)) return false
  return true
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
    return res.status(500).json({ error: 'Missing required environment variable', missing, provider: aiProvider })
  }

  const messages = body.messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && isNonEmptyString(m.content))
    .slice(-20)

  if (messages.length === 0) {
    return sendError(res, 400, 'Please provide at least one message.')
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const hasUploadedDocument = Boolean(body.uploadedDocumentText?.trim())
  const starterKind = lastUser ? matchStarterPrompt(lastUser) : null
  const docOnly = Boolean(lastUser && isExplicitDocumentRequest(lastUser, hasUploadedDocument))

  const systemDocOnly = docOnly
    ? '\n\nIf the user requests a resume, CV, cover letter, or any written document, output ONLY the document text. Do NOT include any introduction, preface, commentary, or closing lines. Do not ask questions. The output must start immediately with the document content.'
    : ''

  const instructions = starterKind
    ? `${ buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly }\n\n${ STARTER_TURN_INSTRUCTIONS[starterKind] }`
    : buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly

  const searchHint = shouldShowSearchOnline(messages)

  if (aiProvider === 'openai') {
    const { apiKey } = getOpenAiConfig()
    if (!apiKey) {
      return sendError(res, 500, 'Server is missing OpenAI configuration. Set OPENAI_API_KEY in your .env when AI_PROVIDER=openai.')
    }

    try {
      let reply = ''
      let model = ''
      let modelCallMs = 0
      let fallbackUsed = false

      if (docOnly) {
        model = selectChatModel({ hasUploadedDocument: true, isLiveWebSearch: false })
        const docStarted = Date.now()
        const docResult = await invokeOpenAiResponsesText({
          apiKey,
          model,
          instructions,
          messages,
          maxOutputTokens: 700,
        })
        modelCallMs = Date.now() - docStarted
        reply = docResult.text.trim()
      } else {
        const chat = await invokePlainAdvisorChat({
          apiKey,
          instructions,
          messages,
          hasUploadedDocument,
          maxOutputTokens: hasUploadedDocument ? 600 : 320,
        })
        reply = chat.reply
        model = chat.model
        modelCallMs = chat.modelCallMs
        fallbackUsed = chat.fallbackUsed
      }

      if (!reply) {
        return sendError(res, 502, 'The AI did not return a response. Please try again.')
      }

      if (looksLikePlaceholderTemplate(reply)) {
        return sendError(res, 502, 'Unable to provide grounded results right now. Please try again.')
      }

      const serializeStarted = Date.now()
      const payload: {
        reply: string
        showSearchOnline?: boolean
        suggestedSearchTopic?: WebSearchTopic
      } = { reply }
      if (searchHint.show) {
        payload.showSearchOnline = true
        payload.suggestedSearchTopic = searchHint.topic
      }
      const serializeMs = Date.now() - serializeStarted

      logChat('request_timing', {
        path: docOnly ? 'document' : starterKind ? 'starter' : 'chat',
        totalMs: Date.now() - requestStarted,
        modelCallMs,
        serializeMs,
        webSearch: false,
        fallbackUsed,
        model,
        uploadedDoc: hasUploadedDocument,
        messageCount: messages.length,
      })

      return res.json(payload)
    } catch (err: unknown) {
      logChat('openai_error', { error: err instanceof Error ? err.message : String(err) })
      return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', err instanceof Error ? err.message : undefined)
    }
  }

  try {
    requireEnv('AWS_REGION', 'BEDROCK_MODEL_ID')
  } catch (e: unknown) {
    return sendError(res, 500, 'Server is missing AWS configuration.', e instanceof Error ? e.message : undefined)
  }

  const modelId = getEnv().BEDROCK_MODEL_ID ?? ''
  try {
    const reply = (await invokeBedrockChat({ system: instructions, messages })).trim()
    if (!reply) {
      return sendError(res, 502, 'The AI did not return a response. Please try again.')
    }

    const payload: {
      reply: string
      showSearchOnline?: boolean
      suggestedSearchTopic?: WebSearchTopic
    } = { reply }
    if (searchHint.show) {
      payload.showSearchOnline = true
      payload.suggestedSearchTopic = searchHint.topic
    }

    logChat('request_timing', {
      path: 'bedrock',
      totalMs: Date.now() - requestStarted,
      webSearch: false,
      fallbackUsed: false,
      uploadedDoc: hasUploadedDocument,
    })

    return res.json(payload)
  } catch (err: unknown) {
    const hint = bedrockErrorHint(err, modelId)
    return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', hint)
  }
})

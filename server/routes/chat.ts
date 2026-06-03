import express from 'express'

import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt.js'
import { createRequestId, logChat, logChat502 } from '../lib/chatLog.js'
import { sendError } from '../lib/errors.js'
import { looksLikeUngroundedSearchClaim } from '../lib/hallucinationGuard.js'
import { invokePlainAdvisorChat } from '../lib/plainChat.js'
import { invokeOpenAiResponsesText, type ResponsesInvokeResult } from '../lib/openaiResponses.js'
import { streamOpenAiResponsesText } from '../lib/openaiResponsesStream.js'
import { getOpenAiConfig, missingOpenAiEnv, selectChatModel } from '../lib/openaiModels.js'
import { endSse, initSse, writeSse } from '../lib/sse.js'
import { shouldStreamAdvisorReply } from '../lib/streamingPolicy.js'
import { isQuickActionId } from '../lib/quickActions.js'

type ChatRequestSource = 'typed' | 'quick_option'

type ChatRequestBody = {
  messages: ChatMessage[]
  language: string
  uploadedDocumentText?: string
  source?: ChatRequestSource
  quickAction?: string
  stream?: boolean
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isExplicitDocumentRequest(q: string, hasUploadedDocument: boolean): boolean {
  const s = q.toLowerCase()
  const doc = /\b(resume|résumé|cv|curriculum vitae|cover letter)\b/
  const action = /\b(write|draft|generate|create|format|rewrite|revise|tailor|update|improve|edit|fix)\b/
  if (!doc.test(s) || (!action.test(s) && !/\btailored\b/.test(s))) return false
  if (!hasUploadedDocument && /\b(write|create|draft|build)\s+(my\s+)?(resume|cv)\b/.test(s)) return false
  return true
}

function normalizeSource(source: unknown): ChatRequestSource {
  return source === 'quick_option' ? 'quick_option' : 'typed'
}

function resultDiagnostics(result: ResponsesInvokeResult | null | undefined) {
  return {
    rawResponseLength: result?.rawBodyLength,
    parsedResponseLength: result?.parsedTextLength,
    responseStatus: result?.responseStatus,
    outputItemTypes: result?.outputItemTypes,
    incompleteReason: result?.incompleteReason,
  }
}

export const chatRouter = express.Router()

chatRouter.post('/', async (req, res) => {
  const requestId = createRequestId()
  const requestStarted = Date.now()
  const body = req.body as ChatRequestBody

  if (!body || !Array.isArray(body.messages) || !isNonEmptyString(body.language)) {
    return sendError(res, 400, 'Invalid request. Expected { messages: [...], language: string }.')
  }

  const source = normalizeSource(body.source)
  const quickAction = isQuickActionId(body.quickAction) ? body.quickAction : undefined
  const missing = missingOpenAiEnv()
  if (missing.length) {
    logChat('config_error', { requestId, missing: missing.join(',') })
    return sendError(res, 500, 'Server is missing OpenAI configuration. Set OPENAI_API_KEY in your environment.', `Missing: ${ missing.join(', ') }`)
  }

  const messages = body.messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && isNonEmptyString(m.content))
    .slice(-20)

  if (messages.length === 0) {
    return sendError(res, 400, 'Please provide at least one message.')
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const hasUploadedDocument = Boolean(body.uploadedDocumentText?.trim())
  const docOnly = Boolean(lastUser && isExplicitDocumentRequest(lastUser, hasUploadedDocument))

  const systemDocOnly = docOnly
    ? '\n\nIf the user requests a resume, CV, cover letter, or any written document, output ONLY the document text. Do NOT include any introduction, preface, commentary, or closing lines. Do not ask questions. The output must start immediately with the document content.'
    : ''

  const instructions = buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly

  logChat('chat_request', {
    requestId,
    source,
    quickAction,
    messageCount: messages.length,
    lastUserLength: lastUser.length,
    lastUserPreview: lastUser.slice(0, 80),
    uploadedDoc: hasUploadedDocument,
    docOnly,
  })

  const { apiKey } = getOpenAiConfig()
  if (!apiKey) {
    return sendError(res, 500, 'Server is missing OpenAI configuration. Set OPENAI_API_KEY in your environment.')
  }

  const useStream = shouldStreamAdvisorReply({
    clientWantsStream: Boolean(body.stream),
    docOnly,
    userMessage: lastUser,
    quickAction,
    hasUploadedDocument,
  })

  if (useStream) {
    initSse(res)
    const model = selectChatModel({ hasUploadedDocument })
    const maxOutputTokens = hasUploadedDocument ? 800 : 600
    const streamStarted = Date.now()

    try {
      let reply = ''
      const result = await streamOpenAiResponsesText({
        apiKey,
        model,
        instructions,
        messages,
        maxOutputTokens,
        reasoningEffort: 'minimal',
        onDelta: (chunk) => {
          reply += chunk
          writeSse(res, 'delta', { text: chunk })
        },
      })

      reply = result.text.trim()

      if (reply && looksLikeUngroundedSearchClaim(reply)) {
        logChat('ungrounded_listing_claim', { requestId, model, path: 'chat' })
      }

      if (!reply) {
        const diag = resultDiagnostics(result)
        logChat502({
          requestId,
          lastUserMessage: lastUser,
          route: '/api/chat',
          model,
          uploadPresent: hasUploadedDocument,
          retryUsed: false,
          path: 'chat',
          messageCount: messages.length,
          ...diag,
        })
        writeSse(res, 'error', { message: 'The AI did not return a response. Please try again.' })
        endSse(res)
        return
      }

      logChat('request_timing', {
        requestId,
        path: 'chat',
        source,
        quickAction,
        totalMs: Date.now() - requestStarted,
        modelCallMs: Date.now() - streamStarted,
        fallbackUsed: false,
        model,
        uploadedDoc: hasUploadedDocument,
        messageCount: messages.length,
        lastUserPreview: lastUser.slice(0, 80),
        streamed: true,
      })

      writeSse(res, 'done', { reply })
      endSse(res)
      return
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logChat502({
        requestId,
        lastUserMessage: lastUser,
        route: '/api/chat',
        model,
        uploadPresent: hasUploadedDocument,
        retryUsed: false,
        exception: errorMessage,
        path: 'chat',
        messageCount: messages.length,
      })
      logChat('openai_error', { requestId, source, error: errorMessage })
      writeSse(res, 'error', {
        message: 'Unable to get an AI response right now. Please try again in a moment.',
        details: errorMessage,
      })
      endSse(res)
      return
    }
  }

  let reply = ''
  let model = ''
  let modelCallMs = 0
  let fallbackUsed = false
  let path: 'document' | 'chat' = docOnly ? 'document' : 'chat'
  let lastModelResult: ResponsesInvokeResult | null = null

  try {
    if (docOnly) {
      model = selectChatModel({ hasUploadedDocument: true })
      const docStarted = Date.now()
      const docResult = await invokeOpenAiResponsesText({
        apiKey,
        model,
        instructions,
        messages,
        maxOutputTokens: 900,
        reasoningEffort: 'minimal',
      })
      modelCallMs = Date.now() - docStarted
      lastModelResult = docResult
      reply = docResult.text.trim()
    } else {
      const chat = await invokePlainAdvisorChat({
        apiKey,
        instructions,
        messages,
        hasUploadedDocument,
        maxOutputTokens: hasUploadedDocument ? 800 : 600,
        requestId,
      })
      reply = chat.reply
      model = chat.model
      modelCallMs = chat.modelCallMs
      fallbackUsed = chat.fallbackUsed
      lastModelResult = chat.lastResult
      path = 'chat'
    }

    if (reply && looksLikeUngroundedSearchClaim(reply)) {
      logChat('ungrounded_listing_claim', { requestId, model, path })
    }

    if (!reply) {
      const diag = resultDiagnostics(lastModelResult)
      logChat502({
        requestId,
        lastUserMessage: lastUser,
        route: '/api/chat',
        model,
        uploadPresent: hasUploadedDocument,
        retryUsed: fallbackUsed,
        path,
        messageCount: messages.length,
        ...diag,
      })
      logChat('chat_empty_reply', { requestId, source, model, fallbackUsed, path, ...diag })
      return sendError(res, 502, 'The AI did not return a response. Please try again.')
    }

    logChat('request_timing', {
      requestId,
      path,
      source,
      quickAction,
      totalMs: Date.now() - requestStarted,
      modelCallMs,
      fallbackUsed,
      model,
      uploadedDoc: hasUploadedDocument,
      messageCount: messages.length,
      lastUserPreview: lastUser.slice(0, 80),
    })

    return res.json({ reply })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const diag = resultDiagnostics(lastModelResult)
    logChat502({
      requestId,
      lastUserMessage: lastUser,
      route: '/api/chat',
      model,
      uploadPresent: hasUploadedDocument,
      retryUsed: fallbackUsed,
      exception: errorMessage,
      path,
      messageCount: messages.length,
      ...diag,
    })
    logChat('openai_error', { requestId, source, error: errorMessage })
    return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', errorMessage)
  }
})

import express from 'express'

import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt.js'
import { createRequestId, logChat, logChat502 } from '../lib/chatLog.js'
import { sendError } from '../lib/errors.js'
import { looksLikeUngroundedSearchClaim } from '../lib/hallucinationGuard.js'
import { invokePlainAdvisorChat } from '../lib/plainChat.js'
import { invokeOpenAiResponsesText, type ResponsesInvokeResult } from '../lib/openaiResponses.js'
import { getOpenAiConfig, missingOpenAiEnv, selectChatModel } from '../lib/openaiModels.js'

type ChatRequestSource = 'typed' | 'quick_option'

type ChatRequestBody = {
  messages: ChatMessage[]
  language: string
  uploadedDocumentText?: string
  source?: ChatRequestSource
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

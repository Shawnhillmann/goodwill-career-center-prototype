import express from 'express'

import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt.js'
import { logChat } from '../lib/chatLog.js'
import { sendError } from '../lib/errors.js'
import { looksLikePlaceholderTemplate } from '../lib/hallucinationGuard.js'
import { invokePlainAdvisorChat } from '../lib/plainChat.js'
import { invokeOpenAiResponsesText } from '../lib/openaiResponses.js'
import { getOpenAiConfig, missingOpenAiEnv, selectChatModel } from '../lib/openaiModels.js'
import { buildConciseSearchQuery, shouldRunWebSearch } from '../lib/searchIntent.js'
import { runLiveWebSearchPipeline } from '../lib/webSearchPipeline.js'

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

export const chatRouter = express.Router()

chatRouter.post('/', async (req, res) => {
  const requestStarted = Date.now()
  const body = req.body as ChatRequestBody

  if (!body || !Array.isArray(body.messages) || !isNonEmptyString(body.language)) {
    return sendError(res, 400, 'Invalid request. Expected { messages: [...], language: string }.')
  }

  const source = normalizeSource(body.source)
  const missing = missingOpenAiEnv()
  if (missing.length) {
    logChat('config_error', { missing: missing.join(',') })
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
  const searchDecision = shouldRunWebSearch(messages, hasUploadedDocument)

  const systemDocOnly = docOnly
    ? '\n\nIf the user requests a resume, CV, cover letter, or any written document, output ONLY the document text. Do NOT include any introduction, preface, commentary, or closing lines. Do not ask questions. The output must start immediately with the document content.'
    : ''

  const instructions = buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly

  logChat('chat_request', {
    source,
    messageCount: messages.length,
    lastUserLength: lastUser.length,
    lastUserPreview: lastUser.slice(0, 80),
    uploadedDoc: hasUploadedDocument,
    webSearch: searchDecision.run,
    searchTopic: searchDecision.run ? searchDecision.topic : undefined,
    docOnly,
  })

  const { apiKey } = getOpenAiConfig()
  if (!apiKey) {
    return sendError(res, 500, 'Server is missing OpenAI configuration. Set OPENAI_API_KEY in your environment.')
  }

  try {
    let reply = ''
    let model = ''
    let modelCallMs = 0
    let fallbackUsed = false
    let path: 'document' | 'search' | 'chat' = docOnly ? 'document' : 'chat'

    if (searchDecision.run && !docOnly) {
      const topic = searchDecision.topic
      const query = buildConciseSearchQuery(messages, topic)
      logChat('route_search', { topic, queryLength: query.length, source })

      const searchStarted = Date.now()
      const pipeline = await runLiveWebSearchPipeline({
        apiKey,
        baseInstructions: instructions,
        messages,
        intent: { kind: topic, query },
      })
      modelCallMs = Date.now() - searchStarted
      if (pipeline.ok) {
        model = pipeline.model
        fallbackUsed = pipeline.stage !== 'A_mini_auto'
      }

      if (pipeline.ok && !looksLikePlaceholderTemplate(pipeline.reply)) {
        path = 'search'
        reply = pipeline.reply.trim()
      } else {
        logChat('search_fallback_to_chat', {
          source,
          topic,
          ok: pipeline.ok,
          stage: pipeline.ok ? pipeline.stage : undefined,
        })
      }
    }

    if (!reply) {
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
        path = 'chat'
      }
    }

    if (!reply) {
      logChat('chat_empty_reply', { source, model, fallbackUsed, path })
      return sendError(res, 502, 'The AI did not return a response. Please try again.')
    }

    logChat('request_timing', {
      path,
      source,
      totalMs: Date.now() - requestStarted,
      modelCallMs,
      webSearch: path === 'search',
      fallbackUsed,
      model,
      uploadedDoc: hasUploadedDocument,
      messageCount: messages.length,
      lastUserPreview: lastUser.slice(0, 80),
    })

    return res.json({ reply })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logChat('openai_error', { source, error: errorMessage, webSearch: searchDecision.run })
    return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', errorMessage)
  }
})

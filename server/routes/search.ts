import express from 'express'

import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt.js'
import { logChat } from '../lib/chatLog.js'
import { sendError } from '../lib/errors.js'
import { extractHttpLinks, looksLikePlaceholderTemplate } from '../lib/hallucinationGuard.js'
import { getOpenAiConfig, missingOpenAiEnv } from '../lib/openaiModels.js'
import { buildConciseSearchQuery, shouldRunWebSearch } from '../lib/searchIntent.js'
import { runLiveWebSearchPipeline } from '../lib/webSearchPipeline.js'

type SearchRequestBody = {
  messages: ChatMessage[]
  language: string
  uploadedDocumentText?: string
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g

function extractSourcesFromReply(reply: string): Array<{ title: string; url: string }> {
  const sources: Array<{ title: string; url: string }> = []
  const seen = new Set<string>()

  for (const match of reply.matchAll(MARKDOWN_LINK)) {
    const title = match[1]?.trim()
    const url = match[2]?.replace(/[.,;:!?)]+$/, '')
    if (!url || seen.has(url)) continue
    seen.add(url)
    sources.push({ title: title || url, url })
  }

  for (const url of extractHttpLinks(reply)) {
    if (seen.has(url)) continue
    seen.add(url)
    sources.push({ title: url, url })
  }

  return sources.slice(0, 5)
}

/** Dedicated live-search endpoint (rare). Prefer /api/chat which decides automatically. */
export const searchRouter = express.Router()

searchRouter.post('/', async (req, res) => {
  const requestStarted = Date.now()
  const body = req.body as SearchRequestBody

  if (!body || !Array.isArray(body.messages) || !isNonEmptyString(body.language)) {
    return sendError(res, 400, 'Invalid request. Expected { messages: [...], language: string }.')
  }

  const missing = missingOpenAiEnv()
  if (missing.length) {
    return sendError(res, 500, 'Server is missing OpenAI configuration.', `Missing: ${ missing.join(', ') }`)
  }

  const { apiKey } = getOpenAiConfig()
  if (!apiKey) {
    return sendError(res, 500, 'Server is missing OpenAI configuration.')
  }

  const messages = body.messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && isNonEmptyString(m.content))
    .slice(-20)

  if (messages.length === 0) {
    return sendError(res, 400, 'Please provide at least one message.')
  }

  const hasUploadedDocument = Boolean(body.uploadedDocumentText?.trim())
  const searchDecision = shouldRunWebSearch(messages, hasUploadedDocument)
  if (!searchDecision.run) {
    return sendError(res, 400, 'This request does not require live web search. Use /api/chat instead.')
  }

  const topic = searchDecision.topic
  const query = buildConciseSearchQuery(messages, topic)
  const system = buildSystemPrompt(body.language, body.uploadedDocumentText)

  logChat('route_search', { topic, queryLength: query.length, path: 'search_api' })

  const searchStarted = Date.now()
  try {
    const pipeline = await runLiveWebSearchPipeline({
      apiKey,
      baseInstructions: system,
      messages,
      intent: { kind: topic, query },
    })
    const modelCallMs = Date.now() - searchStarted

    if (!pipeline.ok) {
      return sendError(res, 502, pipeline.userMessage, pipeline.detail)
    }

    if (looksLikePlaceholderTemplate(pipeline.reply)) {
      return sendError(res, 502, 'Unable to provide grounded results right now. Please try again.')
    }

    const sources = extractSourcesFromReply(pipeline.reply)

    logChat('request_timing', {
      path: 'search',
      totalMs: Date.now() - requestStarted,
      modelCallMs,
      webSearch: true,
      fallbackUsed: pipeline.stage !== 'A_mini_auto',
      model: pipeline.model,
      uploadedDoc: hasUploadedDocument,
      stage: pipeline.stage,
    })

    return res.json({
      reply: pipeline.reply,
      ...(sources.length ? { sources } : {}),
    })
  } catch (err: unknown) {
    logChat('search_error', { error: err instanceof Error ? err.message : String(err) })
    return sendError(res, 502, 'Unable to retrieve live results right now. Please try again in a moment.', err instanceof Error ? err.message : undefined)
  }
})

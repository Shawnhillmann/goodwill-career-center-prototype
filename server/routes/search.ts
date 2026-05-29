import express from 'express'

import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt.js'
import { getAiProvider, getOpenAiConfig } from '../lib/aiProvider.js'
import { logChat } from '../lib/chatLog.js'
import { sendError } from '../lib/errors.js'
import { extractHttpLinks, looksLikePlaceholderTemplate } from '../lib/hallucinationGuard.js'
import {
  buildConciseSearchQuery,
  inferSearchTopic,
  isExplicitWebSearchCommand,
  type WebSearchTopic,
} from '../lib/searchIntent.js'
import { runLiveWebSearchPipeline } from '../lib/webSearchPipeline.js'

type SearchRequestBody = {
  messages: ChatMessage[]
  language: string
  uploadedDocumentText?: string
  suggestedSearchTopic?: WebSearchTopic
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

export const searchRouter = express.Router()

searchRouter.post('/', async (req, res) => {
  const requestStarted = Date.now()
  const body = req.body as SearchRequestBody

  if (!body || !Array.isArray(body.messages) || !isNonEmptyString(body.language)) {
    return sendError(res, 400, 'Invalid request. Expected { messages: [...], language: string }.')
  }

  if (getAiProvider() !== 'openai') {
    return sendError(res, 501, 'Live web search requires OpenAI. Set AI_PROVIDER=openai for search.')
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

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  if (!isExplicitWebSearchCommand(lastUser) && lastUser.toLowerCase() !== 'search online') {
    return sendError(res, 400, 'Search requires explicit confirmation (Search online button or search command).')
  }

  const topic = body.suggestedSearchTopic ?? inferSearchTopic(messages)
  const query = buildConciseSearchQuery(messages, topic)
  const system = buildSystemPrompt(body.language, body.uploadedDocumentText)

  logChat('route_search', { topic, queryLength: query.length })

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
    const serializeMs = Date.now() - searchStarted - modelCallMs

    logChat('request_timing', {
      path: 'search',
      totalMs: Date.now() - requestStarted,
      modelCallMs,
      serializeMs,
      webSearch: true,
      fallbackUsed: pipeline.stage !== 'A_mini_auto',
      model: pipeline.model,
      uploadedDoc: Boolean(body.uploadedDocumentText?.trim()),
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

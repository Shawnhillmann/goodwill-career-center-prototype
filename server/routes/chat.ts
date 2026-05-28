import express from 'express'
import { buildSystemPrompt, type ChatMessage } from '../lib/advisorPrompt'
import { getAiProvider, getOpenAiConfig } from '../lib/aiProvider'
import { bedrockErrorHint, invokeBedrockChat } from '../lib/bedrockChat'
import { getEnv, requireEnv } from '../lib/env'
import { sendError } from '../lib/errors'
import { invokeOpenAiChat } from '../lib/openaiChat'
import { webSearch } from '../lib/webSearch'

type ChatRequestBody = {
  messages: ChatMessage[]
  language: string
  uploadedDocumentText?: string
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

type SearchIntent =
  | { kind: 'none' }
  | { kind: 'jobs'; query: string; needsClarification: boolean; questions: string[] }
  | { kind: 'events'; query: string; needsClarification: boolean; questions: string[] }
  | { kind: 'general'; query: string; needsClarification: boolean; questions: string[] }

function hasLocationHint(s: string) {
  return (
    /\b(in|near|around)\b\s+[a-z]/i.test(s) ||
    /\b(ct|ma|ny|ri|nh|vt)\b/i.test(s) ||
    /\b(remote)\b/i.test(s.toLowerCase())
  )
}

function hasTimeHint(s: string) {
  return (
    /\b(today|tomorrow|this week|this month|next week|next month|upcoming)\b/i.test(s) ||
    /\b(20\d{2})\b/.test(s)
  )
}

function detectSearchIntent(q: string): SearchIntent {
  const s = q.trim()
  const lower = s.toLowerCase()
  if (!s) return { kind: 'none' }
  if (lower.includes('http://') || lower.includes('https://')) return { kind: 'none' }

  const explicitSearch = /\b(web\s*search|google|search\s+the\s+web|look\s+this\s+up)\b/.test(lower)
  const hasFindIntent = /\b(find|search|look\s*up|show\s*me)\b/.test(lower)
  const hasJobIntent = /\b(job|jobs|opening|openings|hiring|apply|positions|listings)\b/.test(lower)
  const hasEventIntent =
    /\b(job fair|job fairs|career fair|career fairs|hiring event|hiring events|career expo|job expo|recruiting event|recruiting events|job festival|career event|career events)\b/.test(
      lower,
    )
  const hasLocalResourceIntent =
    /\b(local resources|resources near me|community resources|career center|workshop|workshops|training event|training events)\b/.test(
      lower,
    )

  // Jobs
  if ((hasFindIntent || explicitSearch) && hasJobIntent) {
    const hasLocation = hasLocationHint(s)
    const hasRoleKeyword = /\b(retail|cashier|sales|warehouse|driver|manager|customer service|associate)\b/i.test(s)
    const needsClarification = !(hasLocation && hasRoleKeyword)
    const questions: string[] = []
    if (!hasRoleKeyword) questions.push('What kind of role are you looking for (e.g., cashier, sales associate, store manager, warehouse, customer service)?')
    if (!hasLocation) questions.push('What location should I search (city + state, or “remote”)?')
    return { kind: 'jobs', query: s, needsClarification, questions: questions.slice(0, 2) }
  }

  // Events / local resources (fresh/local data)
  if ((hasFindIntent || explicitSearch || hasEventIntent || hasLocalResourceIntent) && (hasEventIntent || hasLocalResourceIntent)) {
    const hasLocation = hasLocationHint(s)
    const needsClarification = !hasLocation
    const questions: string[] = []
    if (!hasLocation) questions.push('What city + state should I search?')
    if (!hasTimeHint(s)) questions.push('What timeframe should I search (e.g., “this month”, a specific date range, or “this weekend”)?')
    return { kind: 'events', query: s, needsClarification, questions: questions.slice(0, 2) }
  }

  // General explicit web search
  if (explicitSearch) {
    const cleaned = s.replace(/\b(web\s*search|google|search\s+the\s+web|look\s+this\s+up)\b/i, '').trim()
    const query = cleaned || s
    const needsClarification = query.length < 6
    const questions = needsClarification
      ? ['What exactly should I look up on the web?', 'Are you looking to buy something, find a local place, or just get information?']
      : []
    return { kind: 'general', query, needsClarification, questions: questions.slice(0, 2) }
  }

  return { kind: 'none' }
}

function looksLikePlaceholderTemplate(text: string): boolean {
  const s = text.toLowerCase()
  return (
    /\[searching for/.test(s) ||
    /\[insert (specific )?(date|time|location)/.test(s) ||
    /\binsert (specific )?(date|time|location)\b/.test(s) ||
    s.includes('please hold on for a moment') ||
    (s.includes('let me look up') && !s.includes('http'))
  )
}

function requiresFreshData(userText: string): boolean {
  const s = userText.toLowerCase()
  return (
    /\b(job fair|job fairs|career fair|career fairs|hiring event|hiring events|career expo|recruiting event|recruiting events)\b/.test(s) ||
    /\b(this week|this month|next week|next month|upcoming|today|tomorrow)\b/.test(s) ||
    /\b(local resources|near me)\b/.test(s)
  )
}

function formatWebResultsReply(q: string, results: Array<{ title: string; url: string; snippet?: string }>) {
  if (!results.length) {
    return `I tried a quick web search for “${ q }”, but I couldn’t find results right now.\n\nTry rephrasing (e.g., include the city/state) or try again in a moment.`
  }

  const lines = [
    `**Here are a few results I found on the web for:** ${ q }`,
    '',
    ...results.map((r, i) => {
      const snippet = r.snippet ? `\n  - ${ r.snippet }` : ''
      return `${ i + 1 }. [${ r.title }](${ r.url })${ snippet }`
    }),
    '',
    'Want me to narrow this down (full-time vs part-time, pay range, distance, or specific store/company)?',
  ]
  return lines.join('\n')
}

function webResultsToContext(results: Array<{ title: string; url: string; snippet?: string }>) {
  return results
    .map((r, i) => {
      const snippet = r.snippet ? `\nSnippet: ${ r.snippet }` : ''
      return `Result ${ i + 1 }:\nTitle: ${ r.title }\nURL: ${ r.url }${ snippet }`
    })
    .join('\n\n')
}

function isExplicitDocumentRequest(q: string): boolean {
  const s = q.toLowerCase()
  return (
    /\b(resume|résumé|cv|curriculum vitae)\b/.test(s) ||
    /\bcover letter\b/.test(s) ||
    (/\b(write|draft|generate|create|format)\b/.test(s) && /\b(resume|résumé|cv|cover letter|letter)\b/.test(s))
  )
}

export const chatRouter = express.Router()

chatRouter.post('/', async (req, res) => {
  const body = req.body as ChatRequestBody

  if (!body || !Array.isArray(body.messages) || !isNonEmptyString(body.language)) {
    return sendError(res, 400, 'Invalid request. Expected { messages: [...], language: string }.')
  }

  const messages = body.messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && isNonEmptyString(m.content))
    .slice(-30)

  if (messages.length === 0) {
    return sendError(res, 400, 'Please provide at least one message.')
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const intent = lastUser ? detectSearchIntent(lastUser) : { kind: 'none' as const }
  // For any search intent, we always route through the AI model so the response
  // is localized and consistent (no hard-coded assistant text). We only use webSearch()
  // to retrieve fresh data and pass it back into the model.

  const aiProvider = getAiProvider()
  const docOnly = Boolean(lastUser && isExplicitDocumentRequest(lastUser))
  const systemDocOnly = docOnly
    ? '\n\nIf the user requests a resume, CV, cover letter, or any written document, output ONLY the document text. Do NOT include any introduction, preface, commentary, or closing lines (no “Sure…”, no “Here is…”, no “Feel free…”, no “Would you like help…”). Do not ask questions. The output must start immediately with the document content.'
    : ''

  const searchSystemSuffix =
    intent.kind === 'jobs' || intent.kind === 'events' || intent.kind === 'general'
      ? '\n\nIf a user request requires fresh/local/time-sensitive information, ask 1–2 clarifying questions before searching. When you do provide results, include only links that came from the web search context provided to you. Do not fabricate events, dates, locations, or pretend you searched if no results were provided.'
      : ''

  const system = buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly + searchSystemSuffix

  // Optionally retrieve web results first (only when intent is specific enough).
  let webContext: string | null = null
  if ((intent.kind === 'jobs' || intent.kind === 'events' || intent.kind === 'general') && !intent.needsClarification) {
    try {
      const results = await webSearch(intent.query, 6)
      webContext = results.length ? webResultsToContext(results) : null
    } catch (err: unknown) {
      const hint = err instanceof Error ? err.message : String(err)
      return sendError(res, 502, 'Web search is temporarily unavailable. Please try again in a moment.', hint)
    }
  }

  const messagesWithWebContext: ChatMessage[] = webContext
    ? [
        ...messages,
        {
          role: 'assistant',
          content:
            'WEB_SEARCH_RESULTS (for grounding; do not invent beyond these):\n\n' +
            webContext +
            '\n\nWhen you answer, cite the relevant URLs.',
        },
      ]
    : messages

  if (aiProvider === 'openai') {
    const { apiKey, model } = getOpenAiConfig()
    if (!apiKey) {
      return sendError(
        res,
        500,
        'Server is missing OpenAI configuration. Set OPENAI_API_KEY in your .env when AI_PROVIDER=openai.',
      )
    }

    try {
      const reply = await invokeOpenAiChat({ apiKey, model, system, messages: messagesWithWebContext })

      if (!reply || !reply.trim()) {
        return sendError(res, 502, 'The AI did not return a response. Please try again.')
      }

      if (lastUser && requiresFreshData(lastUser) && looksLikePlaceholderTemplate(reply)) {
        return sendError(
          res,
          502,
          'Unable to provide grounded results right now.',
          'The assistant produced placeholders for a time-sensitive query; blocking to prevent hallucinations. Please try again with city + state and timeframe.',
        )
      }

      return res.json({ reply })
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('[chat] OpenAI error:', err)
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
    const reply = await invokeBedrockChat({ system, messages: messagesWithWebContext })

    if (!reply || !reply.trim()) {
      return sendError(res, 502, 'The AI did not return a response. Please try again.')
    }

    if (lastUser && requiresFreshData(lastUser) && looksLikePlaceholderTemplate(reply)) {
      return sendError(
        res,
        502,
        'Unable to provide grounded results right now.',
        'The assistant produced placeholders for a time-sensitive query; blocking to prevent hallucinations. Please try again with city + state and timeframe.',
      )
    }

    res.json({ reply })
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('[chat] Bedrock error:', (err as { name?: string })?.name ?? 'Error', err)
    const hint = bedrockErrorHint(err, modelId)
    return sendError(res, 502, 'Unable to get an AI response right now. Please try again in a moment.', hint)
  }
})

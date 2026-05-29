import type { ChatMessage } from './advisorPrompt.js'
import type { PendingWebSearchConfirmation, WebSearchTopic } from './searchIntent.js'
import { buildConciseSearchQuery } from './searchIntent.js'

export type StructuredAdvisorResponse = {
  reply: string
  offerWebSearch: PendingWebSearchConfirmation | null
}

export const STRUCTURED_ADVISOR_JSON_INSTRUCTIONS = `
RESPONSE FORMAT (required):
Return JSON only — no markdown fences, no extra keys.
{
  "reply": "<warm user-facing message in plain text>",
  "offerWebSearch": null OR {
    "topic": "jobs" | "local_resources" | "events" | "general",
    "querySoFar": "<concise search query, max 12 words>"
  }
}

offerWebSearch rules:
- Set to an object ONLY when your reply asks the user for permission to search the web for live/current results.
- Set to null when gathering info (location, role, preferences), coaching, resume help, or any non-search reply.
- querySoFar must be a short search-engine query: topic keywords + role (if known) + city/state or ZIP. Never paste conversation sentences.
- Examples: "retail jobs Middletown CT 06457", "job fairs Hartford CT", "Goodwill career center Middletown CT"
`.trim()

const ADVISOR_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    offerWebSearch: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              enum: ['jobs', 'local_resources', 'events', 'general'],
            },
            querySoFar: { type: 'string' },
          },
          required: ['topic', 'querySoFar'],
          additionalProperties: false,
        },
      ],
    },
  },
  required: ['reply', 'offerWebSearch'],
  additionalProperties: false,
} as const

export function advisorResponseJsonSchema() {
  return {
    type: 'json_schema' as const,
    name: 'advisor_chat_response',
    strict: true,
    schema: ADVISOR_RESPONSE_SCHEMA,
  }
}

const VALID_TOPICS = new Set<WebSearchTopic>(['jobs', 'local_resources', 'events', 'general'])

function isValidTopic(v: unknown): v is WebSearchTopic {
  return typeof v === 'string' && VALID_TOPICS.has(v as WebSearchTopic)
}

export function normalizeStructuredAdvisorResponse(
  raw: unknown,
  messages: ChatMessage[],
): StructuredAdvisorResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
  if (!reply) return null

  let offerWebSearch: PendingWebSearchConfirmation | null = null
  const offer = obj.offerWebSearch
  if (offer && typeof offer === 'object' && offer !== null && !Array.isArray(offer)) {
    const o = offer as Record<string, unknown>
    if (isValidTopic(o.topic)) {
      offerWebSearch = normalizePendingOffer(
        { topic: o.topic, querySoFar: typeof o.querySoFar === 'string' ? o.querySoFar : '' },
        messages,
      )
    }
  }

  return { reply, offerWebSearch }
}

export function normalizePendingOffer(
  offer: { topic: WebSearchTopic; querySoFar: string },
  messages: ChatMessage[],
): PendingWebSearchConfirmation | null {
  const topic = offer.topic
  let query = offer.querySoFar.trim().replace(/\s+/g, ' ')
  const wordCount = query.split(/\s+/).filter(Boolean).length
  if (!query || query.length > 120 || wordCount > 14) {
    query = buildConciseSearchQuery(messages, topic)
  }
  if (!query) return null
  return { topic, querySoFar: query.slice(0, 120) }
}

export function parseStructuredAdvisorJson(text: string, messages: ChatMessage[]): StructuredAdvisorResponse | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  try {
    return normalizeStructuredAdvisorResponse(JSON.parse(trimmed), messages)
  } catch {
    return null
  }
}

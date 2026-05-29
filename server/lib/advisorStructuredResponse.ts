import type { ChatMessage } from './advisorPrompt.js'
import type { PendingWebSearchConfirmation, WebSearchTopic } from './searchIntent.js'
import { buildConciseSearchQuery } from './searchIntent.js'

export type StructuredAdvisorResponse = {
  reply: string
  offerWebSearch: PendingWebSearchConfirmation | null
}

export const STRUCTURED_ADVISOR_JSON_INSTRUCTIONS = `
RESPONSE FORMAT (critical):
- Output ONE JSON object only. No markdown fences. No prose before or after the JSON.
- ALL user-visible words go in the "reply" string field only.
- Never put JSON, field names, offerWebSearch, topic, or querySoFar inside reply.

offerWebSearch rules:
- Set to an object ONLY when reply asks permission to search the web for live/current results.
- Set to null when gathering info, coaching, or resume help.
- querySoFar: short search query (max 12 words) — topic + role + city/state or ZIP.
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

const JSON_LEAK_MARKERS =
  /\{[\s\S]*"offerWebSearch"|\bofferWebSearch\b\s*[:{]|\b"?(reply|topic|querySoFar)"?\s*:\s*["{]/i

function isValidTopic(v: unknown): v is WebSearchTopic {
  return typeof v === 'string' && VALID_TOPICS.has(v as WebSearchTopic)
}

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function looksLikeJsonEnvelope(text: string): boolean {
  const t = text.trim()
  return t.startsWith('{') && (t.includes('"reply"') || t.includes("'reply'"))
}

/** Extract the first balanced `{ ... }` object from mixed model output. */
export function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]?.trim()) return fenced[1].trim()

  const start = text.indexOf('{')
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function sanitizeProseFragment(text: string): string {
  let s = text.trim()
  if (!s) return ''

  const jsonStart = s.search(/\n?\s*\{/)
  if (jsonStart >= 0 && JSON_LEAK_MARKERS.test(s.slice(jsonStart))) {
    s = s.slice(0, jsonStart).trim()
  }

  s = s.replace(/\n?\s*\{[\s\S]*"offerWebSearch"[\s\S]*$/i, '').trim()
  s = s.replace(/\bofferWebSearch\b\s*:\s*\{[\s\S]*?\}\s*,?\s*/gi, '').trim()
  s = s.replace(/^[\s,]*"?(reply|offerWebSearch|topic|querySoFar)"?\s*:\s*/gi, '').trim()
  s = s.replace(/^["']|["']$/g, '').trim()

  return s.trim()
}

/** Remove leaked JSON / schema fragments from user-visible prose (not full JSON envelopes). */
export function sanitizeVisibleReply(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  if (looksLikeJsonEnvelope(trimmed)) {
    const blob = extractJsonObject(trimmed)
    const parsed = safeJsonParse(blob ?? trimmed)
    if (parsed && typeof parsed === 'object') {
      const replyRaw = (parsed as Record<string, unknown>).reply
      if (typeof replyRaw === 'string' && replyRaw.trim()) {
        return sanitizeProseFragment(replyRaw)
      }
    }
  }

  return sanitizeProseFragment(trimmed)
}

export function normalizeStructuredAdvisorResponse(
  raw: unknown,
  messages: ChatMessage[],
): StructuredAdvisorResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const replyRaw = typeof obj.reply === 'string' ? obj.reply.trim() : ''
  const reply = sanitizeProseFragment(replyRaw)
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

  const direct = safeJsonParse(trimmed)
  if (direct) {
    const normalized = normalizeStructuredAdvisorResponse(direct, messages)
    if (normalized) return normalized
  }

  const jsonBlob = extractJsonObject(trimmed)
  if (jsonBlob) {
    const parsed = safeJsonParse(jsonBlob)
    const proseBefore = trimmed.slice(0, trimmed.indexOf(jsonBlob)).trim()
    if (parsed) {
      const normalized = normalizeStructuredAdvisorResponse(parsed, messages)
      if (normalized) {
        const reply = sanitizeProseFragment(proseBefore || normalized.reply)
        if (!reply) return null
        return { reply, offerWebSearch: normalized.offerWebSearch }
      }
    }
    if (proseBefore) {
      return { reply: sanitizeProseFragment(proseBefore), offerWebSearch: null }
    }
  }

  const sanitized = sanitizeProseFragment(trimmed)
  if (sanitized && !JSON_LEAK_MARKERS.test(sanitized)) {
    return { reply: sanitized, offerWebSearch: null }
  }

  return null
}

/** Best-effort visible reply from raw model output (structured JSON, mixed, or plain text). */
export function extractVisibleReplyFromModelOutput(
  text: string,
  messages: ChatMessage[],
): StructuredAdvisorResponse | null {
  const parsed = parseStructuredAdvisorJson(text, messages)
  if (parsed?.reply) return parsed

  const sanitized = sanitizeVisibleReply(text)
  if (sanitized) {
    return { reply: sanitized, offerWebSearch: null }
  }

  return null
}

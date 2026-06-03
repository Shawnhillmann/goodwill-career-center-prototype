import type { ChatMessage } from './advisorPrompt.js'
import { extractHttpLinks } from './hallucinationGuard.js'
import type { ReasoningEffort, ResponsesInvokeResult } from './openaiResponses.js'

const OPENAI_RESPONSES_TIMEOUT_MS = 55_000

type StreamEvent = {
  type?: string
  delta?: string
  error?: { message?: string }
  message?: string
}

function summarizeStreamResult(fullText: string, startedAt: number): ResponsesInvokeResult {
  const text = fullText.trim()
  return {
    text,
    linkCountInText: extractHttpLinks(text).length,
    latencyMs: Date.now() - startedAt,
    responseStatus: 'completed',
    rawBodyLength: 0,
    parsedTextLength: text.length,
    outputItemTypes: 'stream',
    hadMessageItem: text.length > 0,
  }
}

async function openAiResponsesStreamFetch(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OPENAI_RESPONSES_TIMEOUT_MS)
  try {
    return await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ apiKey }`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

function parseSseBuffer(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = []
  let splitAt = buffer.indexOf('\n\n')
  let cursor = 0

  while (splitAt !== -1) {
    const block = buffer.slice(cursor, splitAt)
    cursor = splitAt + 2
    const dataParts: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith('data:')) dataParts.push(line.slice(5).trim())
    }
    const dataStr = dataParts.join('\n')
    if (dataStr && dataStr !== '[DONE]') {
      try {
        events.push(JSON.parse(dataStr) as StreamEvent)
      } catch {
        // ignore partial blocks
      }
    }
    splitAt = buffer.indexOf('\n\n', cursor)
  }

  return { events, rest: buffer.slice(cursor) }
}

/** Stream assistant text deltas from the OpenAI Responses API. */
export async function streamOpenAiResponsesText(params: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  maxOutputTokens?: number
  reasoningEffort?: ReasoningEffort
  onDelta: (chunk: string) => void
}): Promise<ResponsesInvokeResult> {
  const startedAt = Date.now()
  const body: Record<string, unknown> = {
    model: params.model,
    instructions: params.instructions,
    input: params.messages.map((m) => ({ role: m.role, content: m.content })),
    max_output_tokens: params.maxOutputTokens ?? 500,
    text: { format: { type: 'text' } },
  }

  if (params.reasoningEffort) {
    body.reasoning = { effort: params.reasoningEffort }
  }

  const response = await openAiResponsesStreamFetch(body, params.apiKey)
  if (!response.ok) {
    const raw = await response.text()
    let detail = raw
    try {
      const json = JSON.parse(raw) as { error?: { message?: string } }
      detail = json?.error?.message ?? raw
    } catch {
      // use raw
    }
    throw new Error(`OpenAI Responses API error (${ response.status }): ${ detail }`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('OpenAI stream returned no body')

  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const { events, rest } = parseSseBuffer(buffer)
    buffer = rest

    for (const event of events) {
      if (event.type === 'error') {
        throw new Error(event.error?.message ?? event.message ?? 'OpenAI stream error')
      }
      if (event.type === 'response.output_text.delta' && typeof event.delta === 'string' && event.delta) {
        fullText += event.delta
        params.onDelta(event.delta)
      }
    }
  }

  return summarizeStreamResult(fullText, startedAt)
}

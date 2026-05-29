import type { ChatMessage } from './advisorPrompt.js'
import { extractHttpLinks } from './hallucinationGuard.js'

type ResponsesOutputItem =
  | {
      type?: string
      content?: Array<{ type?: string; text?: string; annotations?: unknown[] }>
    }
  | Record<string, unknown>

type ResponsesCreateResult = {
  output_text?: string
  output?: ResponsesOutputItem[]
  status?: string
  incomplete_details?: { reason?: string }
}

export type ResponsesInvokeResult = {
  text: string
  linkCountInText: number
  latencyMs: number
  responseStatus?: string
  rawBodyLength: number
  parsedTextLength: number
  outputItemTypes: string
  incompleteReason?: string
  hadMessageItem: boolean
}

function summarizeOutputTypes(json: ResponsesCreateResult): string {
  const output = Array.isArray(json.output) ? json.output : []
  if (!output.length) return 'none'
  return output.map((item) => String((item as { type?: string }).type ?? 'unknown')).join(',')
}

function hadMessageOutput(json: ResponsesCreateResult): boolean {
  const output = Array.isArray(json.output) ? json.output : []
  return output.some((item) => (item as { type?: string }).type === 'message')
}

function extractOutputText(json: ResponsesCreateResult): string {
  if (typeof json.output_text === 'string' && json.output_text.trim()) return json.output_text.trim()

  const output = Array.isArray(json.output) ? json.output : []
  const texts: string[] = []
  for (const item of output) {
    const itemType = (item as { type?: string }).type
    if (itemType === 'reasoning') continue

    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: Array<{ type?: string; text?: string; json?: unknown }> }).content ?? [])
      : []

    for (const c of content) {
      if (typeof c?.text === 'string' && c.text.trim()) {
        texts.push(c.text.trim())
        continue
      }
      if (c?.type === 'output_text' && typeof c?.text === 'string' && c.text.trim()) {
        texts.push(c.text.trim())
        continue
      }
      if (c?.json != null) {
        try {
          texts.push(JSON.stringify(c.json))
        } catch {
          // ignore
        }
      }
    }

    const itemText = (item as { text?: string }).text
    if (typeof itemText === 'string' && itemText.trim()) texts.push(itemText.trim())
  }
  if (texts.length) return texts.join('\n').trim()

  const nested = (json as { text?: { content?: string } }).text?.content
  if (typeof nested === 'string' && nested.trim()) return nested.trim()

  return ''
}

const OPENAI_RESPONSES_TIMEOUT_MS = 55_000

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high'

async function openAiResponsesFetch(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OPENAI_RESPONSES_TIMEOUT_MS)
  try {
    return await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ apiKey }`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function parseResponsesBody(response: Response): Promise<{ json: ResponsesCreateResult; rawBodyLength: number }> {
  const raw = await response.text()
  if (!response.ok) {
    let detail = raw
    try {
      const json = JSON.parse(raw) as { error?: { message?: string } }
      detail = json?.error?.message ?? raw
    } catch {
      // use raw
    }
    throw new Error(`OpenAI Responses API error (${ response.status }): ${ detail }`)
  }
  return { json: JSON.parse(raw) as ResponsesCreateResult, rawBodyLength: raw.length }
}

function buildInvokeResult(
  json: ResponsesCreateResult,
  startedAt: number,
  text: string,
  rawBodyLength: number,
): ResponsesInvokeResult {
  return {
    text,
    linkCountInText: extractHttpLinks(text).length,
    latencyMs: Date.now() - startedAt,
    responseStatus: json.status,
    rawBodyLength,
    parsedTextLength: text.length,
    outputItemTypes: summarizeOutputTypes(json),
    incompleteReason: json.incomplete_details?.reason,
    hadMessageItem: hadMessageOutput(json),
  }
}

export async function invokeOpenAiResponsesText(params: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  maxOutputTokens?: number
  reasoningEffort?: ReasoningEffort
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

  const response = await openAiResponsesFetch(body, params.apiKey)
  const { json, rawBodyLength } = await parseResponsesBody(response)
  const text = extractOutputText(json)
  return buildInvokeResult(json, startedAt, text, rawBodyLength)
}

export function isReasoningOnlyEmpty(result: ResponsesInvokeResult): boolean {
  return (
    !result.text.trim() &&
    !result.hadMessageItem &&
    (result.outputItemTypes.includes('reasoning') || result.incompleteReason === 'max_output_tokens')
  )
}

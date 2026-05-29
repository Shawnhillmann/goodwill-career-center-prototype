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
}

type UrlCitation = { url: string; title?: string }

export type ResponsesInvokeResult = {
  text: string
  citationCount: number
  linkCountInText: number
  latencyMs: number
  responseStatus?: string
}

function extractOutputText(json: ResponsesCreateResult): string {
  if (typeof json.output_text === 'string' && json.output_text.trim()) return json.output_text.trim()

  const output = Array.isArray(json.output) ? json.output : []
  const texts: string[] = []
  for (const item of output) {
    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: Array<{ type?: string; text?: string }> }).content ?? [])
      : []
    for (const c of content) {
      if (c?.type === 'output_text' && typeof c?.text === 'string' && c.text.trim()) {
        texts.push(c.text)
      }
    }
  }
  if (texts.length) return texts.join('\n').trim()

  const nested = (json as { text?: { content?: string } }).text?.content
  if (typeof nested === 'string' && nested.trim()) return nested.trim()

  return ''
}

function extractUrlCitations(json: ResponsesCreateResult): UrlCitation[] {
  const output = Array.isArray(json.output) ? json.output : []
  const urls: UrlCitation[] = []
  const seen = new Set<string>()

  for (const item of output) {
    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: Array<{ annotations?: unknown[] }> }).content ?? [])
      : []
    for (const c of content) {
      const annotations = Array.isArray(c?.annotations) ? c.annotations : []
      for (const a of annotations) {
        const ann = a as { type?: string; url?: string; title?: string }
        if (ann?.type !== 'url_citation') continue
        const url = typeof ann?.url === 'string' ? ann.url : ''
        if (!url || seen.has(url)) continue
        seen.add(url)
        const title = typeof ann?.title === 'string' ? ann.title : undefined
        urls.push({ url, title })
      }
    }
  }

  return urls
}

const OPENAI_RESPONSES_TIMEOUT_MS = 55_000

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

async function parseResponsesBody(response: Response): Promise<ResponsesCreateResult> {
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
  return JSON.parse(raw) as ResponsesCreateResult
}

function buildInvokeResult(json: ResponsesCreateResult, startedAt: number, text: string): ResponsesInvokeResult {
  const citations = extractUrlCitations(json)
  const linkCountInText = extractHttpLinks(text).length
  return {
    text,
    citationCount: citations.length,
    linkCountInText,
    latencyMs: Date.now() - startedAt,
    responseStatus: json.status,
  }
}

export async function invokeOpenAiResponsesText(params: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  maxOutputTokens?: number
}): Promise<ResponsesInvokeResult> {
  const startedAt = Date.now()
  const response = await openAiResponsesFetch(
    {
      model: params.model,
      instructions: params.instructions,
      input: params.messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: params.maxOutputTokens ?? 500,
    },
    params.apiKey,
  )

  const json = await parseResponsesBody(response)
  const text = extractOutputText(json)
  return buildInvokeResult(json, startedAt, text)
}

export async function invokeOpenAiResponsesStructuredJson(params: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  jsonSchema: {
    type: 'json_schema'
    name: string
    strict: boolean
    schema: Record<string, unknown>
  }
  maxOutputTokens?: number
}): Promise<ResponsesInvokeResult> {
  const startedAt = Date.now()
  const response = await openAiResponsesFetch(
    {
      model: params.model,
      instructions: params.instructions,
      input: params.messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: params.maxOutputTokens ?? 500,
      text: { format: params.jsonSchema },
    },
    params.apiKey,
  )

  const json = await parseResponsesBody(response)
  const text = extractOutputText(json)
  return buildInvokeResult(json, startedAt, text)
}

export type WebSearchToolChoice = 'auto' | 'required'

export async function invokeOpenAiResponsesWebSearch(params: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  toolChoice?: WebSearchToolChoice
  maxOutputTokens?: number
  /** When false, citations stay inline only (no trailing Sources block). */
  appendSourcesBlock?: boolean
}): Promise<ResponsesInvokeResult> {
  const startedAt = Date.now()
  const toolChoice = params.toolChoice ?? 'auto'

  const response = await openAiResponsesFetch(
    {
      model: params.model,
      instructions: params.instructions,
      input: params.messages.map((m) => ({ role: m.role, content: m.content })),
      reasoning: { effort: 'low' },
      tools: [{ type: 'web_search' }],
      tool_choice: toolChoice,
      max_output_tokens: params.maxOutputTokens ?? 480,
    },
    params.apiKey,
  )

  const json = await parseResponsesBody(response)
  let text = extractOutputText(json)
  const citations = extractUrlCitations(json)

  if (params.appendSourcesBlock !== false && citations.length) {
    const sources = citations
      .slice(0, 3)
      .map((c) => `- ${ c.title ? `[${ c.title }](${ c.url })` : c.url }`)
      .join('\n')
    text = `${ text }\n\nSources:\n${ sources }`.trim()
  }

  return buildInvokeResult(json, startedAt, text)
}

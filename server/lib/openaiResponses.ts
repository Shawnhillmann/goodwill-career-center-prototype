import type { ChatMessage } from './advisorPrompt.js'

type ResponsesOutputItem =
  | {
      type?: string
      content?: Array<{ type?: string; text?: string; annotations?: any[] }>
    }
  | Record<string, unknown>

type ResponsesCreateResult = {
  output_text?: string
  output?: ResponsesOutputItem[]
}

function extractOutputText(json: ResponsesCreateResult): string {
  if (typeof json.output_text === 'string' && json.output_text.trim()) return json.output_text
  const output = Array.isArray(json.output) ? json.output : []
  const texts: string[] = []
  for (const item of output) {
    const content = Array.isArray((item as any)?.content) ? (item as any).content : []
    for (const c of content) {
      if (c?.type === 'output_text' && typeof c?.text === 'string') texts.push(c.text)
    }
  }
  return texts.join('\n').trim()
}

export async function invokeOpenAiResponsesWebSearch(params: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  toolChoice?: 'auto' | 'required'
}): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ params.apiKey }`,
    },
    body: JSON.stringify({
      model: params.model,
      instructions: params.instructions,
      input: params.messages.map((m) => ({ role: m.role, content: m.content })),
      tools: [{ type: 'web_search' }],
      tool_choice: params.toolChoice ?? 'auto',
      // Keep it fast; these are short, practical answers.
      max_output_tokens: 900,
    }),
  })

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

  const json = JSON.parse(raw) as ResponsesCreateResult
  return extractOutputText(json)
}


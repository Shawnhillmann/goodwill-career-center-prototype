import type { ChatMessage } from './advisorPrompt.js'

export async function invokeOpenAiChat(params: {
  apiKey: string
  model: string
  system: string
  messages: ChatMessage[]
}): Promise<string> {
  const usesFixedSampling = /^gpt-5/i.test(params.model)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ params.apiKey }`,
    },
    body: JSON.stringify({
      model: params.model,
      // Some newer models (e.g. gpt-5-mini) only support the default temperature.
      ...(usesFixedSampling ? {} : { temperature: 0.4 }),
      // Newer OpenAI models (e.g. gpt-5-mini) use max_completion_tokens instead of max_tokens.
      max_completion_tokens: 800,
      messages: [
        { role: 'system', content: params.system },
        ...params.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  const raw = await response.text()
  if (!response.ok) {
    let detail = raw
    try {
      const json = JSON.parse(raw) as { error?: { message?: string } }
      detail = json?.error?.message ?? raw
    } catch {
      // use raw body
    }
    throw new Error(`OpenAI API error (${ response.status }): ${ detail }`)
  }

  const json = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> }
  return String(json?.choices?.[0]?.message?.content ?? '')
}

import { parseAdvisorDocumentType } from '../../shared/advisorMessage'
import {
  normalizeConversationState,
  type ConversationState,
} from '../../shared/conversationState'

export type AdvisorChatDoneMeta = {
  documentType?: 'resume'
  conversationState?: ConversationState
}

export type AdvisorChatStreamHandlers = {
  onDelta: (chunk: string, fullText: string) => void
  onDone: (reply: string, meta?: AdvisorChatDoneMeta) => void
  onError: (message: string) => void
}

function parseSseBlock(block: string): { event: string; data: Record<string, unknown> | null } {
  let event = 'message'
  const dataParts: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataParts.push(line.slice(5).trim())
  }
  const dataStr = dataParts.join('\n')
  if (!dataStr) return { event, data: null }
  try {
    return { event, data: JSON.parse(dataStr) as Record<string, unknown> }
  } catch {
    return { event, data: null }
  }
}

function parseAdvisorDoneMeta(data: Record<string, unknown> | null): AdvisorChatDoneMeta | undefined {
  const documentType = parseAdvisorDocumentType(data?.documentType)
  const conversationState =
    data && 'conversationState' in data
      ? normalizeConversationState(data.conversationState)
      : undefined
  if (!documentType && conversationState === undefined) return undefined
  return {
    ...(documentType ? { documentType } : {}),
    ...(conversationState !== undefined ? { conversationState } : {}),
  }
}

async function consumeSseBody(response: Response, handlers: AdvisorChatStreamHandlers): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    handlers.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let finished = false

  const finish = (reply: string, meta?: AdvisorChatDoneMeta) => {
    if (finished) return
    finished = true
    handlers.onDone(reply, meta)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let splitAt = buffer.indexOf('\n\n')
    while (splitAt !== -1) {
      const block = buffer.slice(0, splitAt)
      buffer = buffer.slice(splitAt + 2)
      const { event, data } = parseSseBlock(block)

      if (event === 'delta' && typeof data?.text === 'string') {
        const chunk = data.text
        full += chunk
        handlers.onDelta(chunk, full)
      } else if (event === 'done' && typeof data?.reply === 'string') {
        const reply = String(data.reply).trim()
        if (reply) finish(reply, parseAdvisorDoneMeta(data))
        else if (full.trim()) finish(full.trim(), parseAdvisorDoneMeta(data))
      } else if (event === 'error') {
        const base =
          typeof data?.message === 'string'
            ? data.message
            : 'Sorry — I’m having trouble responding right now. Please try again.'
        const details = typeof data?.details === 'string' ? data.details : ''
        handlers.onError(details ? `${ base } ${ details }` : base)
        return
      }

      splitAt = buffer.indexOf('\n\n')
    }
  }

  if (!finished && full.trim()) finish(full.trim())
  else if (!finished) handlers.onError('Sorry — I didn’t get a response. Please try again.')
}

async function consumeJsonBody(response: Response, rawText: string, handlers: AdvisorChatStreamHandlers): Promise<void> {
  let json: Record<string, unknown> | null = null
  try {
    json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null
  } catch {
    json = null
  }

  if (!response.ok) {
    const fallbackBase =
      'Sorry — I’m having trouble responding right now. Please try again in a moment.'
    const err = json?.error
    const base =
      typeof err === 'string'
        ? err
        : err && typeof err === 'object' && typeof (err as { message?: string }).message === 'string'
          ? (err as { message: string }).message
          : fallbackBase
    const details =
      err && typeof err === 'object' && typeof (err as { details?: string }).details === 'string'
        ? (err as { details: string }).details
        : ''
    const status = `HTTP ${ response.status }`
    const hint =
      details || (rawText && rawText.length < 600 && !rawText.trim().startsWith('<') ? rawText.trim() : '')
    handlers.onError(hint ? `${ base } (${ status }) ${ hint }` : `${ base } (${ status })`)
    return
  }

  const reply = String(json?.reply ?? '').trim()
  if (!reply) {
    handlers.onError('Sorry — I didn’t get a response. Please try again.')
    return
  }
  handlers.onDone(reply, parseAdvisorDoneMeta(json))
}

/** Read a streamed or JSON /api/chat response. */
export async function consumeAdvisorChatStream(
  response: Response,
  handlers: AdvisorChatStreamHandlers,
): Promise<void> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/event-stream')) {
    if (!response.ok) {
      handlers.onError(`Sorry — I’m having trouble responding right now. (HTTP ${ response.status })`)
      return
    }
    await consumeSseBody(response, handlers)
    return
  }

  const rawText = await response.text().catch(() => '')
  await consumeJsonBody(response, rawText, handlers)
}

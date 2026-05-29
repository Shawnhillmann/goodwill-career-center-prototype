import { randomUUID } from 'node:crypto'

type ChatLogFields = Record<string, string | number | boolean | undefined | null>

/** Structured logs for chat routing (no PII, prompts, or document content). */
export function logChat(event: string, fields: ChatLogFields = {}) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      component: 'chat',
      event,
      ...fields,
    }),
  )
}

export function createRequestId(): string {
  return randomUUID()
}

/** Structured log for every HTTP 502 from chat routes. */
export function logChat502(fields: {
  requestId: string
  lastUserMessage: string
  route: string
  model?: string
  searchTriggered: boolean
  uploadPresent: boolean
  rawResponseLength?: number
  parsedResponseLength?: number
  retryUsed?: boolean
  exception?: string
  responseStatus?: string
  outputItemTypes?: string
  incompleteReason?: string
  path?: string
  messageCount?: number
}) {
  logChat('chat_502', {
    requestId: fields.requestId,
    lastUserPreview: fields.lastUserMessage.slice(0, 120),
    lastUserLength: fields.lastUserMessage.length,
    route: fields.route,
    model: fields.model,
    searchTriggered: fields.searchTriggered,
    uploadPresent: fields.uploadPresent,
    rawResponseLength: fields.rawResponseLength,
    parsedResponseLength: fields.parsedResponseLength,
    retryUsed: fields.retryUsed,
    exception: fields.exception,
    responseStatus: fields.responseStatus,
    outputItemTypes: fields.outputItemTypes,
    incompleteReason: fields.incompleteReason,
    path: fields.path,
    messageCount: fields.messageCount,
  })
}

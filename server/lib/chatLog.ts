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

/** Keep in sync with src/lib/streamingPolicy.ts */
export function shouldStreamAdvisorReply(opts: {
  userMessage: string
  docOnly: boolean
  quickAction?: string
  hasUploadedDocument: boolean
  clientWantsStream: boolean
}): boolean {
  if (!opts.clientWantsStream) return false
  if (opts.docOnly) return false
  if (opts.quickAction === 'resume_review') return false
  if (opts.hasUploadedDocument) return false

  const s = opts.userMessage.toLowerCase()
  if (/\b(resume|résumé|cv|curriculum vitae|cover letter)\b/.test(s)) return false

  return true
}

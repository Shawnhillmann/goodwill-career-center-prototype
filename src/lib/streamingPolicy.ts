import type { QuickActionId } from '../quickActions'

/** Resume / document work is shown all at once; short conversational replies stream. */
export function shouldStreamAdvisorReply(opts: {
  userMessage: string
  expectDocument: boolean
  quickAction?: QuickActionId
  hasUploadedDocument: boolean
}): boolean {
  if (opts.expectDocument) return false
  if (opts.quickAction === 'resume_review') return false
  if (opts.hasUploadedDocument) return false

  const s = opts.userMessage.toLowerCase()
  if (/\b(resume|résumé|cv|curriculum vitae|cover letter)\b/.test(s)) return false

  return true
}

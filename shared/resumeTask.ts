/** Quick-action ids that start coaching conversations, not deliverable resume documents. */
const COACHING_QUICK_ACTIONS = new Set([
  'explore_careers',
  'build_resume',
  'help_apply',
  'practice_interviews',
  'career_plan',
  'local_resources',
])

export type ResumeTaskQuickAction = string | undefined

/** User wants a finished resume/CV document in the reply (not coaching or Q&A). */
export function isResumeDeliverableRequest(
  q: string,
  hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
): boolean {
  if (quickAction && COACHING_QUICK_ACTIONS.has(quickAction)) return false

  const s = q.toLowerCase().trim()
  if (!s || /\bcover letter\b/.test(s)) return false

  if (isResumeCoachingMessage(s)) return false

  if (/\b(sample|example|template|demo)\b/.test(s) && /\b(resume|cv)\b/.test(s)) return false
  if (/\b(show|give)\s+me\b/.test(s) && /\b(resume|cv)\b/.test(s)) return false

  const doc = /\b(resume|résumé|cv|curriculum vitae)\b/
  if (!doc.test(s)) return false

  const deliverable =
    /\b(write|draft|generate|create|format|rewrite|redraft|revise|tailor|update|polish|fix|refresh|output|produce)\s+(my\s+)?(resume|cv|résumé)\b/.test(
      s,
    ) ||
    /\b(rewrite|redraft|revise|tailor|reformat|format|polish)\s+(my\s+)?(resume|cv)\b/.test(s) ||
    /\b(resume|cv|résumé)\s+(rewrite|revision|draft|formatting)\b/.test(s) ||
    (/\btailored\b/.test(s) && doc.test(s))

  if (deliverable) {
    if (!hasUploadedDocument && /\b(write|create|draft|build|generate)\s+(my\s+)?(resume|cv)\b/.test(s)) {
      return false
    }
    return true
  }

  if (hasUploadedDocument) {
    return (
      /\b(tailor|rewrite|redraft|revise|reformat|format|polish|update)\b/.test(s) &&
      !/\b(help\s+(me\s+)?(with|review|improve)|how\s+(do|can)|what\s+should|tips|advice|feedback)\b/.test(s)
    )
  }

  return false
}

function isResumeCoachingMessage(s: string): boolean {
  return (
    /\b(would like help|need help|help\s+(me\s+)?(with|on)|help\s+reviewing|review\s+my|look\s+at\s+my|feedback\s+on|advice\s+on|tips\s+for)\b/.test(
      s,
    ) ||
    /\b(how\s+(do|can|should)\s+i|what\s+should\s+i|can\s+you\s+review|please\s+review)\b/.test(s) ||
    /\b(improve\s+it\b|position\s+myself|ask\s+me\s+to\s+upload|upload\s+(one|a\s+resume)|provide\s+my\s+experience)\b/.test(s)
  )
}

export function isExplicitDocumentRequest(
  q: string,
  hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
): boolean {
  if (/\bcover letter\b/i.test(q)) return isCoverLetterDeliverable(q)
  return isResumeDeliverableRequest(q, hasUploadedDocument, quickAction)
}

function isCoverLetterDeliverable(q: string): boolean {
  const s = q.toLowerCase()
  return (
    /\b(write|draft|generate|create|format|rewrite|revise|tailor)\b/.test(s) &&
    !isResumeCoachingMessage(s)
  )
}

export function isResumeOutputRequest(
  q: string,
  hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
): boolean {
  return isResumeDeliverableRequest(q, hasUploadedDocument, quickAction)
}

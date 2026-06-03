import {
  isResumeDeliverableRequest,
  type ResumeTaskQuickAction,
} from './resumeTask.js'

export type ResumeChatTurn = { role: 'user' | 'assistant'; content: string }

const COACHING_QUICK_ACTIONS = new Set([
  'explore_careers',
  'build_resume',
  'help_apply',
  'practice_interviews',
  'career_plan',
  'local_resources',
])

/** User explicitly confirmed they want the formatted resume now. */
export function isResumeGenerationConfirmed(message: string): boolean {
  const s = message.toLowerCase().trim()
  if (!s) return false
  if (/^(confirm|confirmed|yes|yep|yeah|yup|ok|okay|sure|go ahead|proceed|generate|approved)\.?!?$/i.test(s)) {
    return true
  }
  return (
    /\b(confirm|confirmed|go ahead|looks good|that works|that's good|sounds good|please generate|generate it|generate the resume|proceed with)\b/.test(
      s,
    ) && !/\b(don't|do not|not yet|wait|change|edit|update|revise)\b/.test(s)
  )
}

/** Prior advisor message invited confirm-or-edit before generating. */
export function advisorOfferedResumeConfirmation(assistantText: string): boolean {
  const s = assistantText.toLowerCase()
  return (
    /\b(reply|respond|type|say)\s+[`'"]?confirm/.test(s) ||
    /\bconfirm\b.*\b(or|and).*\b(change|edit|update|revise|adjust)/.test(s) ||
    /\blet me know (which|what) details to change\b/.test(s) ||
    /\b(i'?ll|i will) generate (the |your )?resume\b/.test(s) ||
    /\bready to generate (the |your )?resume\b/.test(s) ||
    /\bwhen you'?re ready\b.*\bconfirm\b/.test(s)
  )
}

function threadDiscussesResume(messages: ResumeChatTurn[]): boolean {
  return messages.some((m) => /\b(resume|résumé|cv)\b/i.test(m.content))
}

/**
 * True only when the user confirmed after the advisor offered to generate,
 * or confirmed during an active resume-build thread.
 */
export function shouldOutputResumeDocument(
  messages: ResumeChatTurn[],
  lastUser: string,
  _hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
): boolean {
  if (quickAction && COACHING_QUICK_ACTIONS.has(quickAction)) return false
  if (!isResumeGenerationConfirmed(lastUser)) return false

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''
  if (advisorOfferedResumeConfirmation(lastAssistant)) return true

  if (threadDiscussesResume(messages)) {
    const recentAssistant = messages
      .filter((m) => m.role === 'assistant')
      .slice(-3)
      .some((m) => advisorOfferedResumeConfirmation(m.content))
    if (recentAssistant) return true
  }

  return false
}

/** User wants a resume eventually but not the formatted document on this turn. */
export function isResumePreparationTurn(
  messages: ResumeChatTurn[],
  lastUser: string,
  hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
): boolean {
  if (quickAction && COACHING_QUICK_ACTIONS.has(quickAction)) return false
  if (shouldOutputResumeDocument(messages, lastUser, hasUploadedDocument, quickAction)) return false
  return isResumeDeliverableRequest(lastUser, hasUploadedDocument, quickAction)
}

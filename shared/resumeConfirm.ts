import {
  isResumeDeliverableRequest,
  type ResumeTaskQuickAction,
} from './resumeTask.js'
import {
  type ConversationState,
  isResumeActionConfirmed,
  normalizeConversationState,
} from './conversationState.js'

export { advisorOfferedResumeConfirmation } from './confirmGate.js'

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

/**
 * True only when structured pending state (or a resume revision after resume output)
 * matches an explicit resume confirmation.
 */
export function shouldOutputResumeDocument(
  state: ConversationState | unknown,
  lastUser: string,
  messages: ResumeChatTurn[],
  quickAction?: ResumeTaskQuickAction,
): boolean {
  if (quickAction && COACHING_QUICK_ACTIONS.has(quickAction)) return false
  return isResumeActionConfirmed(lastUser, normalizeConversationState(state), messages)
}

/** User wants a resume eventually but not the formatted document on this turn. */
export function isResumePreparationTurn(
  state: ConversationState | unknown,
  lastUser: string,
  hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
  messages: ResumeChatTurn[] = [],
): boolean {
  if (quickAction && COACHING_QUICK_ACTIONS.has(quickAction)) return false
  if (shouldOutputResumeDocument(state, lastUser, messages, quickAction)) return false
  return isResumeDeliverableRequest(lastUser, hasUploadedDocument, quickAction)
}

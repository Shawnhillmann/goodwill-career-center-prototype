import { assistantMessageHasSearchPlanBlock } from './searchPlan.js'

export type ConfirmChatTurn = { role: 'user' | 'assistant'; content: string }

export type PendingConfirmKind = 'search' | 'resume'

/** Prior advisor message presented a search plan and asked for CONFIRM. */
export function advisorOfferedSearchPreview(assistantText: string): boolean {
  if (assistantMessageHasSearchPlanBlock(assistantText)) return true

  const s = assistantText.toLowerCase()
  const hasPlan =
    /\b(i will search for|i'm ready to search|ready to search|based on what you'?ve told me)\b/.test(s) ||
    /\bsearch for:\s*\n/i.test(assistantText) ||
    /\bsearch for:\s*•/i.test(assistantText) ||
    /\bi can look that up\b/.test(s) ||
    /\byou want me to search for\b/.test(s)
  const hasConfirmGate =
    /\b(reply|respond|type|say)\b[\s*"'`]*confirm(\s+search)?\b/.test(s) ||
    /\bconfirm\b.*\b(begin|start|search)/.test(s) ||
    /\bto begin (this |the )?search\b/.test(s) ||
    /\bwould like me to begin this search\b/.test(s) ||
    /\bplease confirm before i search\b/.test(s)
  return hasPlan && hasConfirmGate
}

/** Prior advisor message invited confirm-or-edit before generating a resume. */
export function advisorOfferedResumeConfirmation(assistantText: string): boolean {
  if (advisorOfferedSearchPreview(assistantText)) return false

  const s = assistantText.toLowerCase()
  const hasResumeContext =
    /\b(resume|résumé|cv)\b/.test(s) ||
    /\bgenerate (the |your )?resume\b/.test(s) ||
    (/\bready to generate\b/.test(s) && /\bresume\b/.test(s))

  const hasConfirmGate =
    (/\b(reply|respond|type|say)\b[\s*"'`]*confirm(\s+resume)?\b/.test(s) && hasResumeContext) ||
    /\bconfirm\b.*\b(or|and).*\b(change|edit|update|revise|adjust)/.test(s) ||
    /\blet me know (which|what) details to change\b/.test(s) ||
    /\b(i'?ll|i will) generate (the |your )?resume\b/.test(s) ||
    /\bready to generate (the |your )?resume\b/.test(s) ||
    (/\bwhen you'?re ready\b[\s\S]{0,80}?\bconfirm\b/.test(s) && hasResumeContext) ||
    (/\bconfirm\b[\s\S]{0,60}?\b(generate|produce|write).{0,30}\bresume\b/.test(s) && hasResumeContext)

  return hasConfirmGate
}

/**
 * The most recent assistant message that asked the user to CONFIRM something.
 * Whichever confirm gate appeared last wins (resume or search).
 */
export function findMostRecentConfirmGate(messages: ConfirmChatTurn[]): PendingConfirmKind | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'assistant') continue
    if (advisorOfferedResumeConfirmation(message.content)) return 'resume'
    if (advisorOfferedSearchPreview(message.content)) return 'search'
  }
  return null
}

/** Search preview that is still the active pending confirm (not superseded by resume work). */
export function findActiveSearchPreviewMessage(messages: ConfirmChatTurn[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'assistant') continue
    if (advisorOfferedResumeConfirmation(message.content)) return ''
    if (advisorOfferedSearchPreview(message.content)) return message.content
  }
  return ''
}

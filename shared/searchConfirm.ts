import { advisorOfferedResumeConfirmation } from './confirmGate.js'
import {
  EMPTY_CONVERSATION_STATE,
  isSearchActionConfirmed,
  isPendingSearchConfirmVisible,
  normalizeConversationState,
  type ConversationState,
} from './conversationState.js'
import {
  buildListingRecencyInstructions,
  isListingSearchPlan,
} from './searchRecency.js'
import { buildSearchResultLimitInstructions } from './searchLimits.js'
import { extractSearchPlan } from './searchFinalize.js'
import {
  classifyUserRequest,
  isExecutableSearchPlan,
  type SearchPlan,
} from './searchPlan.js'

export {
  classifyUserRequest,
  isLiveLookupRequest,
  isSearchIntentRequest,
  type SearchCategory,
  type SearchConfidence,
  type SearchPlan,
  type SearchRequestAssessment,
  type SearchRequestClassification,
} from './searchPlan.js'
export { advisorOfferedSearchPreview } from './confirmGate.js'
export { extractSearchPlan, finalizeAssistantSearchReply } from './searchFinalize.js'

export type SearchChatTurn = { role: 'user' | 'assistant'; content: string }

export type SearchWorkflowPhase = 'none' | 'clarifying' | 'awaiting_confirm' | 'execute'

export type SearchWorkflowState = {
  phase: SearchWorkflowPhase
  plan: SearchPlan | null
  searchIntent: boolean
  assessment: ReturnType<typeof classifyUserRequest> | null
}

const CANCEL_SEARCH_RE =
  /\b(don't|do not|not yet|wait|cancel|stop|never mind|nevermind)\b/i

/** Explicit approval after seeing a search preview. */
export function isWebSearchConfirmed(message: string): boolean {
  const s = message.toLowerCase().trim()
  if (!s) return false
  if (CANCEL_SEARCH_RE.test(s)) return false

  if (
    /^(confirm|confirmed|yes|yep|yeah|yup|ok|okay|sure|go ahead|proceed|start search|search now)\.?!?$/i.test(
      s,
    )
  ) {
    return true
  }

  return (
    /\b(yes, search|start search|search now|go ahead and search|proceed with search|begin search|begin the search)\b/.test(
      s,
    ) && !/\b(don't|do not|not yet|wait|change|edit|update|revise)\b/.test(s)
  )
}

export function findSearchPreviewMessage(messages: SearchChatTurn[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'assistant') continue
    if (advisorOfferedResumeConfirmation(message.content)) return ''
    if (extractSearchPlan(message.content)) return message.content
  }
  return ''
}

export function resolveSearchPlan(messages: SearchChatTurn[]): SearchPlan | null {
  const preview = findSearchPreviewMessage(messages)
  if (!preview) return null
  const plan = extractSearchPlan(preview)
  if (!plan || !isExecutableSearchPlan(plan)) return null
  return plan
}

/** Reconstruct pending search state from persisted state or message history. */
export function reconstructPendingSearchState(
  messages: SearchChatTurn[],
  storedState: ConversationState = EMPTY_CONVERSATION_STATE,
): ConversationState {
  if (
    storedState.pendingAction === 'search' &&
    storedState.pendingSearchPlan?.search_query?.trim() &&
    isExecutableSearchPlan(storedState.pendingSearchPlan)
  ) {
    return storedState
  }

  const fromHistory = resolveSearchPlan(messages)
  if (fromHistory && isExecutableSearchPlan(fromHistory)) {
    return { pendingAction: 'search', pendingSearchPlan: fromHistory }
  }

  return storedState.pendingAction === 'resume' ? storedState : { ...EMPTY_CONVERSATION_STATE }
}

function lastAssistantMessage(messages: SearchChatTurn[]): string {
  return [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''
}

export function threadHasSearchIntent(messages: SearchChatTurn[]): boolean {
  return messages.some((m) => {
    if (m.role !== 'user') return false
    const classification = classifyUserRequest(m.content).classification
    return classification === 'search_confirmation' || classification === 'clarification_required'
  })
}

export function assessUserSearchRequest(text: string) {
  return classifyUserRequest(text)
}

/** User is revising a pending search instead of confirming it. */
export function isSearchPlanRevisionRequest(message: string, state: ConversationState): boolean {
  if (!isPendingSearchConfirmVisible(state)) return false
  if (isSearchActionConfirmed(message, state)) return false
  if (CANCEL_SEARCH_RE.test(message)) return false
  return message.trim().length > 0
}

export function shouldExecuteWebSearch(state: ConversationState, lastUser: string): boolean {
  return isSearchActionConfirmed(lastUser, state)
}

export function getSearchWorkflowPhase(
  messages: SearchChatTurn[],
  lastUser: string,
  state: ConversationState = EMPTY_CONVERSATION_STATE,
): SearchWorkflowPhase {
  if (shouldExecuteWebSearch(state, lastUser)) return 'execute'

  if (state.pendingAction === 'search' && state.pendingSearchPlan && isExecutableSearchPlan(state.pendingSearchPlan)) {
    if (isSearchPlanRevisionRequest(lastUser, state)) return 'clarifying'
    return 'awaiting_confirm'
  }

  const lastAssistant = lastAssistantMessage(messages)
  const lastPlan = lastAssistant ? extractSearchPlan(lastAssistant) : null
  if (lastPlan && isExecutableSearchPlan(lastPlan)) {
    return isSearchPlanRevisionRequest(lastUser, state) ? 'clarifying' : 'awaiting_confirm'
  }

  if (threadHasSearchIntent(messages)) return 'clarifying'

  const assessment = classifyUserRequest(lastUser)
  if (assessment.classification === 'search_confirmation' || assessment.classification === 'clarification_required') {
    return 'clarifying'
  }

  return 'none'
}

export function evaluateSearchWorkflow(
  messages: SearchChatTurn[],
  lastUser: string,
  state: ConversationState = EMPTY_CONVERSATION_STATE,
): SearchWorkflowState {
  const resolvedState = reconstructPendingSearchState(messages, state)
  const structuredPlan =
    resolvedState.pendingAction === 'search' ? (resolvedState.pendingSearchPlan ?? null) : null
  const previewText = structuredPlan?.rawPreview ?? findSearchPreviewMessage(messages)
  const plan = structuredPlan ?? (previewText ? extractSearchPlan(previewText) : null)
  let phase = getSearchWorkflowPhase(messages, lastUser, resolvedState)

  if (
    phase !== 'execute' &&
    plan &&
    resolvedState.pendingAction === 'search' &&
    !isSearchActionConfirmed(lastUser, resolvedState)
  ) {
    phase = isSearchPlanRevisionRequest(lastUser, resolvedState) ? 'clarifying' : 'awaiting_confirm'
  } else if (
    phase !== 'execute' &&
    plan &&
    previewText &&
    !isWebSearchConfirmed(lastUser) &&
    !isSearchPlanRevisionRequest(lastUser, resolvedState)
  ) {
    phase = 'awaiting_confirm'
  }

  const lastUserAssessment = classifyUserRequest(lastUser)

  return {
    phase,
    plan,
    searchIntent:
      threadHasSearchIntent(messages) ||
      lastUserAssessment.classification === 'search_confirmation' ||
      lastUserAssessment.classification === 'clarification_required',
    assessment: lastUserAssessment.classification === 'coaching' ? null : lastUserAssessment,
  }
}

export function buildApprovedSearchQuery(plan: SearchPlan, referenceDate = new Date()): string {
  const criteria =
    plan.bullets.length > 0
      ? plan.bullets.map((b) => `• ${ b }`).join('\n')
      : `• ${ plan.search_query }`
  const lines = [
    'The user confirmed the search preview. Execute a web search now using exactly this approved query and criteria:',
    `Primary search query: ${ plan.search_query }`,
    criteria,
    '',
    'Find current, relevant results. Summarize what you find with source links when available.',
    'Do not invent employers, programs, salaries, dates, or URLs.',
    '',
    buildSearchResultLimitInstructions(),
  ]

  if (isListingSearchPlan(plan)) {
    lines.push('', buildListingRecencyInstructions(referenceDate))
  }

  return lines.join('\n')
}

/** True when the user confirms a structured pending search action. */
export function isSearchConfirmationTurn(
  state: ConversationState | unknown,
  lastUser: string,
): boolean {
  return isSearchActionConfirmed(lastUser, normalizeConversationState(state))
}

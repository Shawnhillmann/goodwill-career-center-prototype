import { finalizeAssistantSearchReply } from './searchFinalize.js'
import { normalizeSearchPlan as normalizeStructuredSearchPlan, type SearchPlan } from './searchPlan.js'
import { looksLikeResume } from './resumeParse.js'

export type PendingAction = 'search' | 'resume'

export type ConversationState = {
  pendingAction: PendingAction | null
  pendingSearchPlan?: SearchPlan
  pendingResumeDraftContext?: string
}

export const EMPTY_CONVERSATION_STATE: ConversationState = {
  pendingAction: null,
}

export const SEARCH_CONFIRM_PHRASE = 'CONFIRM SEARCH'
export const RESUME_CONFIRM_PHRASE = 'CONFIRM RESUME'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeSearchPlan(raw: unknown): SearchPlan | undefined {
  return normalizeStructuredSearchPlan(raw)
}

/** Parse client-supplied conversation state; unknown shapes become empty. */
export function normalizeConversationState(raw: unknown): ConversationState {
  if (!isRecord(raw)) return { ...EMPTY_CONVERSATION_STATE }

  const pendingAction =
    raw.pendingAction === 'search' || raw.pendingAction === 'resume' ? raw.pendingAction : null
  const pendingSearchPlan =
    pendingAction === 'search' ? normalizeSearchPlan(raw.pendingSearchPlan) : undefined
  const pendingResumeDraftContext =
    typeof raw.pendingResumeDraftContext === 'string' ? raw.pendingResumeDraftContext : undefined

  if (pendingAction === 'search' && !pendingSearchPlan) {
    return { ...EMPTY_CONVERSATION_STATE }
  }

  return {
    pendingAction,
    ...(pendingSearchPlan ? { pendingSearchPlan } : {}),
    ...(pendingResumeDraftContext ? { pendingResumeDraftContext } : {}),
  }
}

export function clearPendingConversationState(): ConversationState {
  return { ...EMPTY_CONVERSATION_STATE }
}

const CANCEL_CONFIRM_RE =
  /\b(don't|do not|not yet|wait|cancel|stop|never mind|nevermind)\b/i

export function isBareConfirmMessage(message: string): boolean {
  return /^(confirm|confirmed|yes|yep|yeah|yup|ok|okay|sure|go ahead|proceed)\.?!?$/i.test(
    message.trim(),
  )
}

/** Explicit or button-driven search confirmation phrases. */
export function isSearchConfirmMessage(message: string): boolean {
  const trimmed = message.trim()
  const s = trimmed.toLowerCase()
  if (!s || CANCEL_CONFIRM_RE.test(s)) return false
  if (/^confirm\s+search\.?!?$/i.test(trimmed)) return true
  if (
    /\b(yes,?\s+search|start\s+search|search\s+now|go\s+ahead\s+(and\s+)?search|begin\s+(the\s+)?search)\b/.test(
      s,
    )
  ) {
    return true
  }
  return false
}

/** Explicit or button-driven resume confirmation phrases. */
export function isResumeConfirmMessage(message: string): boolean {
  const trimmed = message.trim()
  const s = trimmed.toLowerCase()
  if (!s || CANCEL_CONFIRM_RE.test(s)) return false
  if (/^confirm\s+resume\.?!?$/i.test(trimmed)) return true
  if (/^generate\s+(the\s+)?resume\.?!?$/i.test(trimmed)) return true
  if (/\b(please\s+generate|generate\s+it|generate\s+the\s+resume|proceed\s+with\s+(the\s+)?resume)\b/.test(s)) {
    return true
  }
  return false
}

export function isSearchActionConfirmed(message: string, state: ConversationState): boolean {
  if (state.pendingAction !== 'search' || !state.pendingSearchPlan?.search_query?.trim()) return false
  if (isSearchConfirmMessage(message)) return true
  return isBareConfirmMessage(message)
}

export function lastAssistantMessageContent(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): string {
  return [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''
}

export function lastAssistantIsResumeDocument(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): boolean {
  return looksLikeResume(lastAssistantMessageContent(messages))
}

function isResumeRevisionConfirm(message: string): boolean {
  const s = message.toLowerCase().trim()
  if (!/\b(confirm|confirmed|go ahead|generate|proceed)\b/.test(s)) return false
  if (/\b(don't|do not|not yet|wait|cancel|stop)\b/.test(s)) return false
  return true
}

export function isResumeActionConfirmed(
  message: string,
  state: ConversationState,
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>,
): boolean {
  if (state.pendingAction === 'resume') {
    if (isResumeConfirmMessage(message) || isBareConfirmMessage(message)) return true
  }

  if (messages?.length && lastAssistantIsResumeDocument(messages)) {
    if (
      isResumeConfirmMessage(message) ||
      isBareConfirmMessage(message) ||
      isResumeRevisionConfirm(message)
    ) {
      return true
    }
  }

  return false
}

/** Set pending action from a newly generated assistant reply (one-time, not from history scan). */
export function nextConversationStateAfterAssistant(assistantReply: string): ConversationState {
  return finalizeAssistantSearchReply(assistantReply).conversationState as ConversationState
}

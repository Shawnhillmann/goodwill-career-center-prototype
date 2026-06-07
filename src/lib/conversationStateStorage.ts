import {
  EMPTY_CONVERSATION_STATE,
  isPendingSearchConfirmVisible,
  normalizeConversationState,
  type ConversationState,
} from '../../shared/conversationState'

const STORAGE_KEY = 'gcc-pending-conversation-state'

export function loadPersistedConversationState(): ConversationState {
  if (typeof localStorage === 'undefined') return { ...EMPTY_CONVERSATION_STATE }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_CONVERSATION_STATE }
    return normalizeConversationState(JSON.parse(raw))
  } catch {
    return { ...EMPTY_CONVERSATION_STATE }
  }
}

export function persistConversationState(state: ConversationState): void {
  if (typeof localStorage === 'undefined') return
  if (state.pendingAction && (state.pendingSearchPlan || state.pendingAction === 'resume')) {
    if (state.pendingAction === 'search' && !isPendingSearchConfirmVisible(state)) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return
  }
  localStorage.removeItem(STORAGE_KEY)
}

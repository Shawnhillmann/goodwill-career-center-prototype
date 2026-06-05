import { describe, expect, it } from 'vitest'

import {
  EMPTY_CONVERSATION_STATE,
  clearPendingConversationState,
  isResumeActionConfirmed,
  isSearchActionConfirmed,
  nextConversationStateAfterAssistant,
  normalizeConversationState,
  RESUME_CONFIRM_PHRASE,
  SEARCH_CONFIRM_PHRASE,
} from './conversationState'

const searchPreview = `Based on what you've told me, I'm ready to search.

I will search for:
• Accounting jobs in Middletown, CT
• In-person, full-time

Reply CONFIRM SEARCH if you would like me to begin this search.`

const resumeOffer =
  'Reply CONFIRM RESUME to generate your resume, or tell me what to change.'

describe('conversationState', () => {
  it('normalizes valid search pending state', () => {
    const state = normalizeConversationState({
      pendingAction: 'search',
      pendingSearchPlan: {
        bullets: ['Retail jobs in Hartford, CT'],
        rawPreview: searchPreview,
      },
    })
    expect(state.pendingAction).toBe('search')
    expect(state.pendingSearchPlan?.bullets).toHaveLength(1)
  })

  it('clears invalid search state without a plan', () => {
    expect(
      normalizeConversationState({
        pendingAction: 'search',
      }).pendingAction,
    ).toBeNull()
  })

  it('confirms search only with structured pending state', () => {
    const state = nextConversationStateAfterAssistant(searchPreview)
    expect(state.pendingAction).toBe('search')
    expect(isSearchActionConfirmed(SEARCH_CONFIRM_PHRASE, state)).toBe(true)
    expect(isSearchActionConfirmed('confirm', state)).toBe(true)
    expect(isResumeActionConfirmed('confirm', state)).toBe(false)
  })

  it('does not confirm search without pending state', () => {
    expect(isSearchActionConfirmed('confirm', EMPTY_CONVERSATION_STATE)).toBe(false)
    expect(isSearchActionConfirmed(SEARCH_CONFIRM_PHRASE, EMPTY_CONVERSATION_STATE)).toBe(false)
  })

  it('confirms resume only with structured pending state', () => {
    const state = nextConversationStateAfterAssistant(resumeOffer)
    expect(state.pendingAction).toBe('resume')
    expect(isResumeActionConfirmed(RESUME_CONFIRM_PHRASE, state)).toBe(true)
    expect(isSearchActionConfirmed('confirm', state)).toBe(false)
  })

  it('does not confirm resume from stale thread context alone', () => {
    const messages = [
      { role: 'user' as const, content: 'Help me build my resume' },
      { role: 'assistant' as const, content: resumeOffer },
      { role: 'user' as const, content: 'Find accounting jobs near Middletown CT' },
      { role: 'assistant' as const, content: searchPreview },
    ]
    const searchState = nextConversationStateAfterAssistant(searchPreview)
    expect(isResumeActionConfirmed('confirm', searchState, messages)).toBe(false)
    expect(isSearchActionConfirmed('confirm', searchState)).toBe(true)
  })

  it('clears pending state after action execution helper', () => {
    expect(clearPendingConversationState()).toEqual(EMPTY_CONVERSATION_STATE)
  })
})

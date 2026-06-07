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
import { formatSearchPlanBlock } from './searchPlan'

const searchPreview = `Based on what you've told me, I'm ready to search.

I will search for:
• Accounting jobs in Middletown, CT
• In-person, full-time

Reply CONFIRM SEARCH if you would like me to begin this search.`

const structuredPlan = {
  action: 'search_confirmation_required' as const,
  search_query: 'Accounting jobs in Middletown, CT in-person full-time',
  user_facing_confirmation: 'accounting jobs in Middletown, CT',
  search_category: 'jobs' as const,
  search_confidence: 'high' as const,
  missing_required_info: [] as string[],
  bullets: ['Accounting jobs in Middletown, CT', 'In-person, full-time'],
  rawPreview: searchPreview,
}

const resumeOffer =
  'Reply CONFIRM RESUME to generate your resume, or tell me what to change.'

describe('conversationState', () => {
  it('normalizes valid search pending state', () => {
    const state = normalizeConversationState({
      pendingAction: 'search',
      pendingSearchPlan: structuredPlan,
    })
    expect(state.pendingAction).toBe('search')
    expect(state.pendingSearchPlan?.search_query).toMatch(/Accounting jobs/)
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

  it('sets pending search state from structured assistant blocks', () => {
    const reply = `I can look that up. Please confirm before I search.
${ formatSearchPlanBlock({
  action: 'search_confirmation_required',
  search_query: 'John Smith Goodwill',
  user_facing_confirmation: 'information about John Smith related to Goodwill',
  search_category: 'people',
  search_confidence: 'medium',
  missing_required_info: [],
  bullets: ['John Smith Goodwill'],
}) }`
    const state = nextConversationStateAfterAssistant(reply)
    expect(state.pendingSearchPlan?.search_category).toBe('people')
  })

  it('clears pending state after action execution helper', () => {
    expect(clearPendingConversationState()).toEqual(EMPTY_CONVERSATION_STATE)
  })
})

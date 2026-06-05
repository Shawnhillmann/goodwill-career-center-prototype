import { describe, expect, it } from 'vitest'

import {
  advisorOfferedResumeConfirmation,
  findMostRecentConfirmGate,
} from './confirmGate'
import {
  isResumeActionConfirmed,
  isSearchActionConfirmed,
  nextConversationStateAfterAssistant,
  SEARCH_CONFIRM_PHRASE,
  RESUME_CONFIRM_PHRASE,
} from './conversationState'
import { isSearchConfirmationTurn } from './searchConfirm'
import { shouldOutputResumeDocument } from './resumeConfirm'

const searchPreview = `Based on what you've told me, I'm ready to search.

I will search for:
• Public hiring events within 20 miles of Middletown, CT
• In the next 60 days

Reply CONFIRM SEARCH if you would like me to begin this search.`

const resumeConfirmOffer =
  'Thanks — I\'ll use a simple, professional one-page entry-level accounting resume. Reply CONFIRM RESUME to have me generate the resume content now.'

describe('confirmGate', () => {
  it('detects resume confirm offers with markdown bold', () => {
    expect(advisorOfferedResumeConfirmation(resumeConfirmOffer)).toBe(true)
  })

  it('sets structured resume pending state from the latest resume offer', () => {
    const state = nextConversationStateAfterAssistant(resumeConfirmOffer)
    expect(state.pendingAction).toBe('resume')
    expect(isSearchConfirmationTurn(state, SEARCH_CONFIRM_PHRASE)).toBe(false)
    expect(shouldOutputResumeDocument(state, RESUME_CONFIRM_PHRASE, [])).toBe(true)
  })

  it('sets structured search pending state from the latest search preview', () => {
    const state = nextConversationStateAfterAssistant(searchPreview)
    expect(state.pendingAction).toBe('search')
    expect(isSearchConfirmationTurn(state, SEARCH_CONFIRM_PHRASE)).toBe(true)
    expect(shouldOutputResumeDocument(state, SEARCH_CONFIRM_PHRASE, [])).toBe(false)
  })

  it('still prefers search state when user pivots back after resume prep', () => {
    expect(findMostRecentConfirmGate([
      { role: 'user', content: 'Help with my resume' },
      { role: 'assistant', content: 'Reply CONFIRM RESUME to generate your resume.' },
      { role: 'user', content: 'Actually find accounting jobs in Hartford' },
      { role: 'assistant', content: searchPreview },
    ])).toBe('search')

    const state = nextConversationStateAfterAssistant(searchPreview)
    expect(isSearchActionConfirmed(SEARCH_CONFIRM_PHRASE, state)).toBe(true)
    expect(isResumeActionConfirmed(RESUME_CONFIRM_PHRASE, state)).toBe(false)
  })
})

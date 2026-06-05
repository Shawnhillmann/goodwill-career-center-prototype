import { describe, expect, it } from 'vitest'

import {
  clearPendingConversationState,
  nextConversationStateAfterAssistant,
  RESUME_CONFIRM_PHRASE,
} from './conversationState'
import { shouldOutputResumeDocument } from './resumeConfirm'

const resumeOffer = 'Reply CONFIRM RESUME to generate your resume, or tell me what to change.'

const sampleResume = `JANE DOE
AI Developer
jane@example.com | Hartford, CT

PROFESSIONAL SUMMARY
Experienced AI developer.

WORK EXPERIENCE
Goodwill — AI Developer | 2022–Present
• Built chat tools.`

describe('shouldOutputResumeDocument', () => {
  it('outputs a resume after structured pending state is set', () => {
    const state = nextConversationStateAfterAssistant(resumeOffer)
    expect(shouldOutputResumeDocument(state, RESUME_CONFIRM_PHRASE, [])).toBe(true)
  })

  it('outputs a revised resume after a new resume confirm gate', () => {
    const messages = [
      { role: 'user' as const, content: 'Help me build my resume' },
      { role: 'assistant' as const, content: resumeOffer },
      { role: 'user' as const, content: RESUME_CONFIRM_PHRASE },
      { role: 'assistant' as const, content: sampleResume },
      { role: 'user' as const, content: 'Add Python to skills' },
      {
        role: 'assistant' as const,
        content: 'I will add Python to your skills. Reply CONFIRM RESUME to regenerate.',
      },
    ]
    const state = nextConversationStateAfterAssistant(messages.at(-1)!.content)
    expect(shouldOutputResumeDocument(state, RESUME_CONFIRM_PHRASE, messages)).toBe(true)
  })

  it('does not output a resume for unrelated confirmed coaching', () => {
    expect(shouldOutputResumeDocument(clearPendingConversationState(), 'confirm', [])).toBe(false)
  })

  it('does not treat search pending state as resume generation', () => {
    const searchPreview = `Based on what you've told me, I'm ready to search.

I will search for:
• Accounting jobs in Middletown, CT

Reply CONFIRM SEARCH if you'd like me to begin this search.`
    const state = nextConversationStateAfterAssistant(searchPreview)
    expect(shouldOutputResumeDocument(state, 'confirm', [])).toBe(false)
  })
})

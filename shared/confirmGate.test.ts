import { describe, expect, it } from 'vitest'

import {
  advisorOfferedResumeConfirmation,
  findMostRecentConfirmGate,
} from './confirmGate'
import { isSearchConfirmationTurn } from './searchConfirm'
import { shouldOutputResumeDocument } from './resumeConfirm'

const searchPreview = `Based on what you've told me, I'm ready to search.

I will search for:
• Public hiring events within 20 miles of Middletown, CT
• In the next 60 days

Reply CONFIRM if you would like me to begin this search.`

const searchResults = `Nice — I searched for general, public hiring/career events within 20 miles of Middletown, CT.

• Hartford Job Fair — June 12, 2026 — https://example.com/fair`

const resumeConfirmOffer =
  'Thanks — I\'ll use a simple, professional one-page entry-level accounting resume. Reply **CONFIRM** to have me generate the resume content now.'

describe('confirmGate', () => {
  it('detects resume confirm offers with markdown bold', () => {
    expect(advisorOfferedResumeConfirmation(resumeConfirmOffer)).toBe(true)
  })

  it('prefers the most recent confirm gate when search and resume both exist', () => {
    const messages = [
      { role: 'user' as const, content: 'Find job fairs near Middletown CT' },
      { role: 'assistant' as const, content: searchPreview },
      { role: 'user' as const, content: 'confirm' },
      { role: 'assistant' as const, content: searchResults },
      { role: 'user' as const, content: 'Help me build a resume for accounting' },
      { role: 'assistant' as const, content: resumeConfirmOffer },
    ]
    expect(findMostRecentConfirmGate(messages)).toBe('resume')
    expect(isSearchConfirmationTurn(messages, 'confirm')).toBe(false)
    expect(shouldOutputResumeDocument(messages, 'confirm', false)).toBe(true)
  })

  it('still executes search when search preview is the active gate', () => {
    const messages = [
      { role: 'user' as const, content: 'Find retail jobs in Middletown CT' },
      { role: 'assistant' as const, content: searchPreview },
    ]
    expect(findMostRecentConfirmGate(messages)).toBe('search')
    expect(isSearchConfirmationTurn(messages, 'confirm')).toBe(true)
    expect(shouldOutputResumeDocument(messages, 'confirm', false)).toBe(false)
  })

  it('prefers search when user pivots back after resume prep without confirming', () => {
    const resumePrep = 'Reply confirm to generate your resume, or tell me what to change.'
    const messages = [
      { role: 'user' as const, content: 'Help with my resume' },
      { role: 'assistant' as const, content: resumePrep },
      { role: 'user' as const, content: 'Actually find accounting jobs in Hartford' },
      { role: 'assistant' as const, content: searchPreview },
    ]
    expect(findMostRecentConfirmGate(messages)).toBe('search')
    expect(isSearchConfirmationTurn(messages, 'confirm')).toBe(true)
    expect(shouldOutputResumeDocument(messages, 'confirm', false)).toBe(false)
  })
})

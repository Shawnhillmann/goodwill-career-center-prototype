import { describe, expect, it } from 'vitest'

import { shouldOutputResumeDocument } from './resumeConfirm'

const resumeOffer = 'Reply **confirm** to generate your resume, or tell me what to change.'

const sampleResume = `JANE DOE
AI Developer
jane@example.com | Hartford, CT

PROFESSIONAL SUMMARY
Experienced AI developer.

WORK EXPERIENCE
Goodwill — AI Developer | 2022–Present
• Built chat tools.`

describe('shouldOutputResumeDocument', () => {
  it('outputs a resume after the advisor offers confirmation', () => {
    const messages = [
      { role: 'user' as const, content: 'Help me build my resume' },
      { role: 'assistant' as const, content: resumeOffer },
    ]
    expect(shouldOutputResumeDocument(messages, 'confirm', false)).toBe(true)
  })

  it('outputs a second resume after the prior assistant message is the resume itself', () => {
    const messages = [
      { role: 'user' as const, content: 'Help me build my resume' },
      { role: 'assistant' as const, content: resumeOffer },
      { role: 'user' as const, content: 'confirm' },
      { role: 'assistant' as const, content: sampleResume },
      { role: 'user' as const, content: 'Add Python to skills and confirm' },
    ]
    expect(shouldOutputResumeDocument(messages, 'confirm', false)).toBe(true)
  })

  it('does not output a resume for unrelated confirmed coaching', () => {
    const messages = [
      { role: 'user' as const, content: 'Help me practice interviews' },
      { role: 'assistant' as const, content: 'What role are you pursuing?' },
    ]
    expect(shouldOutputResumeDocument(messages, 'confirm', false)).toBe(false)
  })

  it('does not treat search preview CONFIRM as resume generation', () => {
    const searchPreview = `Based on what you've told me, I'm ready to search.

I will search for:
• Accounting jobs in Middletown, CT
• In-person, full-time and part-time

Reply CONFIRM if you'd like me to begin this search.`

    const messages = [
      { role: 'user' as const, content: 'Find accounting jobs near Middletown CT' },
      { role: 'assistant' as const, content: searchPreview },
    ]
    expect(shouldOutputResumeDocument(messages, 'confirm', false)).toBe(false)
  })
})

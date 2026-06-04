import { describe, expect, it } from 'vitest'
import {
  advisorOfferedSearchPreview,
  evaluateSearchWorkflow,
  extractSearchPlan,
  isSearchIntentRequest,
  isWebSearchConfirmed,
  shouldExecuteWebSearch,
  buildApprovedSearchQuery,
} from './searchConfirm'

const previewMessage = `Based on what you've told me, I'm ready to search.

I will search for:
• Full-time retail jobs
• In-person positions
• Within 15 miles of Middletown, CT
• Entry-level opportunities

Reply CONFIRM to begin the search.`

describe('searchConfirm', () => {
  it('detects vague job search intent', () => {
    expect(isSearchIntentRequest('Find me entry level jobs')).toBe(true)
    expect(isSearchIntentRequest('Find jobs near me')).toBe(true)
    expect(isSearchIntentRequest('What is a cover letter?')).toBe(false)
    expect(isSearchIntentRequest('Review https://example.com/jobs/1')).toBe(false)
  })

  it('accepts explicit search confirmations', () => {
    expect(isWebSearchConfirmed('Confirm')).toBe(true)
    expect(isWebSearchConfirmed('Yes, search')).toBe(true)
    expect(isWebSearchConfirmed('Go ahead')).toBe(true)
    expect(isWebSearchConfirmed('Not yet')).toBe(false)
    expect(isWebSearchConfirmed('Change the location')).toBe(false)
  })

  it('detects advisor search previews', () => {
    expect(advisorOfferedSearchPreview(previewMessage)).toBe(true)
    expect(extractSearchPlan(previewMessage)?.bullets.length).toBeGreaterThanOrEqual(3)
  })

  it('blocks search until preview and confirm', () => {
    const clarifying = evaluateSearchWorkflow(
      [{ role: 'user', content: 'Find me jobs near me' }],
      'Find me jobs near me',
    )
    expect(clarifying.phase).toBe('clarifying')

    const awaiting = evaluateSearchWorkflow(
      [
        { role: 'user', content: 'Find retail jobs in Middletown CT' },
        { role: 'assistant', content: previewMessage },
      ],
      'Can you include part-time too?',
    )
    expect(awaiting.phase).toBe('awaiting_confirm')

    const messages = [
      { role: 'user', content: 'Find retail jobs in Middletown CT' },
      { role: 'assistant', content: previewMessage },
      { role: 'user', content: 'Confirm' },
    ] as const
    expect(shouldExecuteWebSearch([...messages], 'Confirm')).toBe(true)
    expect(evaluateSearchWorkflow([...messages], 'Confirm').phase).toBe('execute')
  })

  it('parses accounting search preview from confirm-first workflow', () => {
    const accountingPreview = `Based on what you've told me, I'm ready to search. I will search for:
• Accounting jobs (bookkeeper, staff accountant, accounting clerk, payroll clerk, etc.)
• In-person positions
• Within 15 miles of Middletown, CT
• Full-time and part-time opportunities

Reply CONFIRM if you would like me to begin this search.`

    expect(advisorOfferedSearchPreview(accountingPreview)).toBe(true)
    const plan = extractSearchPlan(accountingPreview)
    expect(plan?.bullets.length).toBeGreaterThanOrEqual(4)
    expect(plan?.bullets.some((b) => /accounting/i.test(b))).toBe(true)

    const messages = [
      { role: 'user', content: 'Find accounting jobs in Middletown CT' },
      { role: 'assistant', content: accountingPreview },
      { role: 'user', content: 'confirm' },
    ] as const
    expect(shouldExecuteWebSearch([...messages], 'confirm')).toBe(true)
  })

  it('adds 30-day recency rules to approved job search queries', () => {
    const ref = new Date('2026-06-04T12:00:00.000Z')
    const query = buildApprovedSearchQuery(
      {
        bullets: ['Accounting jobs in Middletown, CT', 'In-person, full-time'],
        rawPreview: '',
      },
      ref,
    )
    expect(query).toMatch(/RECENCY \(mandatory/i)
    expect(query).toMatch(/Exclude expired/i)
    expect(query).toMatch(/May 5, 2026/)
  })
})

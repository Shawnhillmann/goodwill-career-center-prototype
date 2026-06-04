import { describe, expect, it } from 'vitest'
import {
  formatJobSearchClarifyBlock,
  getJobSearchDetailStatus,
  getMissingJobSearchDetails,
  hasJobSearchDistancePreference,
  hasJobSearchPayPreference,
} from './jobSearchClarify'

describe('jobSearchClarify', () => {
  it('detects distance and pay preferences', () => {
    expect(hasJobSearchDistancePreference('within 15 miles of middletown ct')).toBe(true)
    expect(hasJobSearchDistancePreference('remote work only')).toBe(true)
    expect(hasJobSearchPayPreference('$18 to $22 per hour')).toBe(true)
    expect(hasJobSearchPayPreference('flexible on pay')).toBe(true)
  })

  it('lists all missing details for a partial job search request', () => {
    const messages = [
      { role: 'user' as const, content: 'find me accounting jobs in hartford ct' },
    ]
    const status = getJobSearchDetailStatus(messages)
    expect(status.have.some((h) => /role/i.test(h))).toBe(true)
    expect(status.have.some((h) => /city/i.test(h))).toBe(true)
    expect(status.stillNeed.some((m) => /in-person|remote/i.test(m))).toBe(true)
    expect(status.stillNeed.some((m) => /full-time/i.test(m))).toBe(true)
    expect(status.stillNeed.some((m) => /pay/i.test(m))).toBe(true)
    expect(status.stillNeed.some((m) => /distance|mile/i.test(m))).toBe(true)
    expect(status.stillNeed.length).toBeGreaterThan(2)
  })

  it('narrows still-needed list as user answers', () => {
    const messages = [
      { role: 'user' as const, content: 'find me accounting jobs in hartford ct' },
      { role: 'user' as const, content: 'in person, full-time, entry level' },
    ]
    const status = getJobSearchDetailStatus(messages)
    expect(status.stillNeed.some((m) => /in-person/i.test(m))).toBe(false)
    expect(status.stillNeed.some((m) => /full-time/i.test(m))).toBe(false)
    expect(status.stillNeed.some((m) => /pay/i.test(m))).toBe(true)
  })

  it('clears missing list when pay and distance are provided', () => {
    const messages = [
      { role: 'user' as const, content: 'Find retail jobs near Hartford, in person, full-time, entry level' },
      { role: 'user' as const, content: 'Within 20 miles, at least $16/hour' },
    ]
    expect(getMissingJobSearchDetails(messages)).toEqual([])
  })

  it('formats conversational guidance for the model', () => {
    const block = formatJobSearchClarifyBlock({
      have: ['city or area to search'],
      stillNeed: ['in-person, remote, or hybrid', 'target pay (hourly or salary range, or flexible on pay)'],
    })
    expect(block).toMatch(/conversational/i)
    expect(block).toMatch(/Do NOT say "one quick detail"/i)
    expect(block).toMatch(/no "What I have so far" header/i)
    expect(block).toMatch(/in-person, remote, or hybrid/)
  })

  it('does not track job search details during career exploration', () => {
    const messages = [
      {
        role: 'user' as const,
        content:
          'I would like help exploring careers that may fit me. Ask me about my interests, strengths, work history, education, and preferences.',
      },
    ]
    expect(getJobSearchDetailStatus(messages)).toEqual({ have: [], stillNeed: [] })
  })
})

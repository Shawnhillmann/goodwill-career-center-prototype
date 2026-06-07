import { describe, expect, it } from 'vitest'

import {
  buildListingRecencyInstructions,
  getListingSearchRecencyWindow,
  isListingSearchPlan,
  listingRecencyPreviewBullet,
  planAlreadyIncludesRecency,
} from './searchRecency'

describe('searchRecency', () => {
  const ref = new Date('2026-06-04T12:00:00.000Z')

  it('builds a 30-day window ending on the reference date', () => {
    const window = getListingSearchRecencyWindow(ref)
    expect(window.days).toBe(30)
    expect(window.endLabel).toMatch(/June 4, 2026/)
    expect(window.startLabel).toMatch(/May 5, 2026/)
  })

  it('detects listing-style search plans', () => {
    expect(
      isListingSearchPlan({
        action: 'search_confirmation_required',
        search_query: 'Accounting jobs in Hartford, CT in-person full-time',
        user_facing_confirmation: 'accounting jobs in Hartford, CT',
        search_category: 'jobs',
        missing_required_info: [],
        bullets: ['Accounting jobs in Hartford, CT', 'In-person, full-time'],
      }),
    ).toBe(true)
    expect(
      isListingSearchPlan({
        action: 'search_confirmation_required',
        search_query: 'Excel certification courses online under $500',
        user_facing_confirmation: 'Excel certification courses online',
        search_category: 'training',
        missing_required_info: [],
        bullets: ['Excel certification courses online', 'Budget under $500'],
      }),
    ).toBe(false)
  })

  it('detects when recency is already in the plan', () => {
    expect(
      planAlreadyIncludesRecency({
        action: 'search_confirmation_required',
        search_query: 'Retail jobs posted within the last 30 days',
        user_facing_confirmation: 'recent retail jobs',
        search_category: 'jobs',
        missing_required_info: [],
        bullets: ['Posted within the last 30 days'],
      }),
    ).toBe(true)
  })

  it('includes recency rules in execute instructions', () => {
    const text = buildListingRecencyInstructions(ref)
    expect(text).toMatch(/last 30 days/i)
    expect(text).toMatch(/Exclude expired/i)
    expect(text).toMatch(/May 5, 2026/)
  })

  it('formats a preview bullet for job searches', () => {
    expect(listingRecencyPreviewBullet(ref)).toMatch(/within the last 30 days/i)
  })
})

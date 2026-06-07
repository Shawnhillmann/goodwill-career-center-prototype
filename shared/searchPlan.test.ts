import { describe, expect, it } from 'vitest'
import {
  extractStructuredSearchPlanBlock,
  formatSearchPlanBlock,
  inferSearchCategory,
  isCoachingRequest,
  isLiveLookupRequest,
  normalizeSearchPlan,
  stripSearchPlanBlock,
} from './searchPlan'

describe('searchPlan', () => {
  it('detects live lookup for wages and natural factual questions', () => {
    expect(isLiveLookupRequest('What is the current CT minimum wage?')).toBe(true)
    expect(isLiveLookupRequest('minimum wage ct')).toBe(true)
    expect(isLiveLookupRequest('Who runs Goodwill in Boston?')).toBe(true)
    expect(isLiveLookupRequest('Look up OSHA 10 training providers near Hartford')).toBe(true)
  })

  it('does not treat coaching as live lookup', () => {
    expect(isCoachingRequest('How do I prepare for an interview?')).toBe(true)
    expect(isLiveLookupRequest('How do I prepare for an interview?')).toBe(false)
    expect(isLiveLookupRequest('What is a cover letter?')).toBe(false)
  })

  it('detects job and company hiring lookup', () => {
    expect(isLiveLookupRequest('What companies are hiring near Hartford?')).toBe(true)
    expect(isLiveLookupRequest('Find me entry level jobs')).toBe(true)
    expect(isLiveLookupRequest('jobs near me')).toBe(true)
  })

  it('parses and strips structured search plan blocks', () => {
    const block = formatSearchPlanBlock({
      action: 'search_confirmation_required',
      search_query: 'current minimum wage in Connecticut',
      user_facing_confirmation: 'the current minimum wage in Connecticut',
      search_category: 'wages',
      search_confidence: 'high',
      missing_required_info: [],
      bullets: ['Current minimum wage in Connecticut'],
    })
    const text = `I can look that up. Please confirm before I search.\n${ block }`
    const plan = extractStructuredSearchPlanBlock(text)
    expect(plan?.search_query).toMatch(/minimum wage/i)
    expect(plan?.search_category).toBe('wages')
    expect(stripSearchPlanBlock(text)).not.toMatch(/SEARCH_PLAN/)
  })

  it('normalizes legacy bullet-only plans', () => {
    const plan = normalizeSearchPlan({
      bullets: ['Accounting jobs in Middletown, CT'],
    })
    expect(plan?.search_query).toMatch(/Accounting jobs/)
    expect(plan?.search_category).toBe('jobs')
    expect(inferSearchCategory('Excel certification courses online')).toBe('training')
  })
})

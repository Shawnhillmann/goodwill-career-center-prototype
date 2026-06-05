import { describe, expect, it } from 'vitest'

import { MAX_WEB_SEARCH_RESULTS, buildSearchResultLimitInstructions } from './searchLimits'

describe('searchLimits', () => {
  it('caps web search results at three', () => {
    expect(MAX_WEB_SEARCH_RESULTS).toBe(3)
    const instructions = buildSearchResultLimitInstructions()
    expect(instructions).toMatch(/at most 3/i)
    expect(instructions).toMatch(/never more than 3/i)
  })
})

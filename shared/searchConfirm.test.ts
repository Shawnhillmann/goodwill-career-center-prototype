import { describe, expect, it } from 'vitest'
import {
  nextConversationStateAfterAssistant,
  SEARCH_CONFIRM_PHRASE,
} from './conversationState'
import {
  advisorOfferedSearchPreview,
  evaluateSearchWorkflow,
  extractSearchPlan,
  isLiveLookupRequest,
  isSearchIntentRequest,
  isWebSearchConfirmed,
  reconstructPendingSearchState,
  shouldExecuteWebSearch,
  buildApprovedSearchQuery,
  isSearchPlanRevisionRequest,
} from './searchConfirm'
import { formatSearchPlanBlock } from './searchPlan'
import { finalizeAssistantSearchReply } from './searchFinalize'

const previewMessage = `Based on what you've told me, I'm ready to search.

I will search for:
• Full-time retail jobs
• In-person positions
• Within 15 miles of Middletown, CT
• Entry-level opportunities

Reply CONFIRM SEARCH to begin the search.`

const structuredPreview = `I can look that up. Just to confirm, you want me to search for the current minimum wage in Connecticut, including any recent or upcoming changes. Please confirm before I search.
${ formatSearchPlanBlock({
  action: 'search_confirmation_required',
  search_query: 'current minimum wage in Connecticut including recent changes',
  user_facing_confirmation: 'the current minimum wage in Connecticut, including any recent or upcoming changes',
  search_category: 'wages',
  search_confidence: 'high',
  missing_required_info: [],
  bullets: ['Current minimum wage in Connecticut', 'Recent or upcoming wage changes'],
}) }`

describe('searchConfirm', () => {
  it('detects vague job search intent', () => {
    expect(isSearchIntentRequest('Find me entry level jobs')).toBe(true)
    expect(isLiveLookupRequest('Find jobs near me')).toBe(true)
    expect(isLiveLookupRequest('What is a cover letter?')).toBe(false)
    expect(isLiveLookupRequest('Review https://example.com/jobs/1')).toBe(false)
  })

  it('detects non-job live lookup intent', () => {
    expect(isLiveLookupRequest('Find job fairs near Hartford CT')).toBe(true)
    expect(isLiveLookupRequest('Search for tech companies in Boston')).toBe(true)
    expect(isLiveLookupRequest('Look up OSHA safety certification requirements')).toBe(true)
    expect(isLiveLookupRequest('What is the current CT minimum wage?')).toBe(true)
    expect(isLiveLookupRequest('minimum wage ct')).toBe(true)
    expect(isLiveLookupRequest('How do I write a cover letter')).toBe(false)
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

  it('extracts structured search plans and strips hidden blocks', () => {
    const finalized = finalizeAssistantSearchReply(structuredPreview)
    expect(finalized.reply).not.toMatch(/SEARCH_PLAN/)
    expect(finalized.conversationState.pendingSearchPlan?.search_category).toBe('wages')
    expect(finalized.conversationState.pendingSearchPlan?.user_facing_confirmation).toMatch(/minimum wage/i)
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
    expect(awaiting.phase).toBe('clarifying')

    const messages = [
      { role: 'user', content: 'Find retail jobs in Middletown CT' },
      { role: 'assistant', content: previewMessage },
      { role: 'user', content: SEARCH_CONFIRM_PHRASE },
    ] as const
    const state = nextConversationStateAfterAssistant(previewMessage)
    expect(shouldExecuteWebSearch(state, SEARCH_CONFIRM_PHRASE)).toBe(true)
    expect(evaluateSearchWorkflow([...messages], SEARCH_CONFIRM_PHRASE, state).phase).toBe('execute')
  })

  it('treats search revisions as clarifying', () => {
    const state = nextConversationStateAfterAssistant(previewMessage)
    expect(isSearchPlanRevisionRequest('make it part time cashier jobs', state)).toBe(true)
    const revised = evaluateSearchWorkflow(
      [
        { role: 'user', content: 'Find retail jobs in Hartford' },
        { role: 'assistant', content: previewMessage },
      ],
      'make it part time cashier jobs',
      state,
    )
    expect(revised.phase).toBe('clarifying')
  })

  it('reconstructs pending search state from message history', () => {
    const messages = [
      { role: 'user', content: 'minimum wage ct' },
      { role: 'assistant', content: structuredPreview },
    ]
    const state = reconstructPendingSearchState(messages, { pendingAction: null })
    expect(state.pendingAction).toBe('search')
    expect(state.pendingSearchPlan?.search_query).toMatch(/minimum wage/i)
  })

  it('adds 30-day recency rules to approved job search queries', () => {
    const ref = new Date('2026-06-04T12:00:00.000Z')
    const query = buildApprovedSearchQuery(
      {
        action: 'search_confirmation_required',
        search_query: 'Accounting jobs in Middletown, CT in-person full-time',
        user_facing_confirmation: 'accounting jobs in Middletown, CT',
        search_category: 'jobs',
        search_confidence: 'high',
        missing_required_info: [],
        bullets: ['Accounting jobs in Middletown, CT', 'In-person, full-time'],
      },
      ref,
    )
    expect(query).toMatch(/RECENCY \(mandatory/i)
    expect(query).toMatch(/Exclude expired/i)
    expect(query).toMatch(/May 5, 2026/)
    expect(query).toMatch(/at most 3/i)
  })
})

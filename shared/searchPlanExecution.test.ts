import { describe, expect, it } from 'vitest'
import { classifyUserRequest } from './searchClassification'
import {
  isPendingSearchConfirmVisible,
  nextConversationStateAfterAssistant,
  SEARCH_CONFIRM_PHRASE,
  isSearchActionConfirmed,
} from './conversationState'
import {
  formatSearchPlanBlock,
  isExecutableSearchPlan,
  isPendingSearchConfirmVisible as planConfirmVisible,
} from './searchPlan'
import { finalizeAssistantSearchReply } from './searchFinalize'

function route(prompt: string) {
  const assessment = classifyUserRequest(prompt)
  if (assessment.classification === 'coaching') return 'COACHING_RESPONSE'
  if (assessment.classification === 'clarification_required') return 'CLARIFICATION_REQUIRED'
  return 'SEARCH_CONFIRMATION'
}

const executableWarehousePlan = formatSearchPlanBlock({
  action: 'search_confirmation_required',
  search_query: 'warehouse jobs in Hartford, CT',
  user_facing_confirmation: 'warehouse jobs in Hartford, CT',
  search_category: 'jobs',
  search_confidence: 'high',
  missing_required_info: [],
  bullets: ['Warehouse jobs in Hartford, CT', 'In-person or remote as available'],
})

const executableCashierPlan = formatSearchPlanBlock({
  action: 'search_confirmation_required',
  search_query: 'part-time cashier jobs in 06106',
  user_facing_confirmation: 'part-time cashier jobs in ZIP code 06106',
  search_category: 'jobs',
  search_confidence: 'high',
  missing_required_info: [],
  bullets: ['Part-time cashier jobs', 'ZIP code 06106'],
})

const clarifyJobsPlan = formatSearchPlanBlock({
  action: 'search_confirmation_required',
  search_query: 'jobs near user',
  user_facing_confirmation: 'waiting for your location and job preferences so I can search for jobs',
  search_category: 'jobs',
  search_confidence: 'low',
  missing_required_info: ['city or ZIP code', 'type of role or job title'],
  bullets: ['Find jobs'],
})

describe('search plan execution gating', () => {
  it('classifies vague job requests as clarification required', () => {
    expect(route('find me jobs')).toBe('CLARIFICATION_REQUIRED')
    expect(route('jobs near me')).toBe('CLARIFICATION_REQUIRED')
  })

  it('classifies specific job requests as search confirmation', () => {
    expect(route('warehouse jobs in Hartford')).toBe('SEARCH_CONFIRMATION')
    expect(route('part time cashier jobs in 06106')).toBe('SEARCH_CONFIRMATION')
  })

  it('does not arm search state from clarification assistant replies', () => {
    const clarifyReply = `Nice — I can help find jobs. Before I search, tell me the area and a few other details so I pull useful results. Reply with those details in one message and I'll confirm the exact search I'll run.
${ clarifyJobsPlan }`

    const finalized = finalizeAssistantSearchReply(clarifyReply)
    expect(finalized.conversationState.pendingAction).toBeNull()
    expect(finalized.conversationState.pendingSearchPlan).toBeUndefined()
    expect(isPendingSearchConfirmVisible(finalized.conversationState)).toBe(false)
  })

  it('arms search state only for executable plans', () => {
    const confirmReply = `I can look that up. Just to confirm, you want me to search for warehouse jobs in Hartford, CT. Please confirm before I search.
${ executableWarehousePlan }`

    const state = nextConversationStateAfterAssistant(confirmReply)
    expect(state.pendingAction).toBe('search')
    expect(state.pendingSearchPlan?.search_query).toMatch(/warehouse jobs in Hartford/i)
    expect(isPendingSearchConfirmVisible(state)).toBe(true)
    expect(isSearchActionConfirmed(SEARCH_CONFIRM_PHRASE, state)).toBe(true)
  })

  it('accepts part-time cashier jobs in ZIP as executable', () => {
    const confirmReply = `I can look that up. Just to confirm, you want me to search for part-time cashier jobs in 06106. Please confirm before I search.
${ executableCashierPlan }`

    const state = nextConversationStateAfterAssistant(confirmReply)
    expect(isExecutableSearchPlan(state.pendingSearchPlan!)).toBe(true)
    expect(planConfirmVisible(state)).toBe(true)
  })

  it('rejects low-confidence plans with missing required info', () => {
    const plan = {
      action: 'search_confirmation_required' as const,
      search_query: 'jobs',
      user_facing_confirmation: 'waiting for your location and job preferences so I can search for jobs',
      search_category: 'jobs' as const,
      search_confidence: 'low' as const,
      missing_required_info: ['location', 'role'],
      bullets: ['Find jobs'],
    }
    expect(isExecutableSearchPlan(plan)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { finalizeAssistantSearchReply } from './searchFinalize'
import { formatSearchPlanBlock } from './searchPlan'
import {
  createAdvisorStreamSanitizer,
  enforceSearchConfirmInvariant,
  isSearchConfirmRecoveryVisible,
  shouldBufferSearchOfferReply,
  visibleAdvisorStreamText,
} from './searchSafeguards'
import { reconstructPendingSearchState, isSearchConfirmationTurn } from './searchConfirm'
import { SEARCH_CONFIRM_PHRASE } from './conversationState'

const structuredPreview = `I can look that up. Just to confirm, you want me to search for the current minimum wage in Connecticut. Please confirm before I search.
${ formatSearchPlanBlock({
  action: 'search_confirmation_required',
  search_query: 'current minimum wage in Connecticut',
  user_facing_confirmation: 'the current minimum wage in Connecticut',
  search_category: 'wages',
  search_confidence: 'high',
  missing_required_info: [],
  bullets: ['Current minimum wage in Connecticut'],
}) }`

describe('searchSafeguards', () => {
  it('hides SEARCH_PLAN metadata while streaming', () => {
    const partial = structuredPreview.slice(0, structuredPreview.indexOf('<!--') + 10)
    expect(visibleAdvisorStreamText(partial)).not.toMatch(/SEARCH_PLAN/)
    expect(visibleAdvisorStreamText(structuredPreview)).not.toMatch(/SEARCH_PLAN/)
  })

  it('sanitizer only emits newly visible stream text', () => {
    const sanitizer = createAdvisorStreamSanitizer()
    const first = sanitizer.push('I can look that up. ')
    const second = sanitizer.push('Please confirm before I search.\n<!--SEARCH_PLAN:{"action":')
    expect(first).toBe('I can look that up. ')
    expect(second).toBe('Please confirm before I search.\n')
    expect(second).not.toMatch(/SEARCH_PLAN/)
  })

  it('downgrades confirm language when no executable plan exists', () => {
    const broken = `I can look that up. Just to confirm, you want me to search for jobs near you. Please confirm before I search.
<!--SEARCH_PLAN:{"action":"search_confirmation_required","search_confidence":"low","missing_required_info":["location"]}-->`

    const finalized = enforceSearchConfirmInvariant(finalizeAssistantSearchReply(broken))
    expect(finalized.conversationState.pendingAction).toBeNull()
    expect(finalized.reply).not.toMatch(/confirm before i search/i)
    expect(finalized.reply).toMatch(/finalize the search setup/i)
  })

  it('buffers search-offer replies instead of streaming them', () => {
    expect(
      shouldBufferSearchOfferReply({
        searchClassification: 'search_confirmation',
      }),
    ).toBe(true)
    expect(
      shouldBufferSearchOfferReply({
        searchWorkflowPhase: 'clarifying',
        searchIntent: true,
      }),
    ).toBe(true)
    expect(
      shouldBufferSearchOfferReply({
        searchClassification: 'coaching',
        searchWorkflowPhase: 'none',
        searchIntent: false,
      }),
    ).toBe(false)
  })

  it('shows recovery UI when confirm language exists without pending state', () => {
    const finalized = finalizeAssistantSearchReply(structuredPreview)
    const messages = [
      { role: 'user', text: 'minimum wage ct' },
      { role: 'advisor', text: finalized.reply },
    ]

    expect(
      isSearchConfirmRecoveryVisible(messages, { pendingAction: null }, false),
    ).toBe(true)
    expect(
      isSearchConfirmRecoveryVisible(
        messages,
        finalizeAssistantSearchReply(structuredPreview).conversationState,
        false,
      ),
    ).toBe(false)
  })

  it('reconstructs confirm state from stripped assistant history', () => {
    const finalized = finalizeAssistantSearchReply(structuredPreview)
    const messages = [
      { role: 'user', content: 'minimum wage ct' },
      { role: 'assistant', content: finalized.reply },
    ]

    expect(
      isSearchConfirmationTurn({ pendingAction: null }, SEARCH_CONFIRM_PHRASE, messages),
    ).toBe(true)
    expect(reconstructPendingSearchState(messages, { pendingAction: null }).pendingAction).toBe('search')
  })
})

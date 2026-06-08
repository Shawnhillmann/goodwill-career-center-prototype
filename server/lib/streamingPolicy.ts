import { shouldBufferSearchOfferReply } from '../../shared/searchSafeguards.js'
import type { SearchRequestClassification } from '../../shared/searchPlan.js'
import type { SearchWorkflowPhase } from '../../shared/searchConfirm.js'

/** Keep in sync with src/lib/streamingPolicy.ts — doc-only and search-offer turns are buffered, not streamed. */
export function shouldStreamAdvisorReply(opts: {
  clientWantsStream: boolean
  docOnly: boolean
  webSearchExecute?: boolean
  searchWorkflowPhase?: SearchWorkflowPhase
  searchClassification?: SearchRequestClassification | null
  searchIntent?: boolean
}): boolean {
  if (!opts.clientWantsStream) return false
  if (opts.docOnly) return false
  if (opts.webSearchExecute) return false
  if (
    shouldBufferSearchOfferReply({
      searchWorkflowPhase: opts.searchWorkflowPhase,
      searchClassification: opts.searchClassification,
      searchIntent: opts.searchIntent,
    })
  ) {
    return false
  }
  return true
}

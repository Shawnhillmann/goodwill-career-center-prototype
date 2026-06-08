import type { ConversationState } from '../../shared/conversationState'
import type { QuickActionId } from '../quickActions'
import { classifyUserRequest } from '../../shared/searchPlan'
import {
  evaluateSearchWorkflow,
  isSearchConfirmationTurn,
  shouldBufferSearchOfferReply,
} from '../../shared/searchConfirm'
import { shouldOutputResumeDocument } from './resumeTask'

/** Short conversational replies stream; finished resume/CV documents and search offers do not. */
export function shouldStreamAdvisorReply(opts: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  userMessage: string
  expectDocument: boolean
  conversationState: ConversationState
  quickAction?: QuickActionId
}): boolean {
  if (opts.expectDocument) return false
  if (isSearchConfirmationTurn(opts.conversationState, opts.userMessage, opts.messages)) return false
  if (
    shouldOutputResumeDocument(
      opts.conversationState,
      opts.userMessage,
      opts.messages,
      opts.quickAction,
    )
  ) {
    return false
  }

  const assessment = classifyUserRequest(opts.userMessage)
  const workflow = evaluateSearchWorkflow(opts.messages, opts.userMessage, opts.conversationState)
  if (
    shouldBufferSearchOfferReply({
      searchWorkflowPhase: workflow.phase,
      searchClassification: assessment.classification,
      searchIntent: workflow.searchIntent,
    })
  ) {
    return false
  }

  return true
}

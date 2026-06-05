import type { ConversationState } from '../../shared/conversationState'
import type { QuickActionId } from '../quickActions'
import { isSearchActionConfirmed } from '../../shared/conversationState'
import { shouldOutputResumeDocument } from './resumeTask'

/** Short conversational replies stream; finished resume/CV documents do not. */
export function shouldStreamAdvisorReply(opts: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  userMessage: string
  expectDocument: boolean
  conversationState: ConversationState
  quickAction?: QuickActionId
}): boolean {
  if (opts.expectDocument) return false
  if (isSearchActionConfirmed(opts.userMessage, opts.conversationState)) return false
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
  return true
}

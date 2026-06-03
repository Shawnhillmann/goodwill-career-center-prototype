import type { QuickActionId } from '../quickActions'
import { shouldOutputResumeDocument } from './resumeTask'

/** Short conversational replies stream; finished resume/CV documents do not. */
export function shouldStreamAdvisorReply(opts: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  userMessage: string
  expectDocument: boolean
  quickAction?: QuickActionId
  hasUploadedDocument: boolean
}): boolean {
  if (opts.expectDocument) return false
  if (
    shouldOutputResumeDocument(
      opts.messages,
      opts.userMessage,
      opts.hasUploadedDocument,
      opts.quickAction,
    )
  ) {
    return false
  }
  return true
}

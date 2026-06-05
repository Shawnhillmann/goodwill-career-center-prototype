import type { ResumeChatTurn } from '../../shared/resumeConfirm.js'
import { shouldOutputResumeDocument } from '../../shared/resumeConfirm.js'
import type { ResumeTaskQuickAction } from '../../shared/resumeTask.js'

export {
  isResumeDeliverableRequest,
  isResumeOutputRequest,
  isExplicitDocumentRequest,
  type ResumeTaskQuickAction,
} from '../../shared/resumeTask.js'

export {
  isResumeGenerationConfirmed,
  shouldOutputResumeDocument,
  isResumePreparationTurn,
  advisorOfferedResumeConfirmation,
  type ResumeChatTurn,
} from '../../shared/resumeConfirm.js'

export function isResumeDocumentTask(
  state: Parameters<typeof shouldOutputResumeDocument>[0],
  lastUser: string,
  messages: ResumeChatTurn[],
  quickAction?: ResumeTaskQuickAction,
): boolean {
  return shouldOutputResumeDocument(state, lastUser, messages, quickAction)
}

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
  messages: ResumeChatTurn[],
  lastUser: string,
  hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
): boolean {
  return shouldOutputResumeDocument(messages, lastUser, hasUploadedDocument, quickAction)
}

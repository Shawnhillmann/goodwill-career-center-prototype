import {
  shouldOutputResumeDocument,
  type ResumeChatTurn,
} from '../../shared/resumeConfirm'
import type { ResumeTaskQuickAction } from '../../shared/resumeTask'

export type { ResumeTaskQuickAction, ResumeChatTurn }
export {
  isResumeDeliverableRequest,
  isExplicitDocumentRequest,
} from '../../shared/resumeTask'
export {
  isResumeGenerationConfirmed,
  shouldOutputResumeDocument,
  isResumePreparationTurn,
} from '../../shared/resumeConfirm'

/** Client: expect formatted resume only after user confirmed generation. */
export function isResumeOutputRequest(
  messages: ResumeChatTurn[],
  lastUser: string,
  hasUploadedDocument: boolean,
  quickAction?: ResumeTaskQuickAction,
): boolean {
  return shouldOutputResumeDocument(messages, lastUser, hasUploadedDocument, quickAction)
}

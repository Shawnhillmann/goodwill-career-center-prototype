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
  state: Parameters<typeof shouldOutputResumeDocument>[0],
  lastUser: string,
  messages: ResumeChatTurn[],
  quickAction?: ResumeTaskQuickAction,
): boolean {
  return shouldOutputResumeDocument(state, lastUser, messages, quickAction)
}

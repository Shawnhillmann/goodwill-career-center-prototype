import type { ChatMessage } from './advisorPrompt.js'
import { invokeOpenAiResponsesText } from './openaiResponses.js'
import { selectChatModel } from './openaiModels.js'

export async function invokePlainAdvisorChat(opts: {
  apiKey: string
  instructions: string
  messages: ChatMessage[]
  hasUploadedDocument: boolean
  maxOutputTokens?: number
}): Promise<{ reply: string; model: string; modelCallMs: number; fallbackUsed: boolean }> {
  const primaryModel = selectChatModel({ hasUploadedDocument: opts.hasUploadedDocument, isLiveWebSearch: false })
  const retryModel = selectChatModel({ hasUploadedDocument: true, isLiveWebSearch: false })
  const maxTokens = opts.maxOutputTokens ?? (opts.hasUploadedDocument ? 600 : 320)

  const startedAt = Date.now()
  let model = primaryModel
  let fallbackUsed = false

  let result = await invokeOpenAiResponsesText({
    apiKey: opts.apiKey,
    model,
    instructions: opts.instructions,
    messages: opts.messages,
    maxOutputTokens: maxTokens,
  })

  if (!result.text.trim() && primaryModel !== retryModel) {
    fallbackUsed = true
    model = retryModel
    result = await invokeOpenAiResponsesText({
      apiKey: opts.apiKey,
      model,
      instructions: opts.instructions,
      messages: opts.messages,
      maxOutputTokens: maxTokens,
    })
  }

  return {
    reply: result.text.trim(),
    model,
    modelCallMs: Date.now() - startedAt,
    fallbackUsed,
  }
}

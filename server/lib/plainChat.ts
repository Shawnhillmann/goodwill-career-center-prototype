import type { ChatMessage } from './advisorPrompt.js'
import { logChat } from './chatLog.js'
import { invokeOpenAiResponsesText, isReasoningOnlyEmpty, type ResponsesInvokeResult } from './openaiResponses.js'
import { selectChatModel } from './openaiModels.js'

export type PlainChatResult = {
  reply: string
  model: string
  modelCallMs: number
  fallbackUsed: boolean
  lastResult: ResponsesInvokeResult | null
}

export async function invokePlainAdvisorChat(opts: {
  apiKey: string
  instructions: string
  messages: ChatMessage[]
  hasUploadedDocument: boolean
  maxOutputTokens?: number
  requestId?: string
}): Promise<PlainChatResult> {
  const model = selectChatModel({ hasUploadedDocument: opts.hasUploadedDocument, isLiveWebSearch: false })
  const baseTokens = opts.maxOutputTokens ?? (opts.hasUploadedDocument ? 800 : 600)

  const startedAt = Date.now()
  let fallbackUsed = false
  let lastResult: ResponsesInvokeResult | null = null

  let result = await invokeOpenAiResponsesText({
    apiKey: opts.apiKey,
    model,
    instructions: opts.instructions,
    messages: opts.messages,
    maxOutputTokens: baseTokens,
    reasoningEffort: 'minimal',
  })
  lastResult = result
  let reply = result.text.trim()

  if (!reply) {
    if (opts.requestId) {
      logChat('plain_chat_empty_attempt', {
        requestId: opts.requestId,
        attempt: 'primary',
        model,
        maxOutputTokens: baseTokens,
        reasoningEffort: 'minimal',
        responseStatus: result.responseStatus,
        outputItemTypes: result.outputItemTypes,
        incompleteReason: result.incompleteReason,
        rawResponseLength: result.rawBodyLength,
        reasoningOnlyEmpty: isReasoningOnlyEmpty(result),
      })
    }

    if (isReasoningOnlyEmpty(result)) {
      fallbackUsed = true
      const retryTokens = Math.max(baseTokens * 2, 1200)
      result = await invokeOpenAiResponsesText({
        apiKey: opts.apiKey,
        model,
        instructions: opts.instructions,
        messages: opts.messages,
        maxOutputTokens: retryTokens,
        reasoningEffort: 'low',
      })
      lastResult = result
      reply = result.text.trim()

      if (opts.requestId) {
        logChat('plain_chat_token_retry', {
          requestId: opts.requestId,
          model,
          maxOutputTokens: retryTokens,
          parsedResponseLength: reply.length,
          responseStatus: result.responseStatus,
          outputItemTypes: result.outputItemTypes,
        })
      }
    }
  }

  if (opts.requestId) {
    logChat('plain_chat_complete', {
      requestId: opts.requestId,
      model,
      fallbackUsed,
      parsedResponseLength: reply.length,
    })
  }

  return {
    reply,
    model,
    modelCallMs: Date.now() - startedAt,
    fallbackUsed,
    lastResult,
  }
}

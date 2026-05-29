import type { ChatMessage } from './advisorPrompt.js'
import {
  advisorResponseJsonSchema,
  parseStructuredAdvisorJson,
  STRUCTURED_ADVISOR_JSON_INSTRUCTIONS,
  type StructuredAdvisorResponse,
} from './advisorStructuredResponse.js'
import { invokeOpenAiResponsesStructuredJson, invokeOpenAiResponsesText } from './openaiResponses.js'
import { selectChatModel } from './openaiModels.js'

export type AdvisorChatResult = {
  reply: string
  pendingWebSearchConfirmation: StructuredAdvisorResponse['offerWebSearch']
  model: string
  structured: boolean
}

export async function invokeAdvisorChat(opts: {
  apiKey: string
  instructions: string
  messages: ChatMessage[]
  hasUploadedDocument: boolean
  maxOutputTokens?: number
}): Promise<AdvisorChatResult> {
  const primaryModel = selectChatModel({ hasUploadedDocument: opts.hasUploadedDocument, isLiveWebSearch: false })
  const retryModel = selectChatModel({ hasUploadedDocument: true, isLiveWebSearch: false })
  const structuredInstructions = `${ opts.instructions }\n\n${ STRUCTURED_ADVISOR_JSON_INSTRUCTIONS }`

  let model = primaryModel
  let raw = await invokeOpenAiResponsesStructuredJson({
    apiKey: opts.apiKey,
    model,
    instructions: structuredInstructions,
    messages: opts.messages,
    jsonSchema: advisorResponseJsonSchema(),
    maxOutputTokens: opts.maxOutputTokens ?? (opts.hasUploadedDocument ? 700 : 500),
  })

  let parsed = parseStructuredAdvisorJson(raw.text, opts.messages)
  if (!parsed?.reply && primaryModel !== retryModel) {
    model = retryModel
    raw = await invokeOpenAiResponsesStructuredJson({
      apiKey: opts.apiKey,
      model,
      instructions: structuredInstructions,
      messages: opts.messages,
      jsonSchema: advisorResponseJsonSchema(),
      maxOutputTokens: opts.maxOutputTokens ?? (opts.hasUploadedDocument ? 700 : 500),
    })
    parsed = parseStructuredAdvisorJson(raw.text, opts.messages)
  }

  if (parsed?.reply) {
    return {
      reply: parsed.reply,
      pendingWebSearchConfirmation: parsed.offerWebSearch,
      model,
      structured: true,
    }
  }

  // Last resort: plain text (no pending — structured offer requires valid JSON)
  const fallback = await invokeOpenAiResponsesText({
    apiKey: opts.apiKey,
    model: retryModel,
    instructions: opts.instructions,
    messages: opts.messages,
    maxOutputTokens: opts.maxOutputTokens ?? (opts.hasUploadedDocument ? 700 : 400),
  })

  return {
    reply: fallback.text.trim(),
    pendingWebSearchConfirmation: null,
    model: retryModel,
    structured: false,
  }
}

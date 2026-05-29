import type { ChatMessage } from './advisorPrompt.js'
import {
  advisorResponseJsonSchema,
  parseStructuredAdvisorJson,
  sanitizeVisibleReply,
  STRUCTURED_ADVISOR_JSON_INSTRUCTIONS,
  type StructuredAdvisorResponse,
} from './advisorStructuredResponse.js'
import { invokeOpenAiResponsesStructuredJson } from './openaiResponses.js'
import { selectChatModel } from './openaiModels.js'

export type AdvisorChatTimings = {
  totalMs: number
  modelCallMs: number
  structuredParseMs: number
  retryMs: number
  fallbackMs: number
}

export type AdvisorChatResult = {
  reply: string
  pendingWebSearchConfirmation: StructuredAdvisorResponse['offerWebSearch']
  model: string
  structured: boolean
  timings: AdvisorChatTimings
  retried: boolean
}

export async function invokeAdvisorChat(opts: {
  apiKey: string
  instructions: string
  messages: ChatMessage[]
  hasUploadedDocument: boolean
  maxOutputTokens?: number
}): Promise<AdvisorChatResult> {
  const startedAt = Date.now()
  const primaryModel = selectChatModel({ hasUploadedDocument: opts.hasUploadedDocument, isLiveWebSearch: false })
  const retryModel = selectChatModel({ hasUploadedDocument: true, isLiveWebSearch: false })
  const structuredInstructions = `${ opts.instructions }\n\n${ STRUCTURED_ADVISOR_JSON_INSTRUCTIONS }`
  const maxTokens =
    opts.maxOutputTokens ?? (opts.hasUploadedDocument ? 600 : 280)

  let modelCallMs = 0
  let structuredParseMs = 0
  let retryMs = 0
  let fallbackMs = 0
  let retried = false

  const modelCallStart = Date.now()
  let model = primaryModel
  let raw = await invokeOpenAiResponsesStructuredJson({
    apiKey: opts.apiKey,
    model,
    instructions: structuredInstructions,
    messages: opts.messages,
    jsonSchema: advisorResponseJsonSchema(),
    maxOutputTokens: maxTokens,
  })
  modelCallMs += Date.now() - modelCallStart

  const parseStart = Date.now()
  let parsed = parseStructuredAdvisorJson(raw.text, opts.messages)
  structuredParseMs += Date.now() - parseStart

  // Retry only when the model returned nothing — not on parse failure (avoid extra latency).
  if (!raw.text.trim() && primaryModel !== retryModel) {
    retried = true
    model = retryModel
    const retryStart = Date.now()
    raw = await invokeOpenAiResponsesStructuredJson({
      apiKey: opts.apiKey,
      model,
      instructions: structuredInstructions,
      messages: opts.messages,
      jsonSchema: advisorResponseJsonSchema(),
      maxOutputTokens: maxTokens,
    })
    retryMs = Date.now() - retryStart
    modelCallMs += retryMs

    const retryParseStart = Date.now()
    parsed = parseStructuredAdvisorJson(raw.text, opts.messages)
    structuredParseMs += Date.now() - retryParseStart
  }

  if (parsed?.reply) {
    return {
      reply: sanitizeVisibleReply(parsed.reply),
      pendingWebSearchConfirmation: parsed.offerWebSearch,
      model,
      structured: true,
      retried,
      timings: {
        totalMs: Date.now() - startedAt,
        modelCallMs,
        structuredParseMs,
        retryMs,
        fallbackMs,
      },
    }
  }

  // Recover visible prose from mixed/invalid output — no additional model call.
  const fallbackStart = Date.now()
  const recovered = sanitizeVisibleReply(raw.text)
  fallbackMs = Date.now() - fallbackStart

  return {
    reply: recovered || 'Sorry — I had trouble formatting that reply. Could you try again?',
    pendingWebSearchConfirmation: null,
    model,
    structured: false,
    retried,
    timings: {
      totalMs: Date.now() - startedAt,
      modelCallMs,
      structuredParseMs,
      retryMs,
      fallbackMs,
    },
  }
}

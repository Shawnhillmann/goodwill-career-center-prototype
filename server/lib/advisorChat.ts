import type { ChatMessage } from './advisorPrompt.js'
import { logChat } from './chatLog.js'
import {
  advisorResponseJsonSchema,
  extractVisibleReplyFromModelOutput,
  sanitizeVisibleReply,
  STRUCTURED_ADVISOR_JSON_INSTRUCTIONS,
  type StructuredAdvisorResponse,
} from './advisorStructuredResponse.js'
import { invokeOpenAiResponsesStructuredJson, invokeOpenAiResponsesText } from './openaiResponses.js'
import { selectChatModel } from './openaiModels.js'

export type AdvisorChatTimings = {
  totalMs: number
  modelCallMs: number
  structuredParseMs: number
  retryMs: number
  fallbackMs: number
  plainTextFallbackMs: number
}

export type AdvisorChatResult = {
  reply: string
  pendingWebSearchConfirmation: StructuredAdvisorResponse['offerWebSearch']
  model: string
  structured: boolean
  timings: AdvisorChatTimings
  retried: boolean
  usedPlainTextFallback: boolean
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
  const maxTokens = opts.maxOutputTokens ?? (opts.hasUploadedDocument ? 600 : 400)

  let modelCallMs = 0
  let structuredParseMs = 0
  let retryMs = 0
  let fallbackMs = 0
  let plainTextFallbackMs = 0
  let retried = false
  let usedPlainTextFallback = false

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
  let parsed = extractVisibleReplyFromModelOutput(raw.text, opts.messages)
  structuredParseMs += Date.now() - parseStart

  if (!parsed?.reply && !raw.text.trim() && primaryModel !== retryModel) {
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
    parsed = extractVisibleReplyFromModelOutput(raw.text, opts.messages)
    structuredParseMs += Date.now() - retryParseStart
  }

  if (parsed?.reply) {
    return {
      reply: sanitizeVisibleReply(parsed.reply),
      pendingWebSearchConfirmation: parsed.offerWebSearch,
      model,
      structured: !usedPlainTextFallback,
      retried,
      usedPlainTextFallback,
      timings: {
        totalMs: Date.now() - startedAt,
        modelCallMs,
        structuredParseMs,
        retryMs,
        fallbackMs,
        plainTextFallbackMs,
      },
    }
  }

  logChat('structured_parse_failed', {
    model,
    rawLength: raw.text.length,
    responseStatus: raw.responseStatus,
    rawPreview: raw.text.slice(0, 120).replace(/\s+/g, ' '),
  })

  const plainStart = Date.now()
  usedPlainTextFallback = true
  model = retryModel
  const plain = await invokeOpenAiResponsesText({
    apiKey: opts.apiKey,
    model,
    instructions: opts.instructions,
    messages: opts.messages,
    maxOutputTokens: maxTokens,
  })
  plainTextFallbackMs = Date.now() - plainStart
  modelCallMs += plainTextFallbackMs

  fallbackMs = plainTextFallbackMs
  const plainReply = sanitizeVisibleReply(plain.text)

  return {
    reply: plainReply || 'Sorry — I had trouble responding. Please try again in a moment.',
    pendingWebSearchConfirmation: null,
    model,
    structured: false,
    retried,
    usedPlainTextFallback,
    timings: {
      totalMs: Date.now() - startedAt,
      modelCallMs,
      structuredParseMs,
      retryMs,
      fallbackMs,
      plainTextFallbackMs,
    },
  }
}

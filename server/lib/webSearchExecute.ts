import type { ChatMessage } from './advisorPrompt.js'
import { logChat } from './chatLog.js'
import {
  invokeOpenAiResponsesText,
  isReasoningOnlyEmpty,
  type ResponsesInvokeResult,
} from './openaiResponses.js'
import { selectChatModel } from './openaiModels.js'
import type { SearchPlan } from '../../shared/searchConfirm.js'
import { buildApprovedSearchQuery } from '../../shared/searchConfirm.js'
import { buildSearchExecutePrompt } from './searchWorkflowPrompt.js'
import { buildSearchEmptyResultReply } from './webSearchFallback.js'
import { MAX_WEB_SEARCH_RESULTS } from '../../shared/searchLimits.js'

const SEARCH_FIRST_PASS_MAX_TOKENS = 1000
const SEARCH_RETRY_MAX_TOKENS = 1400

export type WebSearchChatResult = {
  reply: string
  model: string
  modelCallMs: number
  lastResult: ResponsesInvokeResult | null
  usedFallback: boolean
}

async function runWebSearchAttempt(opts: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  maxOutputTokens: number
  reasoningEffort?: 'low' | 'medium'
}): Promise<ResponsesInvokeResult> {
  return invokeOpenAiResponsesText({
    apiKey: opts.apiKey,
    model: opts.model,
    instructions: opts.instructions,
    messages: opts.messages,
    maxOutputTokens: opts.maxOutputTokens,
    tools: [{ type: 'web_search' }],
    toolChoice: 'required',
    reasoningEffort: opts.reasoningEffort,
  })
}

/** Run an approved web search via OpenAI Responses `web_search` tool. */
export async function invokeAdvisorWebSearch(opts: {
  apiKey: string
  instructions: string
  messages: ChatMessage[]
  plan: SearchPlan
  requestId?: string
}): Promise<WebSearchChatResult> {
  const model = selectChatModel({ hasUploadedDocument: false })
  const startedAt = Date.now()

  const searchInstructions = `${ opts.instructions }\n\n${ buildSearchExecutePrompt(opts.plan) }`
  const approvedQuery = buildApprovedSearchQuery(opts.plan)
  const searchMessages: ChatMessage[] = [
    ...opts.messages.slice(0, -1),
    {
      role: 'user',
      content: `${ opts.messages.at(-1)?.content ?? 'Confirm' }\n\n${ approvedQuery }`,
    },
  ]

  let result = await runWebSearchAttempt({
    apiKey: opts.apiKey,
    model,
    instructions: searchInstructions,
    messages: searchMessages,
    maxOutputTokens: SEARCH_FIRST_PASS_MAX_TOKENS,
    reasoningEffort: 'low',
  })

  if (!result.text.trim() && isReasoningOnlyEmpty(result)) {
    result = await runWebSearchAttempt({
      apiKey: opts.apiKey,
      model,
      instructions: searchInstructions,
      messages: searchMessages,
      maxOutputTokens: SEARCH_RETRY_MAX_TOKENS,
      reasoningEffort: 'medium',
    })
  }

  let reply = result.text.trim()
  let usedFallback = false

  if (!reply) {
    usedFallback = true
    reply = buildSearchEmptyResultReply(opts.plan)
    if (opts.requestId) {
      logChat('web_search_empty_fallback', {
        requestId: opts.requestId,
        model,
        outputItemTypes: result.outputItemTypes,
        incompleteReason: result.incompleteReason,
      })
    }
  }

  if (opts.requestId) {
    logChat('web_search_executed', {
      requestId: opts.requestId,
      model,
      criteriaCount: opts.plan.bullets.length,
      maxResults: MAX_WEB_SEARCH_RESULTS,
      parsedResponseLength: reply.length,
      outputItemTypes: result.outputItemTypes,
      usedFallback,
    })
  }

  return {
    reply,
    model,
    modelCallMs: Date.now() - startedAt,
    lastResult: result,
    usedFallback,
  }
}

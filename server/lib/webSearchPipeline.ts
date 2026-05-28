import type { ChatMessage } from './advisorPrompt.js'
import { logChat } from './chatLog.js'
import { assessLiveSearchOutput, type GroundingQuality } from './hallucinationGuard.js'
import { selectChatModel } from './openaiModels.js'
import {
  invokeOpenAiResponsesText,
  invokeOpenAiResponsesWebSearch,
  type ResponsesInvokeResult,
  type WebSearchToolChoice,
} from './openaiResponses.js'
import type { SearchIntent } from './searchIntent.js'
import { appendWebGroundingToInstructions, formatWebResultsForInstructions } from './webGrounding.js'
import { webSearch } from './webSearch.js'

export type WebSearchPipelineResult =
  | { ok: true; reply: string; stage: string; model: string }
  | { ok: false; userMessage: string; detail: string }

const LIVE_SEARCH_INSTRUCTIONS_SUFFIX =
  '\n\nUse live web search results to answer. Never fabricate listings, events, dates, locations, or companies.' +
  '\nReturn 3–5 concrete items when possible (job listings or events), each with: title, company/organization, location, and a direct link.' +
  '\nIf results are broad, share the best matches first, then offer ONE optional refinement question at the end.' +
  '\nIf you cannot find concrete listings, say so honestly and suggest a sharper search query.'

function groundingFailureReason(quality: GroundingQuality): string {
  switch (quality) {
    case 'empty':
      return 'empty_output'
    case 'placeholder':
      return 'placeholder_template'
    case 'ungrounded_claim':
      return 'ungrounded_search_claim'
    case 'no_links':
      return 'no_links_or_citations'
    default:
      return 'unknown'
  }
}

function isUsableLiveSearch(result: ResponsesInvokeResult): { usable: boolean; quality: GroundingQuality } {
  const quality = assessLiveSearchOutput(result.text, result.citationCount)
  return { usable: quality === 'ok', quality }
}

type WebSearchAttemptSuccess = { result: ResponsesInvokeResult; model: string; stage: string }

async function tryOpenAiWebSearch(opts: {
  apiKey: string
  model: string
  instructions: string
  messages: ChatMessage[]
  toolChoice: WebSearchToolChoice
  stage: string
}): Promise<WebSearchAttemptSuccess | null> {
  const startedAt = Date.now()
  try {
    const result = await invokeOpenAiResponsesWebSearch({
      apiKey: opts.apiKey,
      model: opts.model,
      instructions: opts.instructions,
      messages: opts.messages,
      toolChoice: opts.toolChoice,
    })
    const { usable, quality } = isUsableLiveSearch(result)
    logChat('web_search_attempt', {
      stage: opts.stage,
      model: opts.model,
      toolChoice: opts.toolChoice,
      latencyMs: result.latencyMs,
      citationCount: result.citationCount,
      linkCountInText: result.linkCountInText,
      responseStatus: result.responseStatus,
      usable,
      failureReason: usable ? undefined : groundingFailureReason(quality),
    })
    return usable ? { result, model: opts.model, stage: opts.stage } : null
  } catch (err) {
    logChat('web_search_attempt_failed', {
      stage: opts.stage,
      model: opts.model,
      toolChoice: opts.toolChoice,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

export async function runLiveWebSearchPipeline(opts: {
  apiKey: string
  baseInstructions: string
  messages: ChatMessage[]
  intent: Exclude<SearchIntent, { kind: 'none' }>
}): Promise<WebSearchPipelineResult> {
  const instructions = opts.baseInstructions + LIVE_SEARCH_INSTRUCTIONS_SUFFIX
  const miniModel = selectChatModel({ hasUploadedDocument: false, isLiveWebSearch: true })
  const fallbackModel = selectChatModel({
    hasUploadedDocument: false,
    isLiveWebSearch: true,
    tier: 'search_fallback',
  })

  logChat('web_search_pipeline_start', {
    intentKind: opts.intent.kind,
    queryLength: opts.intent.query.length,
    primaryModel: miniModel,
    fallbackModel,
  })

  // A) gpt-5-mini + web_search (auto — less brittle than required)
  let winner = await tryOpenAiWebSearch({
    apiKey: opts.apiKey,
    model: miniModel,
    instructions,
    messages: opts.messages,
    toolChoice: 'auto',
    stage: 'A_mini_auto',
  })

  // A2) same model, required tool — only if auto produced unusable output
  if (!winner) {
    winner = await tryOpenAiWebSearch({
      apiKey: opts.apiKey,
      model: miniModel,
      instructions,
      messages: opts.messages,
      toolChoice: 'required',
      stage: 'A2_mini_required',
    })
  }

  // B) gpt-5.5 + web_search when mini path failed
  if (!winner) {
    logChat('web_search_fallback', { from: miniModel, to: fallbackModel, reason: 'mini_unusable_or_failed' })
    winner = await tryOpenAiWebSearch({
      apiKey: opts.apiKey,
      model: fallbackModel,
      instructions,
      messages: opts.messages,
      toolChoice: 'auto',
      stage: 'B_fallback_auto',
    })
  }

  if (!winner) {
    winner = await tryOpenAiWebSearch({
      apiKey: opts.apiKey,
      model: fallbackModel,
      instructions,
      messages: opts.messages,
      toolChoice: 'required',
      stage: 'B2_fallback_required',
    })
  }

  if (winner?.result.text.trim()) {
    return {
      ok: true,
      reply: winner.result.text.trim(),
      stage: winner.stage,
      model: winner.model,
    }
  }

  // C) DuckDuckGo grounding + gpt-5-mini summarization (no web_search tool)
  try {
    const ddgStarted = Date.now()
    const ddgResults = await webSearch(opts.intent.query, 8)
    logChat('ddg_fetch', {
      resultCount: ddgResults.length,
      latencyMs: Date.now() - ddgStarted,
    })

    if (ddgResults.length) {
      const groundedInstructions = appendWebGroundingToInstructions(
        instructions,
        formatWebResultsForInstructions(ddgResults),
      )
      const summarized = await invokeOpenAiResponsesText({
        apiKey: opts.apiKey,
        model: miniModel,
        instructions: groundedInstructions,
        messages: opts.messages,
      })

      const quality = assessLiveSearchOutput(summarized.text, summarized.citationCount)
      logChat('ddg_summarize', {
        model: miniModel,
        latencyMs: summarized.latencyMs,
        linkCountInText: summarized.linkCountInText,
        quality,
      })

      if (quality === 'ok' && summarized.text.trim()) {
        return { ok: true, reply: summarized.text.trim(), stage: 'ddg_grounded_summarize', model: miniModel }
      }
    }
  } catch (err) {
    logChat('ddg_pipeline_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // D) clean error
  return {
    ok: false,
    userMessage: 'Unable to retrieve live results right now. Please try again in a moment.',
    detail: 'All web search stages failed (OpenAI web_search + manual grounding).',
  }
}

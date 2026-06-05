import { findActiveSearchPreviewMessage, advisorOfferedSearchPreview } from './confirmGate.js'
import {
  type ConversationState,
  EMPTY_CONVERSATION_STATE,
  isSearchActionConfirmed,
  normalizeConversationState,
} from './conversationState.js'
import {
  buildListingRecencyInstructions,
  isListingSearchPlan,
} from './searchRecency.js'
import { buildSearchResultLimitInstructions } from './searchLimits.js'

export { advisorOfferedSearchPreview } from './confirmGate.js'

export type SearchChatTurn = { role: 'user' | 'assistant'; content: string }

export type SearchPlan = {
  bullets: string[]
  rawPreview: string
}

export type SearchWorkflowPhase = 'none' | 'clarifying' | 'awaiting_confirm' | 'execute'

export type SearchWorkflowState = {
  phase: SearchWorkflowPhase
  plan: SearchPlan | null
  searchIntent: boolean
}

function isCoachingNotLiveSearch(text: string): boolean {
  const s = text.toLowerCase()
  return (
    /\b(what is|what are|how do i|how can i|how should i|tips for|help me (write|improve|practice|prepare|word))\b/.test(
      s,
    ) ||
    /\b(find (the right |better )?words|find a way to say)\b/.test(s) ||
    /\b(interview (question|answer|tip|prep)|cover letter|resume tip)\b/.test(s)
  )
}

/** User wants a live web lookup (jobs, companies, events, training, or any other topic). */
export function isSearchIntentRequest(text: string): boolean {
  const s = text.toLowerCase().trim()
  if (!s || /\bhttps?:\/\//.test(text)) return false
  if (isCoachingNotLiveSearch(s)) return false

  if (/\b(search the web|search online|web search|look (it |that |this )?up online)\b/.test(s)) {
    return true
  }

  const hasSearchVerb = /\b(find|search|look up|look for|browse for)\b/.test(s)
  if (!hasSearchVerb) return false

  if (
    /\b(jobs?|openings?|listings?|positions?|work)\b/.test(s) ||
    /\b(job fairs?|hiring events?|career fairs?)\b/.test(s) ||
    /\b(compan(?:y|ies)|employers?|businesses|organizations?)\b/.test(s) ||
    /\b(people|person|recruiters?|hiring managers?|staffing agencies?)\b/.test(s) ||
    /\b(local resources?|training programs?|programs?|classes?|certification|certifications)\b/.test(s) ||
    /\b(jobs? near me|near me|remote work|remote jobs?|hybrid jobs?)\b/.test(s) ||
    /\bwhat companies are hiring\b/.test(s) ||
    /\bhelp me find\b/.test(s) ||
    /\bentry[- ]level\b/.test(s) ||
    /\b(salary|pay range|wage)s?\b/.test(s)
  ) {
    return true
  }

  // Generic open-ended lookup, e.g. "look up OSHA requirements" or "search for welding schools"
  return /\b(find|search|look up|look for|browse for)\s+\S/.test(s)
}

/** Explicit approval after seeing a search preview. */
export function isWebSearchConfirmed(message: string): boolean {
  const s = message.toLowerCase().trim()
  if (!s) return false
  if (/\b(don't|do not|not yet|wait|cancel|stop|never mind|nevermind)\b/.test(s)) return false

  if (
    /^(confirm|confirmed|yes|yep|yeah|yup|ok|okay|sure|go ahead|proceed|start search|search now)\.?!?$/i.test(s)
  ) {
    return true
  }

  return (
    /\b(yes, search|start search|search now|go ahead and search|proceed with search|begin search|begin the search)\b/.test(
      s,
    ) && !/\b(don't|do not|not yet|wait|change|edit|update|revise)\b/.test(s)
  )
}

function extractBulletLines(text: string): string[] {
  const lines: string[] = []

  for (const match of text.matchAll(/^\s*[•\-\*]\s+(.+)$/gm)) {
    const line = match[1]?.trim() ?? ''
    if (line.length >= 4) lines.push(line)
  }
  if (lines.length) return lines

  const afterSearchFor = text.split(/\bI will search for:\s*/i)[1]
  if (afterSearchFor) {
    const section = afterSearchFor.split(/\bReply\s+CONFIRM\b/i)[0] ?? afterSearchFor
    for (const part of section.split(/•/)) {
      const line = part.replace(/\s+/g, ' ').trim()
      if (line.length >= 4) lines.push(line)
    }
  }

  if (lines.length) return lines

  for (const match of text.matchAll(/^\s*\d+[.)]\s+(.+)$/gm)) {
    const line = match[1]?.trim() ?? ''
    if (line.length >= 4) lines.push(line)
  }

  return lines
}

export function findSearchPreviewMessage(messages: SearchChatTurn[]): string {
  return findActiveSearchPreviewMessage(messages)
}

export function extractSearchPlan(assistantText: string): SearchPlan | null {
  if (!advisorOfferedSearchPreview(assistantText)) return null

  const bullets = extractBulletLines(assistantText)

  if (bullets.length === 0) {
    const inline = assistantText.match(/\bI will search for:\s*([^\n]+)/i)
    if (inline?.[1]) bullets.push(inline[1].trim())
  }

  if (bullets.length === 0) return null

  return { bullets, rawPreview: assistantText }
}

export function resolveSearchPlan(messages: SearchChatTurn[]): SearchPlan | null {
  const preview = findSearchPreviewMessage(messages)
  if (!preview) return null
  return extractSearchPlan(preview)
}

function lastAssistantMessage(messages: SearchChatTurn[]): string {
  return [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''
}

export function threadHasSearchIntent(messages: SearchChatTurn[]): boolean {
  return messages.some((m) => m.role === 'user' && isSearchIntentRequest(m.content))
}

export function shouldExecuteWebSearch(
  state: ConversationState,
  lastUser: string,
): boolean {
  return isSearchActionConfirmed(lastUser, state)
}

export function getSearchWorkflowPhase(
  messages: SearchChatTurn[],
  lastUser: string,
  state: ConversationState = EMPTY_CONVERSATION_STATE,
): SearchWorkflowPhase {
  if (shouldExecuteWebSearch(state, lastUser)) return 'execute'

  if (state.pendingAction === 'search' && state.pendingSearchPlan) {
    return 'awaiting_confirm'
  }

  const lastAssistant = lastAssistantMessage(messages)

  if (lastAssistant && advisorOfferedSearchPreview(lastAssistant)) {
    return 'clarifying'
  }

  if (threadHasSearchIntent(messages) || isSearchIntentRequest(lastUser)) return 'clarifying'

  return 'none'
}

export function evaluateSearchWorkflow(
  messages: SearchChatTurn[],
  lastUser: string,
  state: ConversationState = EMPTY_CONVERSATION_STATE,
): SearchWorkflowState {
  const structuredPlan =
    state.pendingAction === 'search' ? (state.pendingSearchPlan ?? null) : null
  const previewText = structuredPlan ? structuredPlan.rawPreview : findSearchPreviewMessage(messages)
  const plan = structuredPlan ?? (previewText ? extractSearchPlan(previewText) : null)
  let phase = getSearchWorkflowPhase(messages, lastUser, state)

  if (
    phase !== 'execute' &&
    plan &&
    state.pendingAction === 'search' &&
    !isSearchActionConfirmed(lastUser, state)
  ) {
    phase = 'awaiting_confirm'
  } else if (
    phase !== 'execute' &&
    plan &&
    previewText &&
    advisorOfferedSearchPreview(previewText) &&
    !isWebSearchConfirmed(lastUser)
  ) {
    phase = 'awaiting_confirm'
  }

  return {
    phase,
    plan,
    searchIntent: threadHasSearchIntent(messages) || isSearchIntentRequest(lastUser),
  }
}

export function buildApprovedSearchQuery(plan: SearchPlan, referenceDate = new Date()): string {
  const criteria = plan.bullets.map((b) => `• ${ b }`).join('\n')
  const lines = [
    'The user confirmed the search preview. Execute a web search now using exactly these approved criteria:',
    criteria,
    '',
    'Find current, relevant results. Summarize what you find with source links when available.',
    'Do not invent employers, programs, salaries, or URLs.',
    '',
    buildSearchResultLimitInstructions(),
  ]

  if (isListingSearchPlan(plan)) {
    lines.push('', buildListingRecencyInstructions(referenceDate))
  }

  return lines.join('\n')
}

/** True when the user confirms a structured pending search action. */
export function isSearchConfirmationTurn(
  state: ConversationState | unknown,
  lastUser: string,
): boolean {
  return isSearchActionConfirmed(lastUser, normalizeConversationState(state))
}

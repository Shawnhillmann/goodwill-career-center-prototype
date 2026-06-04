import {
  findMostRecentConfirmGate,
  findActiveSearchPreviewMessage,
  advisorOfferedSearchPreview,
} from './confirmGate.js'
import {
  buildListingRecencyInstructions,
  isListingSearchPlan,
} from './searchRecency.js'

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

/** User wants the advisor to find jobs, programs, or resources via search. */
export function isSearchIntentRequest(text: string): boolean {
  const s = text.toLowerCase()
  if (/\bhttps?:\/\//.test(text)) return false
  return (
    /\b(find|search|look up|look for|browse)\b.{0,40}\b(jobs?|openings?|listings?|positions?|work)\b/.test(s) ||
    /\b(find|search|look for)\b.{0,40}\b(local resources?|training programs?|programs?|classes?|certification)\b/.test(s) ||
    /\b(jobs? near me|near me)\b/.test(s) ||
    /\b(remote work|remote jobs?|hybrid jobs?)\b/.test(s) ||
    /\bwhat companies are hiring\b/.test(s) ||
    /\bhelp me find\b.{0,30}\b(jobs?|work|training|programs?)\b/.test(s) ||
    /\bentry[- ]level\b.{0,20}\b(jobs?|positions?)\b/.test(s)
  )
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

export function shouldExecuteWebSearch(messages: SearchChatTurn[], lastUser: string): boolean {
  if (!isWebSearchConfirmed(lastUser)) return false
  const plan = resolveSearchPlan(messages)
  return plan !== null && plan.bullets.length >= 1
}

export function getSearchWorkflowPhase(messages: SearchChatTurn[], lastUser: string): SearchWorkflowPhase {
  if (shouldExecuteWebSearch(messages, lastUser)) return 'execute'

  const lastAssistant = lastAssistantMessage(messages)

  if (lastAssistant && advisorOfferedSearchPreview(lastAssistant)) {
    return 'clarifying'
  }

  if (threadHasSearchIntent(messages) || isSearchIntentRequest(lastUser)) return 'clarifying'

  return 'none'
}

export function evaluateSearchWorkflow(messages: SearchChatTurn[], lastUser: string): SearchWorkflowState {
  const previewText = findSearchPreviewMessage(messages)
  const plan = previewText ? extractSearchPlan(previewText) : null
  let phase = getSearchWorkflowPhase(messages, lastUser)

  if (
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
  ]

  if (isListingSearchPlan(plan)) {
    lines.push('', buildListingRecencyInstructions(referenceDate))
  }

  return lines.join('\n')
}

/** True when the user's message confirms a pending search preview (not resume generation). */
export function isSearchConfirmationTurn(messages: SearchChatTurn[], lastUser: string): boolean {
  if (!isWebSearchConfirmed(lastUser)) return false
  if (findMostRecentConfirmGate(messages) !== 'search') return false
  const preview = findActiveSearchPreviewMessage(messages)
  return preview !== '' && advisorOfferedSearchPreview(preview)
}

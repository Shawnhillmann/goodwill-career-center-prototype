import type { ChatMessage } from './advisorPrompt.js'
import { matchStarterPrompt } from './starterPrompts.js'

export type WebSearchTopic = 'jobs' | 'local_resources' | 'events' | 'general'

/** Live search request — only after explicit user confirmation. */
export type LiveSearchIntent = {
  kind: WebSearchTopic
  query: string
}

export type PendingWebSearchConfirmation = {
  topic: WebSearchTopic
  querySoFar: string
}

export type WebSearchAction =
  | { action: 'none' }
  | { action: 'search'; intent: LiveSearchIntent }

const TOPIC_QUERY_PREFIX: Record<WebSearchTopic, string> = {
  jobs: 'job openings',
  local_resources: 'Goodwill career center training workshops',
  events: 'job fairs career events',
  general: 'career resources',
}

const ROLE_HINT =
  /\b(retail|cashier|sales|warehouse|driver|manager|customer service|associate|nurse|rn|cna|admin|clerical|food service|hospitality|security|custodian|forklift|receptionist|barista|server|cook|maintenance|data entry|call center)\b/i

const CITY_STATE = /\b([A-Za-z][A-Za-z\s]{1,28}?),\s*([A-Z]{2})\b/
const ZIP = /\b(\d{5})(?:-\d{4})?\b/

/** Resume/cover-letter work — not a web search request. */
export function isDocumentOrCoachingTask(q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return false
  if (/\b(resume|résumé|cv|curriculum vitae|cover letter)\b/.test(s) && /\b(rewrite|revise|tailor|update|improve|edit|proofread|fix|draft|write|create|generate|format)\b/.test(s)) {
    return true
  }
  if (/\b(tailor(?:ed)?|rewrite|revise)\b/.test(s) && /\b(resume|cv|cover letter)\b/.test(s)) return true
  if (/\b(which one|best fit|better fit|good fit|fit best)\b/.test(s)) return true
  if (/\b(yes|yeah|sure|please)\b/.test(s) && /\b(resume|tailor|rewrite|revise)\b/.test(s)) return true
  if (/\b(interview prep|practice interview|thank.?you note)\b/.test(s)) return true
  return false
}

function isShortAffirmative(q: string): boolean {
  const lower = q.trim().toLowerCase()
  return /^(yes|yeah|yep|yup|sure|ok|okay|please|go ahead|do it)(\s+(please|now|online|the web))?[!.?]*$/i.test(lower)
}

/** User clearly wants live web results now (explicit command — not a vague job ask). */
export function isExplicitWebSearchCommand(q: string): boolean {
  if (isDocumentOrCoachingTask(q)) return false
  const lower = q.trim().toLowerCase()
  if (!lower) return false
  return (
    /\b(search online|search the web|use the web|look up live|live results|current postings online|find current postings)\b/i.test(lower) ||
    /^search(\s+now|\s+online|\s+please)?[!.?]*$/i.test(lower) ||
    (isShortAffirmative(lower) && /\b(online|web|live)\b/i.test(lower))
  )
}

/** Conversational yes — only valid when paired with a structured pending offer from the prior turn. */
export function isAffirmativeSearchReply(q: string): boolean {
  if (isDocumentOrCoachingTask(q)) return false
  const lower = q.trim().toLowerCase()
  if (!lower) return false
  return (
    isShortAffirmative(lower) ||
    /\b(yes|yeah|please|sure)\b.*\b(search|look\s*up|go ahead)\b/i.test(lower) ||
    /\b(search|look\s*up)\b.*\b(now|please|yes)\b/i.test(lower)
  )
}

function substantiveUserLines(messages: ChatMessage[]): string[] {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter((s) => s.length > 0 && !isShortAffirmative(s) && s !== 'Search online')
}

export function extractLocationFromText(text: string): string | null {
  const parts: string[] = []
  const cityState = text.match(CITY_STATE)
  if (cityState) parts.push(`${ cityState[1].trim() } ${ cityState[2] }`)
  const zip = text.match(ZIP)
  if (zip) parts.push(zip[1])
  return parts.length ? [...new Set(parts)].join(' ') : null
}

function extractWorkSetting(text: string): string | null {
  const lower = text.toLowerCase()
  if (/\bremote\b/.test(lower)) return 'remote'
  if (/\bhybrid\b/.test(lower)) return 'hybrid'
  if (/\b(in[\s-]?person|on[\s-]?site)\b/.test(lower)) return 'in-person'
  return null
}

function extractRoleHint(text: string): string | null {
  const match = text.match(ROLE_HINT)
  return match ? match[0].toLowerCase() : null
}

/** Short search-engine query from conversation entities — not full user messages. */
export function buildConciseSearchQuery(messages: ChatMessage[], topic: WebSearchTopic): string {
  const userText = substantiveUserLines(messages).join(' ')
  const location = extractLocationFromText(userText)
  const setting = extractWorkSetting(userText)
  const role = extractRoleHint(userText)

  const parts: string[] = [TOPIC_QUERY_PREFIX[topic]]
  if (role) parts.push(role)
  if (setting) parts.push(setting)
  if (location) parts.push(location)

  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 120) || TOPIC_QUERY_PREFIX[topic]
}

export function inferSearchTopicFromUserMessages(messages: ChatMessage[]): WebSearchTopic {
  const userText = substantiveUserLines(messages).join(' ').toLowerCase()
  if (/\b(job fair|career fair|hiring event|career expo|job expo|recruiting event)\b/.test(userText)) return 'events'
  if (/\b(local resource|goodwill|training|workshop|career center)\b/.test(userText)) return 'local_resources'
  if (/\b(job|jobs|hiring|opening|posting|position|role|work)\b/.test(userText)) return 'jobs'
  return 'general'
}

function userMessagesSuggestLiveSearchNeed(messages: ChatMessage[]): boolean {
  const lines = substantiveUserLines(messages)
  if (!lines.length) return false
  if (lines.some((line) => isDocumentOrCoachingTask(line))) return false
  const userText = lines.join(' ').toLowerCase()
  if (matchStarterPrompt(lines[0] ?? '')) {
    const kind = matchStarterPrompt(lines[0] ?? '')
    return kind === 'job' || kind === 'local'
  }
  return (
    /\b(job|jobs|hiring|opening|work|resources|job fair|career fair|training|workshop|goodwill)\b/.test(userText)
  )
}

function hasEnoughContextForSearch(messages: ChatMessage[], topic: WebSearchTopic): boolean {
  const userText = substantiveUserLines(messages).join(' ')
  const location = extractLocationFromText(userText)
  const setting = extractWorkSetting(userText)
  const role = extractRoleHint(userText)

  switch (topic) {
    case 'local_resources':
    case 'events':
      return Boolean(location)
    case 'jobs':
      return Boolean(location || setting || role)
    default:
      return userText.length > 8
  }
}

/** Bedrock fallback: conversation-state pending when enough context exists (no assistant phrase matching). */
export function inferPendingOfferFromConversation(
  messages: ChatMessage[],
  opts: { assistantAskedQuestion: boolean },
): PendingWebSearchConfirmation | null {
  if (!opts.assistantAskedQuestion) return null
  if (!userMessagesSuggestLiveSearchNeed(messages)) return null

  const topic = inferSearchTopicFromUserMessages(messages)
  if (!hasEnoughContextForSearch(messages, topic)) return null

  return {
    topic,
    querySoFar: buildConciseSearchQuery(messages, topic),
  }
}

export function resolveWebSearchAction(
  messages: ChatMessage[],
  lastUser: string,
  opts?: {
    confirmWebSearch?: boolean
    pendingWebSearchConfirmation?: PendingWebSearchConfirmation
  },
): WebSearchAction {
  if (matchStarterPrompt(lastUser)) return { action: 'none' }
  if (isDocumentOrCoachingTask(lastUser)) return { action: 'none' }

  const explicitCommand = isExplicitWebSearchCommand(lastUser)
  const pending = opts?.pendingWebSearchConfirmation
  const offeredAndConfirmed =
    Boolean(opts?.confirmWebSearch) || (isAffirmativeSearchReply(lastUser) && Boolean(pending))

  if (!explicitCommand && !offeredAndConfirmed) {
    return { action: 'none' }
  }

  const topic = pending?.topic ?? inferSearchTopicFromUserMessages(messages)
  const query = pending?.querySoFar?.trim() || buildConciseSearchQuery(messages, topic)

  return { action: 'search', intent: { kind: topic, query } }
}

export function isLiveSearchIntent(intent: LiveSearchIntent | null | undefined): intent is LiveSearchIntent {
  return Boolean(intent?.query?.trim())
}

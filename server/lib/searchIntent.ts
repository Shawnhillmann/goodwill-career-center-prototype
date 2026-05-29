import type { ChatMessage } from './advisorPrompt.js'
import { matchStarterPrompt } from './starterPrompts.js'

export type WebSearchTopic = 'jobs' | 'local_resources' | 'events' | 'general'

export type LiveSearchIntent = {
  kind: WebSearchTopic
  query: string
}

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

const SEARCH_RELEVANT =
  /\b(job|jobs|hiring|opening|posting|position|role|work|job fair|career fair|hiring event|local resource|goodwill|training|workshop|career center|companies hiring|who'?s hiring)\b/i

/** Resume/cover-letter work — not a web search request. */
export function isDocumentOrCoachingTask(q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return false
  if (/\b(resume|résumé|cv|curriculum vitae|cover letter)\b/.test(s) && /\b(rewrite|revise|tailor|update|improve|edit|proofread|fix|draft|write|create|generate|format)\b/.test(s)) {
    return true
  }
  if (/\b(tailor(?:ed)?|rewrite|revise)\b/.test(s) && /\b(resume|cv|cover letter)\b/.test(s)) return true
  if (/\b(which one|best fit|better fit|good fit|fit best)\b/.test(s)) return true
  if (/\b(interview prep|practice interview|thank.?you note)\b/.test(s)) return true
  return false
}

function isShortAffirmative(q: string): boolean {
  const lower = q.trim().toLowerCase()
  return /^(yes|yeah|yep|yup|sure|ok|okay|please|go ahead|do it|search)(\s+(please|now|online|the web))?[!.?]*$/i.test(lower)
}

/** User clearly wants live web results now. */
export function isExplicitWebSearchCommand(q: string): boolean {
  if (isDocumentOrCoachingTask(q)) return false
  const lower = q.trim().toLowerCase()
  if (!lower) return false
  return (
    /\b(search online|search the web|use the web|look up live|live results|current postings online|find current postings)\b/i.test(lower) ||
    lower === 'search online' ||
    /^search(\s+now|\s+online|\s+please)?[!.?]*$/i.test(lower) ||
    (isShortAffirmative(lower) && /\b(online|web|live)\b/i.test(lower))
  )
}

function substantiveUserLines(messages: ChatMessage[]): string[] {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter((s) => s.length > 0 && !isShortAffirmative(s) && s.toLowerCase() !== 'search online')
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

export function inferSearchTopic(messages: ChatMessage[]): WebSearchTopic {
  const userText = substantiveUserLines(messages).join(' ').toLowerCase()
  if (/\b(job fair|career fair|hiring event|career expo|job expo|recruiting event)\b/.test(userText)) return 'events'
  if (/\b(local resource|goodwill|training|workshop|career center)\b/.test(userText)) return 'local_resources'
  if (/\b(job|jobs|hiring|opening|posting|position|role|work)\b/.test(userText)) return 'jobs'
  return 'general'
}

/** Short search-engine query from conversation entities — not full user sentences. */
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

function conversationIsSearchRelevant(messages: ChatMessage[]): boolean {
  const lines = substantiveUserLines(messages)
  if (!lines.length) return false
  if (lines.some((line) => isDocumentOrCoachingTask(line))) return false

  const userText = lines.join(' ').toLowerCase()
  const starter = matchStarterPrompt(lines[0] ?? '')
  if (starter === 'job' || starter === 'local') return true

  return SEARCH_RELEVANT.test(userText)
}

/** Whether to show the Search online button (does not trigger search). */
export function shouldShowSearchOnline(messages: ChatMessage[]): {
  show: boolean
  topic: WebSearchTopic
} {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  if (isDocumentOrCoachingTask(lastUser)) return { show: false, topic: 'general' }
  if (!conversationIsSearchRelevant(messages)) return { show: false, topic: 'general' }
  return { show: true, topic: inferSearchTopic(messages) }
}

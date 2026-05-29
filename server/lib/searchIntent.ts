import type { ChatMessage } from './advisorPrompt.js'
import { requiresFreshData } from './hallucinationGuard.js'

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
  return /^(yes|yeah|yep|yup|sure|ok|okay|please|go ahead|do it)(\s+(please|now))?[!.?]*$/i.test(lower)
}

function substantiveUserLines(messages: ChatMessage[]): string[] {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter((s) => s.length > 0 && !isShortAffirmative(s))
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
  if (/\b(local resource|goodwill|training|workshop|career center|workforce program)\b/.test(userText)) return 'local_resources'
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

function isDocumentAnalysisQuestion(q: string): boolean {
  const s = q.trim().toLowerCase()
  if (
    /\b(rewrite|revise|tailor|update|improve|edit|proofread|draft|write|create)\b/.test(s) &&
    /\b(resume|cv|cover letter)\b/.test(s)
  ) {
    return true
  }
  return (
    /\b(what jobs fit|jobs fit me|fit my background|what strengths|what industries|salary range|improve (this|my) resume|review my resume|analyze my resume|transferable skills|target(ing)? recommendations)\b/.test(
      s,
    ) && !/\b(current|live|openings?|postings?|hiring now|near me|who'?s hiring)\b/.test(s)
  )
}

function isLocationOnlyFollowUp(q: string): boolean {
  const s = q.trim()
  if (/^\d{5}(-\d{4})?$/.test(s)) return true
  if (/^[A-Za-z\s.'-]+,\s*[A-Za-z]{2}\s*\d{0,5}(-\d{4})?$/i.test(s)) return true
  return false
}

/** Generic coaching — answer from conversation and documents, not the web. */
function isGeneralCareerCoaching(q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return false
  if (isLocationOnlyFollowUp(q)) return true

  const needsLiveSignal =
    /\b(current|live|right now|hiring now|today|tomorrow|this week|this month|next week|next month|upcoming|openings?|postings?|listings?|near me|who'?s hiring)\b/.test(
      s,
    )
  if (needsLiveSignal) return false

  if (
    /\b(help me find a job|find a job|what jobs fit|what careers?|what skills|how do i switch|prepare for an interview|interview prep|what should i put|resume tips|career options|career path|change careers|career change)\b/.test(
      s,
    )
  ) {
    return true
  }

  if (/\b(local resources|goodwill|training|workshop|career center)\b/.test(s)) {
    return !/\b(find|locate|show|list|programs near|locations near|where is|where are)\b/.test(s)
  }

  return false
}

/** User needs current external information that conversation/documents cannot provide. */
function threadNeedsCurrentExternalInfo(messages: ChatMessage[]): boolean {
  const userText = substantiveUserLines(messages).join(' ')
  const lower = userText.toLowerCase()
  const hasLocation = Boolean(extractLocationFromText(userText)) || /\bnear me\b/i.test(userText)
  const hasTimeFresh = requiresFreshData(userText)

  if (
    /\b(current|live|actual|real)\s+(job\s+)?(openings?|postings?|listings?)\b/i.test(lower) ||
    /\b(find|show|search for|look for)\s+.{0,40}\b(openings?|postings?|listings?)\b/i.test(lower) ||
    /\b(who'?s|who is)\s+hiring\b/i.test(lower)
  ) {
    return hasLocation || /\bhiring now|right now\b/i.test(lower)
  }

  if (/\b(job fair|career fair|hiring event|career expo|recruiting event)\b/i.test(lower)) {
    return hasTimeFresh || (/\b(find|show|what|any|list)\b/i.test(lower) && hasLocation)
  }

  if (
    /\b(find|locate|show|list|where)\s+.{0,50}\b(workforce|training program|career center|goodwill)\b/i.test(lower) ||
    /\bgoodwill\s+locations?\b/i.test(lower)
  ) {
    return hasLocation || /\bnear me\b/i.test(lower)
  }

  if (/\b(hours?|open|closed|phone number|still available|still running)\b/i.test(lower)) {
    return true
  }

  return false
}

/**
 * Rare automatic web search — only when current real-world information is required.
 * Default: conversation and uploaded documents only.
 */
export function shouldRunWebSearch(
  messages: ChatMessage[],
  hasUploadedDocument: boolean,
): { run: boolean; topic: WebSearchTopic } {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  if (!lastUser.trim()) return { run: false, topic: 'general' }
  if (isDocumentOrCoachingTask(lastUser)) return { run: false, topic: 'general' }
  if (hasUploadedDocument && isDocumentAnalysisQuestion(lastUser)) return { run: false, topic: 'general' }
  if (isGeneralCareerCoaching(lastUser) && !threadNeedsCurrentExternalInfo(messages)) {
    return { run: false, topic: 'general' }
  }
  if (threadNeedsCurrentExternalInfo(messages)) {
    return { run: true, topic: inferSearchTopic(messages) }
  }
  return { run: false, topic: 'general' }
}

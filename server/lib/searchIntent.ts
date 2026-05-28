import type { ChatMessage } from './advisorPrompt.js'

export type SearchIntent =
  | { kind: 'none' }
  | { kind: 'jobs'; query: string; needsClarification: boolean }
  | { kind: 'events'; query: string; needsClarification: boolean }
  | { kind: 'general'; query: string; needsClarification: boolean }

const US_STATE_ABBR = /\b(ct|ma|ny|ri|nh|vt|nj|pa|me|fl|ca|tx|ga|il|oh|mi|wa|or|co|az|nc|va|md|dc)\b/i

const ROLE_OR_INDUSTRY =
  /\b(retail|cashier|sales|bdr|sdr|warehouse|driver|manager|customer service|associate|entry[\s-]?level|marketing|nurse|rn|lpn|cna|admin|clerical|food service|hospitality|it|software|data|analyst|accountant|teacher|security|custodian|forklift|picker|packer|stocker|barista|server|cook|cleaner|maintenance|receptionist|call center|help desk)\b/i

const JOB_SIGNAL =
  /\b(job|jobs|role|roles|opening|openings|hiring|apply|position|positions|listings|career|careers|gig|gigs|work|opportunit(?:y|ies)|vacanc(?:y|ies))\b/i

const HIRING_PHRASE =
  /\b(who'?s|who is)\s+hiring\b|\bplaces?\s+(are\s+)?hiring\b|\bcompanies?\s+(are\s+)?hiring\b|\b(hiring|recruiting)\s+(near|around|in|now)\b|\bnow\s+hiring\b|\bhelp\s+wanted\b/i

const IMPLICIT_JOB_PHRASE =
  /\b(any|some)?\s*\w*\s*jobs?\b|\bjobs?\s+(near|around|in|at|for|within)\b|\b\w+\s+jobs?\b|\bavailable\s+roles?\b|\bentry[\s-]?level\s+work\b|\b\w+\s+roles?\s+(in|near|around|remote)\b|\bsales\s+jobs?\s+remote\b/i

const EVENT_SIGNAL =
  /\b(job fair|job fairs|career fair|career fairs|hiring event|hiring events|career expo|job expo|recruiting event|recruiting events|job festival|career event|career events)\b/i

const LOCAL_RESOURCE_SIGNAL =
  /\b(local resources|resources near me|community resources|career center|workshop|workshops|training event|training events)\b/i

const EXPLICIT_WEB =
  /\b(web\s*search|google|search\s+the\s+web|look\s+this\s+up|use the web)\b/i

const FIND_VERB = /\b(find|search|look\s*up|show\s*me|list|pull up|get me)\b/i

export function hasLocationHint(s: string): boolean {
  const lower = s.toLowerCase()
  return (
    /\b(in|near|around|within)\b\s+[a-z]/i.test(s) ||
    US_STATE_ABBR.test(s) ||
    /\b(remote|hybrid|on[\s-]?site|in[\s-]?person)\b/i.test(lower) ||
    /\b(near me|nearby|around me|local)\b/i.test(lower) ||
    /\b([a-z][a-z]+(?:\s+[a-z][a-z]+)?),\s*[a-z]{2}\b/i.test(s)
  )
}

export function hasRoleOrIndustryHint(s: string): boolean {
  return ROLE_OR_INDUSTRY.test(s) || IMPLICIT_JOB_PHRASE.test(s)
}

function isTrulyAmbiguousJobQuery(s: string): boolean {
  const trimmed = s.trim()
  const lower = trimmed.toLowerCase()
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (hasLocationHint(trimmed) || hasRoleOrIndustryHint(trimmed)) return false
  if (HIRING_PHRASE.test(lower)) return false
  if (wordCount <= 4 && /\b(job|work)\b/.test(lower)) return true
  return wordCount < 2
}

function isTrulyAmbiguousEventQuery(s: string): boolean {
  if (hasLocationHint(s)) return false
  if (US_STATE_ABBR.test(s)) return false
  return true
}

function hasJobSearchSignals(lower: string, original: string): boolean {
  if (JOB_SIGNAL.test(lower)) return true
  if (HIRING_PHRASE.test(lower)) return true
  if (IMPLICIT_JOB_PHRASE.test(lower)) return true
  if (/\b(listed positions?|open roles?)\b/.test(lower)) return true
  if (hasRoleOrIndustryHint(original) && /\b(job|jobs|role|roles|work|hiring|opening)\b/i.test(original)) return true
  return false
}

export function detectSearchIntent(q: string): SearchIntent {
  const s = q.trim()
  const lower = s.toLowerCase()
  if (!s) return { kind: 'none' }
  if (lower.includes('http://') || lower.includes('https://')) return { kind: 'none' }

  const explicitSearch = EXPLICIT_WEB.test(lower)
  const hasFindIntent = FIND_VERB.test(lower)
  const jobSignals = hasJobSearchSignals(lower, s)
  const eventSignals = EVENT_SIGNAL.test(lower) || LOCAL_RESOURCE_SIGNAL.test(lower)

  if (jobSignals || (hasFindIntent && /\b(hiring|work)\b/.test(lower))) {
    const needsClarification = isTrulyAmbiguousJobQuery(s)
    return { kind: 'jobs', query: s, needsClarification }
  }

  if (eventSignals) {
    const needsClarification = isTrulyAmbiguousEventQuery(s)
    return { kind: 'events', query: s, needsClarification }
  }

  if (explicitSearch) {
    const cleaned = s.replace(/\b(web\s*search|google|search\s+the\s+web|look\s+this\s+up|use the web)\b/gi, '').trim()
    const query = cleaned || s
    return { kind: 'general', query, needsClarification: query.length < 4 }
  }

  return { kind: 'none' }
}

export function isAffirmativeSearchReply(q: string): boolean {
  const lower = q.trim().toLowerCase()
  if (!lower) return false
  return (
    /^(yes|yeah|yep|sure|ok|okay|go ahead|please|do it)(\s+search)?[!.?]*$/i.test(lower) ||
    /^search(\s+now|\s+please)?[!.?]*$/i.test(lower) ||
    /\b(yes|yeah|please|sure)\b.*\b(search|look\s*up|go ahead)\b/i.test(lower) ||
    /\b(search|look\s*up)\b.*\b(now|please|yes)\b/i.test(lower)
  )
}

function assistantOfferedSearch(messages: ChatMessage[]): boolean {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''
  return /\b(search right now|want me to search|should i search|perform.*search|run.*search|send current)\b/i.test(
    lastAssistant,
  )
}

export function resolveEffectiveSearchIntent(messages: ChatMessage[], lastUser: string): SearchIntent {
  const direct = detectSearchIntent(lastUser)
  if (direct.kind !== 'none') return direct

  if (!isAffirmativeSearchReply(lastUser) || !assistantOfferedSearch(messages)) {
    return { kind: 'none' }
  }

  const priorUserQueries = messages.filter((m) => m.role === 'user').map((m) => m.content)
  for (let i = priorUserQueries.length - 2; i >= 0; i--) {
    const prior = priorUserQueries[i]?.trim() ?? ''
    if (!prior) continue
    const priorIntent = detectSearchIntent(prior)
    if (priorIntent.kind !== 'none') {
      return { ...priorIntent, needsClarification: false, query: priorIntent.query }
    }
  }

  const combined = priorUserQueries.slice(-3).join(' ').trim()
  if (combined && hasJobSearchSignals(combined.toLowerCase(), combined)) {
    return { kind: 'jobs', query: combined, needsClarification: isTrulyAmbiguousJobQuery(combined) }
  }

  return { kind: 'none' }
}

export function isLiveSearchIntent(intent: SearchIntent): intent is Exclude<SearchIntent, { kind: 'none' }> {
  return intent.kind === 'jobs' || intent.kind === 'events' || intent.kind === 'general'
}

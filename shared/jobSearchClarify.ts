export type ClarifyChatTurn = { role: 'user' | 'assistant'; content: string }

export type JobSearchDetailKey =
  | 'role'
  | 'location'
  | 'workMode'
  | 'employmentType'
  | 'experience'
  | 'distance'
  | 'pay'

export const JOB_SEARCH_DETAIL_LABELS: Record<JobSearchDetailKey, string> = {
  role: 'type of role or job title',
  location: 'city or area to search',
  workMode: 'in-person, remote, or hybrid',
  employmentType: 'full-time or part-time',
  experience: 'experience level (entry, mid, senior, etc.)',
  distance: 'how far you are willing to commute (miles, or remote-only)',
  pay: 'target pay (hourly or salary range, or flexible on pay)',
}

function conversationCorpus(messages: ClarifyChatTurn[]): string {
  return messages.map((m) => m.content).join('\n').toLowerCase()
}

/** User explicitly asked to find or search for jobs (not general career coaching). */
export function isJobSearchIntentRequest(text: string): boolean {
  const s = text.toLowerCase()
  if (/\bhttps?:\/\//.test(text)) return false
  return (
    /\b(find|search|look for|help me find|looking for)\b.{0,40}\b(jobs?|openings?|listings?|positions?)\b/.test(
      s,
    ) ||
    /\b(find|search|look for)\b.{0,40}\b(accounting|retail|warehouse|nurse|driver|admin|clerk)\b.{0,20}\b(jobs?|work|positions?)\b/.test(
      s,
    ) ||
    /\b(jobs? near me|near me)\b/.test(s) ||
    /\b(remote jobs?|hybrid jobs?|entry[- ]level jobs?)\b/.test(s) ||
    /\bwhat companies are hiring\b/.test(s)
  )
}

export function threadHasJobSearchIntent(messages: ClarifyChatTurn[]): boolean {
  return messages.some((m) => m.role === 'user' && isJobSearchIntentRequest(m.content))
}

export function hasJobSearchRole(corpus: string): boolean {
  return (
    /\b(find|search|look for|looking for)\b.{0,40}\b(jobs?|work|positions?|roles?)\b/.test(corpus) ||
    /\b(accountant|accounting|bookkeeper|retail|warehouse|nurse|teacher|driver|admin|clerk|specialist|manager|engineer|developer)\b/.test(
      corpus,
    ) ||
    /\b(type of (work|role)|job title|role type)\b/.test(corpus)
  )
}

export function hasJobSearchLocation(corpus: string): boolean {
  return (
    /\b(in|near|around|within)\s+[a-z][a-z\s,]{2,40}(?:,\s*[a-z]{2})?\b/.test(corpus) ||
    /\b(hartford|middletown|new haven|bridgeport|stamford|waterbury|boston|nyc|new york)\b/.test(corpus) ||
    /\b(jobs? near me|near me)\b/.test(corpus)
  )
}

export function hasJobSearchWorkMode(corpus: string): boolean {
  return /\b(in[- ]person|on[- ]site|remote|hybrid|work from home|wfh)\b/.test(corpus)
}

export function hasJobSearchEmploymentType(corpus: string): boolean {
  return /\b(full[- ]time|part[- ]time|full time|part time|either|both)\b/.test(corpus)
}

export function hasJobSearchExperience(corpus: string): boolean {
  return (
    /\b(entry[- ]level|mid[- ]level|senior|junior|experienced|no experience|\d+\+?\s*years?)\b/.test(corpus) ||
    /\b(flexible|no preference|any level).{0,30}(experience|level)\b/.test(corpus)
  )
}

export function hasJobSearchDistancePreference(corpus: string): boolean {
  if (/\b(remote|work from home|wfh)\b/.test(corpus) && hasJobSearchWorkMode(corpus)) return true
  if (/\b(\d+\s*(mile|mi|miles|km|kilometer)s?|within \d+\s*(mile|mi|miles|km)?)\b/.test(corpus)) return true
  if (
    /\b(commute|radius|travel distance|how far)\b/.test(corpus) &&
    /\b(\d+|near|local|flexible|no preference)\b/.test(corpus)
  ) {
    return true
  }
  return /\b(flexible|no preference|any distance|open to any commute).{0,40}(commute|distance|mile|travel)\b/.test(
    corpus,
  )
}

export function hasJobSearchPayPreference(corpus: string): boolean {
  if (
    /\b(\$\s?\d|\d+\s*(?:\/\s?hr|\/hour|per hour|an hour)|hourly|salary|pay rate|wage|compensation)\b/.test(
      corpus,
    )
  ) {
    return true
  }
  if (/\b(\d+\s*[-–]\s*\d+\s*(?:\/\s?hr|\/hour|per hour|k|yr|year))\b/.test(corpus)) return true
  return /\b(flexible|no preference|any pay|open on pay|don't care about pay|pay is flexible)\b/.test(corpus)
}

const DETAIL_CHECKS: Array<{ key: JobSearchDetailKey; has: (corpus: string) => boolean }> = [
  { key: 'role', has: hasJobSearchRole },
  { key: 'location', has: hasJobSearchLocation },
  { key: 'workMode', has: hasJobSearchWorkMode },
  { key: 'employmentType', has: hasJobSearchEmploymentType },
  { key: 'experience', has: hasJobSearchExperience },
  { key: 'distance', has: hasJobSearchDistancePreference },
  { key: 'pay', has: hasJobSearchPayPreference },
]

export type JobSearchDetailStatus = {
  have: string[]
  stillNeed: string[]
}

export function getJobSearchDetailStatus(messages: ClarifyChatTurn[]): JobSearchDetailStatus {
  if (!threadHasJobSearchIntent(messages)) {
    return { have: [], stillNeed: [] }
  }

  const corpus = conversationCorpus(messages)
  const have: string[] = []
  const stillNeed: string[] = []

  for (const { key, has } of DETAIL_CHECKS) {
    const label = JOB_SEARCH_DETAIL_LABELS[key]
    if (has(corpus)) have.push(label)
    else stillNeed.push(label)
  }

  return { have, stillNeed }
}

/** @deprecated Use getJobSearchDetailStatus().stillNeed */
export function getMissingJobSearchDetails(messages: ClarifyChatTurn[]): string[] {
  return getJobSearchDetailStatus(messages).stillNeed
}

function joinNaturalList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${ items[0] } and ${ items[1] }`
  return `${ items.slice(0, -1).join(', ') }, and ${ items[items.length - 1] }`
}

export function formatJobSearchClarifyBlock(status: JobSearchDetailStatus): string {
  if (!status.stillNeed.length) return ''

  const exampleWeave = joinNaturalList(status.stillNeed)

  return [
    'ACTIVE JOB SEARCH (user asked to find/search jobs — prep before preview):',
    '- Acknowledge what they already shared in one warm sentence (no "What I have so far" header).',
    `- In the same reply, naturally mention every remaining detail you still need before searching — e.g. "Before I search, I still need to know your ${ exampleWeave }."`,
    '- Keep it conversational: short paragraphs, not a form. Avoid numbered lists and section headers.',
    '- Do NOT say "one quick detail" or ask only one item while holding others back.',
    '- Invite them to answer any or all remaining items in one message.',
    `- Remaining before preview: ${ joinNaturalList(status.stillNeed) }.`,
  ].join('\n')
}

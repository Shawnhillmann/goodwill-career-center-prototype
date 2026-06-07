import {
  assessSearchConfidence,
  classifyUserRequest,
  formatAmbiguousEntityClarifyPrompt,
  isCoachingRequest,
  isLiveLookupRequest,
  isSearchIntentRequest,
  shouldClarifyBeforeSearchPlan,
  shouldOfferSearchPlanImmediately,
  type SearchConfidence,
  type SearchRequestAssessment,
  type SearchRequestClassification,
} from './searchClassification.js'

export type SearchCategory =
  | 'jobs'
  | 'people'
  | 'places'
  | 'wages'
  | 'training'
  | 'organizations'
  | 'legal'
  | 'general'

export type SearchPlan = {
  action: 'search_confirmation_required'
  search_query: string
  user_facing_confirmation: string
  search_category: SearchCategory
  search_confidence: SearchConfidence
  missing_required_info: string[]
  /** Execution criteria derived from the approved search. */
  bullets: string[]
  rawPreview?: string
}

export {
  assessSearchConfidence,
  classifyUserRequest,
  formatAmbiguousEntityClarifyPrompt,
  isCoachingRequest,
  isLiveLookupRequest,
  isSearchIntentRequest,
  shouldClarifyBeforeSearchPlan,
  shouldOfferSearchPlanImmediately,
  type SearchConfidence,
  type SearchRequestAssessment,
  type SearchRequestClassification,
}

const SEARCH_PLAN_BLOCK_RE = /<!--SEARCH_PLAN:([\s\S]*?)-->/g
const SEARCH_PLAN_BLOCK_TEST = /<!--SEARCH_PLAN:[\s\S]*?-->/

const SEARCH_CATEGORIES: SearchCategory[] = [
  'jobs',
  'people',
  'places',
  'wages',
  'training',
  'organizations',
  'legal',
  'general',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeCategory(raw: unknown): SearchCategory {
  if (typeof raw === 'string' && (SEARCH_CATEGORIES as string[]).includes(raw)) {
    return raw as SearchCategory
  }
  return 'general'
}

function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function normalizeConfidence(raw: unknown, searchQuery: string): SearchConfidence {
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw
  return assessSearchConfidence(searchQuery)
}

/** Infer search category from query text when not supplied. */
export function inferSearchCategory(text: string): SearchCategory {
  const s = text.toLowerCase()
  if (/\b(jobs?|openings?|listings?|positions?|hiring|job fairs?|career fairs?)\b/.test(s)) {
    return 'jobs'
  }
  if (/\b(minimum wage|living wage|hourly rate|salary|pay rate|compensation)\b/.test(s)) {
    return 'wages'
  }
  if (/\b(osha|unemployment|benefits|regulations?|compliance|requirements?|laws?)\b/.test(s)) {
    return 'legal'
  }
  if (/\b(training|certification|courses?|classes?|programs?)\b/.test(s)) {
    return 'training'
  }
  if (/\b(who is|person|people|staff|director|ceo|president|recruiter)\b/.test(s)) {
    return 'people'
  }
  if (/\b(goodwill|company|companies|employer|organization|nonprofit|agency)\b/.test(s)) {
    return 'organizations'
  }
  if (/\b(near me|nearby|city|town|zip|location|address|centers?)\b/.test(s)) {
    return 'places'
  }
  return 'general'
}

export function buildSearchPlanBullets(plan: Pick<SearchPlan, 'search_query' | 'missing_required_info'>): string[] {
  const bullets = [plan.search_query.trim()]
  for (const item of plan.missing_required_info) {
    const trimmed = item.trim()
    if (trimmed && !bullets.includes(trimmed)) bullets.push(trimmed)
  }
  return bullets.filter(Boolean)
}

/** Normalize raw JSON or legacy shapes into a SearchPlan. */
export function normalizeSearchPlan(raw: unknown, rawPreview = ''): SearchPlan | undefined {
  if (!isRecord(raw)) return undefined

  const structuredQuery = typeof raw.search_query === 'string' ? raw.search_query.trim() : ''
  const legacyBullets = normalizeStringList(raw.bullets)
  const search_query = structuredQuery || legacyBullets.join('; ')
  if (!search_query) return undefined

  const user_facing_confirmation =
    typeof raw.user_facing_confirmation === 'string' && raw.user_facing_confirmation.trim()
      ? raw.user_facing_confirmation.trim()
      : search_query

  const missing_required_info = normalizeStringList(raw.missing_required_info)
  const search_category = raw.search_category ? normalizeCategory(raw.search_category) : inferSearchCategory(search_query)
  const search_confidence = normalizeConfidence(raw.search_confidence, search_query)
  const bullets = legacyBullets.length ? legacyBullets : buildSearchPlanBullets({ search_query, missing_required_info })

  return {
    action: 'search_confirmation_required',
    search_query,
    user_facing_confirmation,
    search_category,
    search_confidence,
    missing_required_info,
    bullets,
    rawPreview: typeof raw.rawPreview === 'string' ? raw.rawPreview : rawPreview,
  }
}

export function extractStructuredSearchPlanBlock(text: string): SearchPlan | null {
  const match = text.match(/<!--SEARCH_PLAN:([\s\S]*?)-->/)
  if (!match?.[1]) return null
  try {
    const parsed = JSON.parse(match[1]) as unknown
    return normalizeSearchPlan(parsed, text) ?? null
  } catch {
    return null
  }
}

export function stripSearchPlanBlock(text: string): string {
  return text.replace(SEARCH_PLAN_BLOCK_RE, '').trim()
}

export function assistantMessageHasSearchPlanBlock(text: string): boolean {
  return SEARCH_PLAN_BLOCK_TEST.test(text)
}

export function formatSearchPlanBlock(plan: SearchPlan): string {
  const payload = {
    action: plan.action,
    search_query: plan.search_query,
    user_facing_confirmation: plan.user_facing_confirmation,
    search_category: plan.search_category,
    search_confidence: plan.search_confidence,
    missing_required_info: plan.missing_required_info,
    bullets: plan.bullets,
  }
  return `<!--SEARCH_PLAN:${ JSON.stringify(payload) }-->`
}

export function planCriteriaSummary(plan: SearchPlan): string {
  if (plan.bullets.length) return plan.bullets.map((b) => `• ${ b }`).join('\n')
  return `• ${ plan.search_query }`
}

export function isJobCategoryPlan(plan: SearchPlan): boolean {
  return plan.search_category === 'jobs'
}

export function planCorpus(plan: SearchPlan): string {
  return [plan.search_query, plan.user_facing_confirmation, ...plan.bullets].join('\n').toLowerCase()
}

const VAGUE_JOB_ONLY_RE =
  /^(?:find|search for|look for|look up|help me find)?\s*(?:me\s+)?jobs?\??$|^(?:find|search for)\s+(?:me\s+)?jobs?\??$|^jobs?\s+near me$|^jobs?\??$/

const SPECIFIC_JOB_ROLE_RE =
  /\b(accountant|accounting|bookkeeper|retail|warehouse|nurse|teacher|driver|admin|clerk|cashier|specialist|manager|engineer|developer|healthcare|hospitality|food service|customer service|manufacturing|forklift|laborer|custodian|security guard|receptionist|billing|payroll)\b/

const JOB_LOCATION_OR_WORK_MODE_RE =
  /\b(in|near|around|within)\s+[a-z][a-z\s,.'-]{2,40}(?:,\s*[a-z]{2})?\b|\b(within|under)\s+\d+\s*(mile|mi|miles)\b|\b(hartford|middletown|new haven|bridgeport|stamford|waterbury|boston|nyc|new york)\b|\b\d{5}\b|\b(in[- ]person|on[- ]site|remote|hybrid|work from home|wfh)\b/

const JOB_EVENT_OR_FAIR_RE = /\b(hiring events?|job fairs?|career fairs?|public hiring)\b/

const CLARIFICATION_LANGUAGE_RE =
  /\b(waiting for|tell me|before i search|need to know|still need|reply with those details|once you share|when you share|what city or zip|which city or zip|location and job preferences)\b/i

/** Job searches need a specific role/type plus location, ZIP, or work mode — not bare "jobs". */
export function hasJobSearchMinimumForExecution(plan: SearchPlan): boolean {
  const corpus = planCorpus(plan)
  if (VAGUE_JOB_ONLY_RE.test(corpus.trim())) return false

  const hasSpecificRole =
    SPECIFIC_JOB_ROLE_RE.test(corpus) ||
    JOB_EVENT_OR_FAIR_RE.test(corpus) ||
    /\bwhat companies are hiring\b/.test(corpus) ||
    /\b(amazon|walmart|target|costco|ups|fedex)\b.{0,30}\b(jobs?|warehouse|delivery|work)\b/.test(corpus) ||
    /\b(part[- ]time|full[- ]time|entry[- ]level)\b.{0,40}\b(jobs?|work|positions?)\b/.test(corpus) ||
    /\b(jobs?|work|positions?|openings?)\b.{0,40}\b(warehouse|retail|cashier|accounting|nurse|driver|admin|healthcare|hospitality)\b/.test(
      corpus,
    )

  const hasLocationOrWorkMode =
    JOB_LOCATION_OR_WORK_MODE_RE.test(corpus) ||
    (/\bnear me\b/.test(corpus) &&
      (SPECIFIC_JOB_ROLE_RE.test(corpus) ||
        /\b(amazon|walmart|target|warehouse|retail|cashier|accounting|nurse|driver)\b/.test(corpus) ||
        /\b(jobs?|work|positions?)\b.{0,40}\b(warehouse|retail|cashier|accounting|nurse|driver|admin|healthcare|hospitality)\b/.test(
          corpus,
        )))

  return hasSpecificRole && hasLocationOrWorkMode
}

/** User job-search wording too vague to offer Confirm search yet. */
export function isVagueJobSearchRequest(text: string): boolean {
  const s = text.toLowerCase().trim()
  if (!/\b(jobs?|openings?|positions?|hiring|work|help me find)\b/.test(s)) return false

  return !hasJobSearchMinimumForExecution({
    action: 'search_confirmation_required',
    search_query: text,
    user_facing_confirmation: text,
    search_category: 'jobs',
    search_confidence: 'medium',
    missing_required_info: [],
    bullets: [text],
  })
}

/** True only when a plan is complete enough to show Confirm search and execute on approval. */
export function isExecutableSearchPlan(plan: SearchPlan): boolean {
  if (plan.search_confidence === 'low') return false
  if (plan.missing_required_info.length > 0) return false
  if (!plan.search_query.trim()) return false

  const corpus = planCorpus(plan)
  if (CLARIFICATION_LANGUAGE_RE.test(plan.user_facing_confirmation)) return false
  if (CLARIFICATION_LANGUAGE_RE.test(corpus)) return false

  if (plan.search_category === 'jobs' || isJobCategoryPlan(plan)) {
    return hasJobSearchMinimumForExecution(plan)
  }

  return plan.search_confidence === 'high' || plan.search_confidence === 'medium'
}

/** UI/server gate for showing or honoring Confirm search. */
export function isPendingSearchConfirmVisible(state: {
  pendingAction: string | null
  pendingSearchPlan?: SearchPlan
}): boolean {
  return (
    state.pendingAction === 'search' &&
    Boolean(state.pendingSearchPlan && isExecutableSearchPlan(state.pendingSearchPlan))
  )
}

import { isVagueJobSearchRequest } from './searchPlan.js'

export type SearchConfidence = 'high' | 'medium' | 'low'

export type SearchRequestClassification =
  | 'coaching'
  | 'search_confirmation'
  | 'clarification_required'

export type SearchRequestAssessment = {
  classification: SearchRequestClassification
  /** Null when classification is coaching. */
  confidence: SearchConfidence | null
  /** Short labels explaining the decision (useful for logs and tests). */
  reasons: string[]
  /** Set when the query is dominated by an ambiguous entity. */
  ambiguousEntity?: string
}

const US_STATE_RE =
  /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/i

const US_STATE_ABBR_RE = /\b(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\b/i

const CITY_OR_PLACE_RE =
  /\b(in|near|around|within)\s+[a-z][a-z\s,.'-]{2,40}(?:,\s*[a-z]{2})?\b|\b(hartford|middletown|new haven|bridgeport|stamford|waterbury|boston|nyc|new york|near me|nearby)\b/i

const CURRENT_OR_TIME_RE =
  /\b(current|latest|today|now|recent|updated|this year|right now|as of|currently)\b/i

const SEARCH_VERB_RE = /\b(search|find|look up|look for|browse for|browse)\b/i

const EXPLICIT_WEB_SEARCH_RE =
  /\b(search the web|search online|web search|look (it |that |this )?up online)\b/i

/** Evergreen career/education concepts — explain directly, do not search. */
const EDUCATIONAL_CONCEPT_RE =
  /\b(a resume|an resume|resume\b|cover letter|networking|customer service|transferable skills?|behavioral interview|informational interview|career path|career change|elevator pitch|professional summary|soft skills?|hard skills?|job description|reference list|thank you note|salary negotiation tips?|work ethic|time management skills?)\b/i

/** General-knowledge "what is X" where X is a concept, not a live lookup target. */
const GENERAL_KNOWLEDGE_TOPIC_RE =
  /\b(osha\b(?!\s*(training|class|course|certification|10|30|provider|near|in ))|unemployment insurance system|what unemployment is|what benefits are)\b/i

const AMBIGUOUS_ORG_RE = /^(goodwill|amazon|walmart|target|microsoft|google|apple)$/i

const AMBIGUOUS_GENERIC_RE = /^(resources?|programs?|services?|jobs?|work|help)$/i

const PERSON_NAME_RE = /^[a-z]+(?:\s+[a-z]+){1,2}$/i

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[?!.]+$/, '')
}

function hasLocationSignal(text: string): boolean {
  return CITY_OR_PLACE_RE.test(text) || US_STATE_RE.test(text) || US_STATE_ABBR_RE.test(text) || /\bnear me\b/i.test(text)
}

function hasCurrentSignal(text: string): boolean {
  return CURRENT_OR_TIME_RE.test(text)
}

function hasSearchVerb(text: string): boolean {
  return SEARCH_VERB_RE.test(text) && !/\bfind a way\b/i.test(text)
}

function isEducationalQuestion(text: string): boolean {
  const s = normalize(text)
  const asksConcept =
    /^(what is|what are|what's|what does|how do|how does|how can|explain|tell me about|define)\b/.test(s)
  if (!asksConcept) return false

  if (EDUCATIONAL_CONCEPT_RE.test(s)) return true

  if (/^what is (a |an |the )?(resume|cover letter|networking|customer service)\b/.test(s)) return true
  if (/^what are (transferable skills|soft skills|hard skills)\b/.test(s)) return true
  if (/^how do cover letters work\b/.test(s)) return true
  if (/^how do interviews work\b/.test(s)) return true

  // "What is OSHA?" without local/current/training context = general knowledge
  if (/^what is osha\b/.test(s) && !hasLocationSignal(text) && !/\b(training|class|course|certification|10|30|provider)\b/i.test(s)) {
    return true
  }

  if (GENERAL_KNOWLEDGE_TOPIC_RE.test(s) && !hasCurrentSignal(text) && !hasLocationSignal(text)) {
    return true
  }

  return false
}

function detectAmbiguousEntity(text: string): string | undefined {
  const s = normalize(text)
  const tokens = s.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return undefined

  if (tokens.length === 1) {
    if (AMBIGUOUS_ORG_RE.test(s)) return s
    if (AMBIGUOUS_GENERIC_RE.test(s)) return s
  }

  if (tokens.length <= 3 && PERSON_NAME_RE.test(s) && !/\b(goodwill|amazon|microsoft|google|apple|at |ceo|director|manager|company|organization)\b/i.test(s)) {
    return s
  }

  return undefined
}

function scoreSearchConfidence(text: string, reasons: string[]): SearchConfidence {
  const s = normalize(text)
  let score = 0

  if (hasSearchVerb(text) || EXPLICIT_WEB_SEARCH_RE.test(s)) {
    score += 2
    reasons.push('explicit_search_verbs')
  }
  if (hasCurrentSignal(text)) {
    score += 2
    reasons.push('current_or_time_sensitive')
  }
  if (hasLocationSignal(text)) {
    score += 2
    reasons.push('location_signal')
  }

  if (/\b(minimum wage|min wage|unemployment benefits?|living wage)\b/i.test(s) && (hasLocationSignal(text) || hasCurrentSignal(text) || US_STATE_ABBR_RE.test(s))) {
    score += 3
    reasons.push('jurisdiction_specific_wage_or_benefits')
  }

  if (/\b(jobs?|openings?|hiring|positions?|listings?)\b/i.test(s) && (hasLocationSignal(text) || /\b(near me|amazon|warehouse|retail|cashier|nurse|driver)\b/i.test(s))) {
    score += 2
    reasons.push('job_search_with_context')
  }

  if (/\b(training|classes?|courses?|certification|schools?)\b/i.test(s) && hasLocationSignal(text)) {
    score += 3
    reasons.push('local_training_or_program_search')
  }

  if (/\b(housing assistance|food assistance|workforce center|career center|job fair)\b/i.test(s) && hasLocationSignal(text)) {
    score += 3
    reasons.push('local_resource_program')
  }

  if (/\bwho (runs|leads|is|owns|directs|manages)\b/i.test(s) && /\b(goodwill|company|organization)\b/i.test(s) && hasLocationSignal(text)) {
    score += 3
    reasons.push('leadership_lookup_with_location')
  }

  if (/\bwhat companies are hiring\b/i.test(s) && hasLocationSignal(text)) {
    score += 3
    reasons.push('hiring_lookup_with_location')
  }

  if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/.test(text) && /\b(goodwill|at |ceo|director)\b/i.test(text)) {
    score += 1
    reasons.push('person_with_org_context')
  }

  if (/\b(microsoft|amazon|google)\b/i.test(s) && /\b(ceo|president|executive|leadership)\b/i.test(s) && !hasLocationSignal(text)) {
    score += 1
    reasons.push('public_figure_or_leadership')
  }

  if (/\b(connecticut|ct)\b/i.test(s) && /\b(housing|benefits|programs?|resources?)\b/i.test(s) && !hasSearchVerb(text)) {
    score += 1
    reasons.push('state_program_topic')
  }

  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

/**
 * General coaching — answer normally, do not enter search confirmation.
 * Priority: evaluated before live lookup.
 */
export function isCoachingRequest(text: string): boolean {
  return classifyUserRequest(text).classification === 'coaching'
}

/**
 * @deprecated Prefer classifyUserRequest().classification !== 'coaching'
 */
export function isLiveLookupRequest(text: string): boolean {
  const result = classifyUserRequest(text)
  return result.classification === 'search_confirmation' || result.classification === 'clarification_required'
}

/** @deprecated Alias for isLiveLookupRequest */
export function isSearchIntentRequest(text: string): boolean {
  return isLiveLookupRequest(text)
}

/**
 * Classify a user message for search workflow routing.
 *
 * Decision tree (first match wins):
 * 1. Empty or URL-only → coaching
 * 2. Coaching / educational patterns → coaching
 * 3. Ambiguous entity-only queries → clarification_required (low confidence)
 * 4. Live lookup signals → search_confirmation (confidence scored)
 * 5. Default → coaching
 */
export function classifyUserRequest(text: string): SearchRequestAssessment {
  const reasons: string[] = []
  const s = normalize(text)

  if (!s) {
    return { classification: 'coaching', confidence: null, reasons: ['empty_message'] }
  }
  if (/\bhttps?:\/\//.test(text)) {
    return { classification: 'coaching', confidence: null, reasons: ['url_handled_separately'] }
  }

  // 2. Coaching / educational (explicit how-to and concept questions)
  if (
    /\b(how do i|how can i|how should i|tips for|help me (write|improve|practice|prepare|word))\b/i.test(s)
  ) {
    return { classification: 'coaching', confidence: null, reasons: ['coaching_how_to'] }
  }
  if (/\b(find (the right |better )?words|find a way to say)\b/i.test(s)) {
    return { classification: 'coaching', confidence: null, reasons: ['coaching_wording_help'] }
  }
  if (/\b(interview prep|practice interview|prepare for an interview|interview tips?)\b/i.test(s)) {
    return { classification: 'coaching', confidence: null, reasons: ['coaching_interview_prep'] }
  }
  if (/\bhow (do|can|should) i\b.{0,80}\b(prepare|practice|write|improve|build|create|word|say)\b/i.test(s)) {
    return { classification: 'coaching', confidence: null, reasons: ['coaching_skill_building'] }
  }
  if (/\b(exploring careers|career exploration|what careers might fit)\b/i.test(s)) {
    return { classification: 'coaching', confidence: null, reasons: ['coaching_career_exploration'] }
  }
  if (isEducationalQuestion(text)) {
    return { classification: 'coaching', confidence: null, reasons: ['educational_concept_question'] }
  }

  if (isVagueJobSearchRequest(text)) {
    return {
      classification: 'clarification_required',
      confidence: 'low',
      reasons: ['vague_job_search'],
    }
  }

  // 3. Ambiguous entity-only
  const ambiguousEntity = detectAmbiguousEntity(text)
  if (ambiguousEntity && !hasSearchVerb(text) && !hasCurrentSignal(text) && !hasLocationSignal(text)) {
    return {
      classification: 'clarification_required',
      confidence: 'low',
      reasons: ['ambiguous_entity_only'],
      ambiguousEntity,
    }
  }

  // 4. Live lookup signals
  if (EXPLICIT_WEB_SEARCH_RE.test(s)) {
    const confidence = scoreSearchConfidence(text, reasons)
    reasons.unshift('explicit_web_search_request')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  if (hasSearchVerb(text)) {
    const needsLocation =
      /\b(local resources?|housing assistance|food assistance|workforce programs?|training programs?|services?|programs?)\b/i.test(s) &&
      !hasLocationSignal(text) &&
      !/\bnear me\b/i.test(s)
    if (needsLocation) {
      reasons.push('resource_or_program_search_missing_location')
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }

    const confidence = scoreSearchConfidence(text, reasons)
    reasons.unshift('search_verbs')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  if (/\b(ceo|president|chief executive|executive leadership)\b/i.test(s) && /\b(microsoft|amazon|google|apple|meta|goodwill)\b/i.test(s)) {
    reasons.push('executive_leadership_lookup')
    return { classification: 'search_confirmation', confidence: 'medium', reasons }
  }

  if (/\b(goodwill|company|organization)\b/i.test(s) && PERSON_NAME_RE.test(s.replace(/\b(at|with|from)\b/g, ' ').trim())) {
    reasons.push('person_with_organization_context')
    return { classification: 'search_confirmation', confidence: 'medium', reasons }
  }

  if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/.test(text) && /\b(goodwill|at |for )\b/i.test(text)) {
    reasons.push('named_person_with_org_context')
    return { classification: 'search_confirmation', confidence: 'medium', reasons }
  }

  if (/\bwhat('s| is) (the )?(current )?(minimum wage|unemployment rate|min wage)\b/i.test(s)) {
    reasons.push('current_wage_or_benefits_question')
    return {
      classification: 'search_confirmation',
      confidence: scoreSearchConfidence(text, reasons),
      reasons,
    }
  }

  if (/\b(minimum wage|min wage|living wage)\b/i.test(s) && (hasLocationSignal(text) || US_STATE_ABBR_RE.test(s) || /\bconnecticut\b/i.test(s))) {
    reasons.push('jurisdiction_wage_topic')
    return {
      classification: 'search_confirmation',
      confidence: scoreSearchConfidence(text, reasons),
      reasons,
    }
  }

  if (/\b(current|latest)\b/i.test(s) && /\b(unemployment benefits?|minimum wage|hiring|openings?)\b/i.test(s) && (hasLocationSignal(text) || US_STATE_ABBR_RE.test(s))) {
    reasons.push('current_local_policy_or_labor_market')
    return {
      classification: 'search_confirmation',
      confidence: scoreSearchConfidence(text, reasons),
      reasons,
    }
  }

  if (/\bwho (runs|leads|is|owns|directs|manages)\b/i.test(s)) {
    const confidence = scoreSearchConfidence(text, reasons)
    reasons.push('leadership_or_person_lookup')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  if (/\b(osha|unemployment)\b/i.test(s) && (/\b(training|class|course|certification|benefits?|requirements?)\b/i.test(s) || hasLocationSignal(text))) {
    reasons.push('compliance_or_benefits_with_context')
    return {
      classification: 'search_confirmation',
      confidence: scoreSearchConfidence(text, reasons),
      reasons,
    }
  }

  if (/\b(jobs?|openings?|hiring|positions?|listings?|job fairs?|career fairs?)\b/i.test(s)) {
    const confidence = scoreSearchConfidence(text, reasons)
    reasons.push('job_or_hiring_topic')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  if (/\bwhat companies are hiring\b/i.test(s)) {
    const confidence = scoreSearchConfidence(text, reasons)
    reasons.push('companies_hiring_question')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  if (/\b(compan(?:y|ies)|employers?|organizations?|goodwill)\b/i.test(s) && (hasLocationSignal(text) || /\b(hiring|locations?|centers?|programs?|training)\b/i.test(s))) {
    const confidence = scoreSearchConfidence(text, reasons)
    reasons.push('organization_with_local_or_program_intent')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  if (/\b(training programs?|certification|classes?|courses?|housing assistance|workforce programs?|local resources?)\b/i.test(s) && hasLocationSignal(text)) {
    reasons.push('local_program_or_resource_search')
    return {
      classification: 'search_confirmation',
      confidence: scoreSearchConfidence(text, reasons),
      reasons,
    }
  }

  if (/\bhelp me find\b/i.test(s) && !/\bwords\b/i.test(s)) {
    const confidence = scoreSearchConfidence(text, reasons)
    reasons.push('help_me_find')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  if (/\bnear me\b/i.test(s) && /\b(jobs?|resources?|programs?|training|centers?)\b/i.test(s)) {
    const confidence = scoreSearchConfidence(text, reasons)
    reasons.push('near_me_resource_or_job')
    if (confidence === 'low') {
      return { classification: 'clarification_required', confidence: 'low', reasons }
    }
    return { classification: 'search_confirmation', confidence, reasons }
  }

  // 5. Default: coaching
  return { classification: 'coaching', confidence: null, reasons: ['default_coaching'] }
}

export function assessSearchConfidence(text: string): SearchConfidence {
  const assessment = classifyUserRequest(text)
  if (assessment.classification === 'coaching') return 'low'
  return assessment.confidence ?? 'low'
}

export function shouldOfferSearchPlanImmediately(text: string): boolean {
  const assessment = classifyUserRequest(text)
  return (
    assessment.classification === 'search_confirmation' &&
    (assessment.confidence === 'high' || assessment.confidence === 'medium')
  )
}

export function shouldClarifyBeforeSearchPlan(text: string): boolean {
  const assessment = classifyUserRequest(text)
  return assessment.classification === 'clarification_required' || assessment.confidence === 'low'
}

export function formatAmbiguousEntityClarifyPrompt(entity: string): string {
  const s = entity.toLowerCase()
  if (s === 'goodwill') {
    return 'Are you looking for Goodwill locations, job opportunities, training programs, organizational information, or something else?'
  }
  if (AMBIGUOUS_ORG_RE.test(s)) {
    return `Are you looking for ${ entity } job opportunities, locations, company information, or something else?`
  }
  if (PERSON_NAME_RE.test(entity)) {
    return `There are many people named ${ entity }. Who are you looking for — for example, their role, organization, or location?`
  }
  if (/^resources?$/.test(s)) {
    return 'What kind of resources are you looking for, and in what city or area?'
  }
  if (/^programs?$/.test(s)) {
    return 'What type of program are you looking for, and in what city or area?'
  }
  if (/^jobs?$/.test(s)) {
    return 'What kind of job are you looking for, and what city or ZIP code should I use?'
  }
  return 'Can you share a bit more detail so I can search accurately — such as location, type of result, or who/what you mean?'
}

import type { SearchPlan, SearchWorkflowPhase, SearchChatTurn } from '../../shared/searchConfirm.js'
import { formatSearchPlanBlock } from '../../shared/searchPlan.js'
import type { SearchRequestAssessment } from '../../shared/searchClassification.js'
import { formatAmbiguousEntityClarifyPrompt } from '../../shared/searchClassification.js'
import {
  getJobSearchDetailStatus,
  formatJobSearchClarifyBlock,
  threadHasJobSearchIntent,
} from '../../shared/jobSearchClarify.js'
import {
  buildListingRecencyInstructions,
  isListingSearchPlan,
  listingRecencyPreviewBullet,
} from '../../shared/searchRecency.js'
import { buildSearchResultLimitInstructions } from '../../shared/searchLimits.js'

export const SEARCH_PLAN_BLOCK_INSTRUCTIONS = `
STRUCTURED SEARCH PLAN (mandatory whenever you offer search confirmation):
- At the very end of your reply, append ONE hidden machine-readable block on its own line.
- Format exactly: <!--SEARCH_PLAN:{"action":"search_confirmation_required","search_query":"...","user_facing_confirmation":"...","search_category":"jobs|people|places|wages|training|organizations|legal|general","search_confidence":"high|medium|low","missing_required_info":[],"bullets":["..."]}-->
- search_query: the precise query you will run if confirmed.
- user_facing_confirmation: one short sentence restating what you will search for (shown in the UI).
- search_category: best-fit category from the list above.
- search_confidence: high or medium when offering confirmation; use low only if you still need clarification (in that case do NOT offer confirmation yet).
- bullets: 1–6 execution criteria; for jobs include role, location, work mode, etc. when known.
- Do NOT search until the user confirms. The hidden block must appear even though users won't see it.
Example block:
${ formatSearchPlanBlock({
  action: 'search_confirmation_required',
  search_query: 'current minimum wage in Connecticut including recent changes',
  user_facing_confirmation: 'the current minimum wage in Connecticut, including any recent or upcoming changes',
  search_category: 'wages',
  search_confidence: 'high',
  missing_required_info: [],
  bullets: ['Current minimum wage in Connecticut', 'Recent or upcoming wage changes'],
}) }
`.trim()

export function buildSearchPreviewExample(referenceDate = new Date()): string {
  const recency = listingRecencyPreviewBullet(referenceDate)
  return `
Example confirmation reply (adapt to the conversation):
"I can look that up. Just to confirm, you want me to search for the current minimum wage in Connecticut, including any recent or upcoming changes. Please confirm before I search, or tell me what to change."

For job searches when ready:
"I can search for jobs near you. Just to confirm, you want me to search for:
• Entry-level retail positions
• In-person jobs
• Within 15 miles of Middletown, CT
• Pay between $16 and $22 per hour
• Full-time opportunities
• ${ recency }

Please confirm before I search, or tell me what to change."

Then append the SEARCH_PLAN block described above.
`.trim()
}

export const SEARCH_CLARIFY_RULES = `
WEB SEARCH — CLARIFICATION PHASE (mandatory):
- The user wants current, external, or local factual information (jobs, wages, people, places, organizations, training, laws, events, resources, or any other topic). You may NOT search the web on this turn.
- Act like a friendly career coach — not a search engine and not an intake form.
- Do NOT answer from memory when live lookup is needed — enter search confirmation instead.
- Do NOT enter search confirmation for general educational questions (e.g. "What is a resume?", "What is networking?", "How do cover letters work?") — answer those directly.
- Use conversation history — do not re-ask what they already answered.
- SEARCH CONFIDENCE:
  • HIGH or MEDIUM confidence → generate a proposed search immediately with the SEARCH_PLAN block and ask for confirmation.
  • LOW confidence or ambiguous entity (e.g. "john smith", "goodwill", "resources" alone) → ask clarifying questions first. Do NOT append SEARCH_PLAN until you have enough detail.
- Ambiguous people: "There are many people named [name]. Who are you looking for?" Do not search yet.
- Ambiguous organizations like "goodwill" alone: ask whether they mean locations, jobs, training, organizational info, or something else.
- Transform clear requests into: "I can look that up. Just to confirm, you want me to search for [clear rephrased query]. Please confirm before I search."
- Do NOT require follow-ups when the request is already specific enough (e.g. "OSHA training near Hartford", "current minimum wage in CT", "John Smith at Goodwill").
- When ready to confirm, restate the search clearly and append the structured SEARCH_PLAN block. Still do NOT search until they confirm.
- For job searches specifically: once the user asks to find/search jobs, gather every remaining detail in one conversational reply (see JOB SEARCH block below when present). Never drip one requirement at a time.
- For job or hiring-event searches: include a bullet that results must be posted within the last 30 days. Skip expired or closed listings when summarizing.
- If the user revises a pending search instead of confirming, update the plan and ask for confirmation again.
${ buildSearchPreviewExample() }
${ SEARCH_PLAN_BLOCK_INSTRUCTIONS }
`.trim()

export const SEARCH_PREVIEW_RULES = `
WEB SEARCH — AWAITING CONFIRMATION (mandatory):
- You previously presented a search plan. The user has NOT confirmed yet. You may NOT search the web on this turn.
- If they want changes, update search_query and user_facing_confirmation, show the revised confirmation, and append a new SEARCH_PLAN block.
- If the plan is ready and unchanged, remind them briefly what you will search for and ask them to confirm before you search.
- Do NOT search, do NOT say you found results, and do NOT invent listings or facts.
${ SEARCH_PLAN_BLOCK_INSTRUCTIONS }
`.trim()

export const SEARCH_EXECUTE_RULES = `
WEB SEARCH — APPROVED (mandatory):
- The user explicitly confirmed after your search preview. Web search is approved for this turn only.
- Search using ONLY the approved criteria below. Summarize real results with source links when available.
- Do NOT invent employers, programs, salaries, dates, or URLs.
- For job openings and hiring events: include ONLY listings that appear active and recently posted (within the last 30 days unless the preview specifies otherwise). Exclude expired, closed, or filled roles.
- If results are thin, say so honestly and suggest refining criteria or pasting a specific link.
`.trim()

export function buildSearchExecutePrompt(plan: SearchPlan, referenceDate = new Date()): string {
  const criteria =
    plan.bullets.length > 0
      ? plan.bullets.map((b) => `• ${ b }`).join('\n')
      : `• ${ plan.search_query }`
  let prompt = `${ SEARCH_EXECUTE_RULES }\n\nAPPROVED SEARCH QUERY:\n${ plan.search_query }\n\nAPPROVED CRITERIA (do not expand beyond this without asking):\n${ criteria }\n\n${ buildSearchResultLimitInstructions() }`
  if (isListingSearchPlan(plan)) {
    prompt += `\n\n${ buildListingRecencyInstructions(referenceDate) }`
  }
  return prompt
}

export function buildSearchWorkflowPrompt(
  phase: SearchWorkflowPhase,
  messages?: SearchChatTurn[],
  assessment?: SearchRequestAssessment | null,
): string {
  switch (phase) {
    case 'clarifying': {
      let rules = SEARCH_CLARIFY_RULES
      if (assessment?.classification === 'clarification_required' && assessment.ambiguousEntity) {
        rules += `\n\nAMBIGUOUS ENTITY DETECTED (${ assessment.ambiguousEntity }):\n- ${ formatAmbiguousEntityClarifyPrompt(assessment.ambiguousEntity) }\n- Do NOT append SEARCH_PLAN on this turn.`
      } else if (assessment?.confidence === 'low') {
        rules += '\n\nLOW SEARCH CONFIDENCE:\n- Ask clarifying questions first. Do NOT append SEARCH_PLAN until the request is specific enough to run a useful search.'
      } else if (assessment?.confidence === 'high' || assessment?.confidence === 'medium') {
        rules += `\n\nSEARCH CONFIDENCE: ${ assessment.confidence.toUpperCase() }\n- You may offer a proposed search with SEARCH_PLAN immediately if no required details are missing.`
      }
      if (messages?.length && threadHasJobSearchIntent(messages)) {
        const status = getJobSearchDetailStatus(messages)
        const block = formatJobSearchClarifyBlock(status)
        if (block) rules += `\n\n${ block }`
      }
      return rules
    }
    case 'awaiting_confirm':
      return SEARCH_PREVIEW_RULES
    case 'execute':
      return ''
    default:
      return `
WEB SEARCH (default):
- Do NOT perform open-ended web search unless the user confirmed a search preview in this conversation.
- Live lookup requests (jobs, wages, people, places, companies, events, training, laws, resources, or anything else) require a clear proposed search first, then explicit CONFIRM SEARCH.
- Do NOT enter search confirmation for evergreen educational questions ("What is a resume?", "What is networking?", "What is OSHA?" as a general concept).
- User-provided URLs are handled separately when pasted in a message.
`.trim()
  }
}

import type { SearchPlan, SearchWorkflowPhase, SearchChatTurn } from '../../shared/searchConfirm.js'
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

export function buildSearchPreviewExample(referenceDate = new Date()): string {
  const recency = listingRecencyPreviewBullet(referenceDate)
  return `
Example search preview format (adapt to the conversation):
"Based on what you've told me, I'm ready to search.

I will search for:
• Entry-level retail positions
• In-person jobs
• Within 15 miles of Middletown, CT
• Pay between $16 and $22 per hour
• Full-time opportunities
• ${ recency }

Reply CONFIRM SEARCH if you would like me to begin this search."
`.trim()
}

export const SEARCH_CLARIFY_RULES = `
WEB SEARCH — CLARIFICATION PHASE (mandatory):
- The user wants a live web lookup (jobs, companies, job fairs, people, training, or any other topic). You may NOT search the web on this turn.
- Act like a friendly career coach in conversation — not a search engine and not an intake form.
- Use conversation history — do not re-ask what they already answered.
- Do NOT show a search preview until you have enough detail. When ready, use bullet criteria in the preview, then ask them to reply CONFIRM SEARCH. Still do NOT search until they confirm.
- For job searches specifically: once the user asks to find/search jobs, gather every remaining detail in one conversational reply (see JOB SEARCH block below when present). Never drip one requirement at a time.
- For job or hiring-event searches: include a bullet that results must be posted within the last 30 days. Skip expired or closed listings when summarizing.
- For training or resource searches: ask what's missing in plain conversational language; mention all gaps in one short reply when several remain.
${ buildSearchPreviewExample() }
`.trim()

export const SEARCH_PREVIEW_RULES = `
WEB SEARCH — AWAITING CONFIRMATION (mandatory):
- You previously presented a search plan. The user has NOT confirmed yet. You may NOT search the web on this turn.
- If they want changes, update the plan and show a revised preview listing all criteria.
- If the plan is ready and unchanged, remind them briefly what you will search for and ask them to reply CONFIRM SEARCH to begin.
- Do NOT search, do NOT say you found results, and do NOT invent listings.
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
  const criteria = plan.bullets.map((b) => `• ${ b }`).join('\n')
  let prompt = `${ SEARCH_EXECUTE_RULES }\n\nAPPROVED SEARCH CRITERIA (do not expand beyond this without asking):\n${ criteria }\n\n${ buildSearchResultLimitInstructions() }`
  if (isListingSearchPlan(plan)) {
    prompt += `\n\n${ buildListingRecencyInstructions(referenceDate) }`
  }
  return prompt
}

export function buildSearchWorkflowPrompt(phase: SearchWorkflowPhase, messages?: SearchChatTurn[]): string {
  switch (phase) {
    case 'clarifying': {
      let rules = SEARCH_CLARIFY_RULES
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
- Live lookup requests (jobs, companies, events, training, or anything else) require clarification first, then a preview, then CONFIRM SEARCH.
- User-provided URLs are handled separately when pasted in a message.
`.trim()
  }
}

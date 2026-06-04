import type { PageFetchOutcome } from './pageFetch.js'
import type { SearchWorkflowPhase, SearchChatTurn } from '../../shared/searchConfirm.js'
import { buildSearchPreviewExample, buildSearchWorkflowPrompt } from './searchWorkflowPrompt.js'
import { isWebSearchEnabled } from './webSearchPolicy.js'

/** User-facing tone when a link could not be loaded — do not use verbatim every time; adapt warmly. */
export const LINK_FETCH_FAILED_USER_GUIDANCE = `
Thanks for sharing that link. Some websites—especially large job boards like Indeed, LinkedIn, and Glassdoor—often restrict access for assistants, so I wasn't able to load that page from the link alone.

Best next steps: try a direct link from the employer's careers page if you have one, or copy and paste the job description or main page text here. Then I can summarize it, explain requirements, and help with your resume, application, or next steps.
`.trim()

export const LINK_FETCH_SUCCESS_RULES = `
USER LINK — PAGE ALREADY FETCHED (critical):
- The user's latest message included a URL. Our server fetched that page; the text is in USER-PROVIDED LINK CONTENT below and/or appended after their message.
- You MUST answer using that fetched text. Lead with a short summary of what the page is and what it offers, then address their question.
- Say you reviewed the link they shared. Do NOT say the user "pasted" page content unless they literally pasted paragraphs (a URL alone is not pasted content).
- Do NOT use negative capability phrases like "I can't access the web", "I cannot browse", "I don't have internet access", or "I can't open links" for this turn—you have the page text.
- Use ONLY facts present in the fetched text. If something is not in the fetched text, say it is not shown on the page — do not guess from general knowledge.
`.trim()

export const LINK_FETCH_FAILED_RULES = `
USER LINK — FETCH FAILED:
- The user shared a URL but our server could not load the page (see error below). Do NOT invent page details from memory.
- Do NOT say "I can't access the web", "I cannot browse the internet", "I don't have web access", or similar broad refusals. Frame help positively: sharing a direct link is usually the best way to review a posting; when a site blocks loading, offer alternatives.
- Explain warmly that some websites (especially job boards like Indeed, LinkedIn, Glassdoor) often restrict assistant access. Suggest: (1) try a direct employer careers-page link, or (2) copy and paste the job description or relevant page text here.
- Do NOT claim the user pasted page content unless they did.
- Keep it brief and supportive; one clear next step.
Example tone (adapt, do not copy verbatim every time):
${ LINK_FETCH_FAILED_USER_GUIDANCE }
`.trim()

export const LINK_ONLY_WEB_RULES = `
WEB ACCESS (strict):
- Open-ended web search requires clarification → search preview → explicit user CONFIRM. Never search immediately on vague requests.
- Never generate fake search results or invent job postings, programs, events, salaries, eligibility, or locations.
- When the user provides a specific URL: use ONLY fetched page text supplied below for that URL.
- Classify links (job posting, training program, employer page, etc.) and respond to their intent from fetched text only.
- If page text failed to load: use LINK FETCH FAILED guidance. Do not guess page contents.
- Do not format coaching replies as a resume unless explicitly requested.
`.trim()

const OPEN_ENDED_JOB_REPLY_HINT = `
When the user asks to find/search jobs (not general career coaching):
- Gather every remaining detail in one conversational reply — role, location, in-person/remote, full/part-time, experience, commute miles, pay.
- Keep it warm and natural; no "What I have so far" headers. Never drip one question at a time.
- When covered, show a bullet search preview (include posted within the last 30 days for jobs) and ask them to reply CONFIRM — do NOT search until they confirm.
${ buildSearchPreviewExample() }
`.trim()

const OPEN_ENDED_RESOURCE_REPLY_HINT = `
Resource or training searches without a link:
- Ask what's missing in plain language; mention all gaps in one short reply when several remain.
- When ready, show a search preview with bullet criteria and ask for CONFIRM before searching.
`.trim()

const OPEN_ENDED_GENERIC_REPLY_HINT = `
Other browse/search requests:
- Clarify what they need, then preview exactly what you will search for, then wait for CONFIRM.
- Alternatively they can paste a direct link or page text for faster help.
`.trim()

export function buildFetchedPagesPromptBlock(pages: PageFetchOutcome[]): string {
  if (!pages.length) return ''

  const blocks = pages.map((page, index) => {
    if (page.ok && page.text) {
      return [
        `--- User-provided link ${ index + 1 } ---`,
        `URL: ${ page.url }`,
        page.title ? `Title: ${ page.title }` : '',
        'Fetched page text (use only this; do not invent details not present here):',
        page.text,
        '--- End link ---',
      ]
        .filter(Boolean)
        .join('\n')
    }
    const jobBoardHint = /\b(indeed|linkedin|glassdoor|ziprecruiter|monster)\./i.test(page.url)
      ? 'Likely a job board that blocks automated access—mention this warmly in your reply.'
      : /\b(workforcenow|adp\.com)\b/i.test(page.url)
        ? 'ADP/WorkforceNow often shows a browser compatibility page to assistants—suggest pasting the job description.'
        : /\b(explore\.jobs\.|jobs\.)/i.test(page.url)
          ? 'If details are missing, the posting may load via JavaScript—suggest pasting the job description.'
          : ''
    const actionHint = page.recommendedUserAction ? `Suggested next step: ${ page.recommendedUserAction }` : ''
    return [
      `--- User-provided link ${ index + 1 } (fetch failed) ---`,
      `URL: ${ page.url }`,
      `Error: ${ page.error ?? page.failureReason ?? 'Could not load page.' }`,
      page.confidence === 'low' ? 'Extraction confidence was low; do NOT invent job details.' : '',
      actionHint,
      jobBoardHint,
      'Use LINK FETCH FAILED guidance: some sites block assistants; suggest employer direct link or paste page text. Do not say "I can\'t access the web".',
      '--- End link ---',
    ]
      .filter(Boolean)
      .join('\n')
  })

  return ['\nUSER-PROVIDED LINK CONTENT (only source for live page facts):', ...blocks].join('\n\n')
}

export function buildWebAccessPrompt(
  webFetchEnabled: boolean,
  pages: PageFetchOutcome[],
  opts?: { searchPhase?: SearchWorkflowPhase; searchMessages?: SearchChatTurn[] },
): string {
  const searchPhase = opts?.searchPhase ?? 'none'
  const searchRules = isWebSearchEnabled()
    ? buildSearchWorkflowPrompt(searchPhase, opts?.searchMessages)
    : ''
  const baseHints = [
    searchRules,
    LINK_ONLY_WEB_RULES,
    OPEN_ENDED_JOB_REPLY_HINT,
    OPEN_ENDED_RESOURCE_REPLY_HINT,
    OPEN_ENDED_GENERIC_REPLY_HINT,
  ].filter(Boolean)

  if (!webFetchEnabled) {
    return baseHints.join('\n\n')
  }

  const anyOk = pages.some((p) => p.ok && p.text?.trim())
  const anyFailed = pages.some((p) => !p.ok)

  if (anyOk) {
    const parts = [LINK_FETCH_SUCCESS_RULES, ...baseHints, buildFetchedPagesPromptBlock(pages)]
    if (anyFailed) parts.push(LINK_FETCH_FAILED_RULES)
    return parts.filter(Boolean).join('\n\n')
  }

  return [LINK_FETCH_FAILED_RULES, ...baseHints, buildFetchedPagesPromptBlock(pages)].filter(Boolean).join('\n\n')
}

export function hasSuccessfullyFetchedPage(pages: PageFetchOutcome[]): boolean {
  return pages.some((p) => p.ok && Boolean(p.text?.trim()))
}

import type { PageFetchOutcome } from './pageFetch.js'

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
- You do NOT perform open-ended web search. Never look up jobs, programs, or resources on your own without a specific link or pasted text from the user.
- Never generate fake search results or invent job postings, programs, events, salaries, eligibility, or locations.
- If the user asks to find jobs, search listings, find local resources, or browse training without a link: guide them positively—the best way to help is a direct link to a specific posting, program, or resource page (or pasted text from that page). Then coach keywords, platforms, and filters if useful. Use the example responses below.
- "Find me jobs" / job boards: Do NOT return listings. Invite them to share a direct link to a posting they care about (employer career pages often work best) or paste the job description.
- Local resources without a link: Invite a direct link to a Goodwill program, job fair, training provider, or community page—or pasted details from that page.
- When the user provides a link: use ONLY fetched page text supplied below for that URL. Do not go beyond those URLs unless they share another link later.
- Classify what the link appears to be (job posting, career resource, training program, employer page, application page, local service, event, other) and respond to their intent.
- Job posting links: summarize the role, requirements, and help tailor resume/cover letter or application messaging from page content + conversation.
- Resource/training/event pages: summarize what is offered; include requirements, cost, timeline, date/location/eligibility when present in the page text; suggest next steps.
- If page text failed to load: use LINK FETCH FAILED guidance (blocked sites, employer link, or paste text). Do not guess page contents.
- Do not format coaching replies as a resume (no PROFESSIONAL SUMMARY / WORK EXPERIENCE headers unless the user explicitly asked for resume output).
- Avoid phrases: "I can't access the web", "I cannot browse", "I don't have browsing". Prefer: "share a direct link", "paste the job description", "employer career page links often work well".
`.trim()

const OPEN_ENDED_JOB_REPLY_HINT = `
Example tone for "find me jobs" without a link:
"The best way I can help with a specific role is if you share the direct link to that job posting—or paste the job description here. Once you do, I can explain the role, qualifications, resume tailoring, and application tips. For browsing many openings, a job board or local workforce site works well—then bring back any postings you want help with."
`.trim()

const OPEN_ENDED_RESOURCE_REPLY_HINT = `
Example tone for local resources without a link:
"If you have a direct link to a Goodwill program, job fair, training provider, or community resource page, share it here and I'll explain what it offers and how it may help. You can also paste text from the page if that's easier."
`.trim()

const OPEN_ENDED_GENERIC_REPLY_HINT = `
Example tone for other browse requests without a link:
"Share a direct link to the specific job posting, training program, or resource page you'd like help with—or paste the main text from that page—and I can summarize it and help you decide next steps. A direct employer or organization link usually works best."
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

export function buildWebAccessPrompt(webFetchEnabled: boolean, pages: PageFetchOutcome[]): string {
  if (!webFetchEnabled) {
    return [
      LINK_ONLY_WEB_RULES,
      OPEN_ENDED_JOB_REPLY_HINT,
      OPEN_ENDED_RESOURCE_REPLY_HINT,
      OPEN_ENDED_GENERIC_REPLY_HINT,
    ].join('\n\n')
  }

  const anyOk = pages.some((p) => p.ok && p.text?.trim())
  const anyFailed = pages.some((p) => !p.ok)

  if (anyOk) {
    const parts = [LINK_FETCH_SUCCESS_RULES, LINK_ONLY_WEB_RULES, buildFetchedPagesPromptBlock(pages)]
    if (anyFailed) parts.push(LINK_FETCH_FAILED_RULES)
    return parts.filter(Boolean).join('\n\n')
  }

  return [LINK_FETCH_FAILED_RULES, LINK_ONLY_WEB_RULES, buildFetchedPagesPromptBlock(pages)].filter(Boolean).join('\n\n')
}

export function hasSuccessfullyFetchedPage(pages: PageFetchOutcome[]): boolean {
  return pages.some((p) => p.ok && Boolean(p.text?.trim()))
}

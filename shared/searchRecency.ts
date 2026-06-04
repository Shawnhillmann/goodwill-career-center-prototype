import type { SearchPlan } from './searchConfirm.js'

export const LISTING_SEARCH_RECENCY_DAYS = 30

export type SearchRecencyWindow = {
  days: number
  start: Date
  end: Date
  startLabel: string
  endLabel: string
}

function formatSearchDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function getListingSearchRecencyWindow(
  referenceDate = new Date(),
  days = LISTING_SEARCH_RECENCY_DAYS,
): SearchRecencyWindow {
  const end = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()),
  )
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - days)

  return {
    days,
    start,
    end,
    startLabel: formatSearchDate(start),
    endLabel: formatSearchDate(end),
  }
}

/** Job openings, hiring events, and similar listings that go stale. */
export function isListingSearchPlan(plan: SearchPlan): boolean {
  const text = plan.bullets.join(' ').toLowerCase()
  const looksLikeListing =
    /\b(jobs?|openings?|positions?|listings?|hiring|career events?|job fairs?|companies are hiring)\b/.test(
      text,
    )
  const looksLikeTrainingOnly =
    /\b(training programs?|certification courses?|classes?|coursework)\b/.test(text) &&
    !/\b(jobs?|hiring|fair|events?)\b/.test(text)
  return looksLikeListing && !looksLikeTrainingOnly
}

export function planAlreadyIncludesRecency(plan: SearchPlan): boolean {
  const text = plan.bullets.join(' ').toLowerCase()
  return (
    /\b(last|past|recent|within)\s+\d+\s*(day|days|week|weeks|month|months)\b/.test(text) ||
    /\bposted (within|in|since|after|before)\b/.test(text) ||
    /\bcurrent(ly)? (active )?(openings?|listings?|jobs?)\b/.test(text) ||
    /\bnot expired\b/.test(text)
  )
}

export function buildListingRecencyInstructions(referenceDate = new Date()): string {
  const window = getListingSearchRecencyWindow(referenceDate)
  return [
    'RECENCY (mandatory for this search):',
    `- Only include postings or events that appear CURRENT and were posted or updated within the last ${ window.days } days (${ window.startLabel } through ${ window.endLabel }).`,
    '- Exclude expired, closed, filled, or archived listings. Skip anything marked expired, "no longer accepting applications", "30+ days ago", or similar.',
    '- Prefer employer career pages and major boards; note posting dates when shown.',
    '- Use search phrasing that favors recent results (e.g. "posted last month", "recent", current year) when the search tool allows.',
    '- If you only find older listings, say so honestly — do not present expired postings as active opportunities.',
  ].join('\n')
}

export function listingRecencyPreviewBullet(referenceDate = new Date()): string {
  const window = getListingSearchRecencyWindow(referenceDate)
  return `Posted or updated within the last ${ window.days } days (${ window.startLabel } – ${ window.endLabel })`
}

const URL_IN_TEXT = /https?:\/\/[^\s)\]>]+/gi

export function extractHttpLinks(text: string): string[] {
  const matches = text.match(URL_IN_TEXT) ?? []
  return [...new Set(matches.map((u) => u.replace(/[.,;:!?)]+$/, '')))]
}

export function looksLikePlaceholderTemplate(text: string): boolean {
  const s = text.toLowerCase()
  return (
    /\[searching for/.test(s) ||
    /\[insert (specific )?(date|time|location|company|url|link)/.test(s) ||
    /\binsert (specific )?(date|time|location|company|url|link)\b/.test(s) ||
    /\bexample\.com\b/.test(s) ||
    s.includes('please hold on for a moment') ||
    (/\blet me (look up|search)\b/.test(s) && extractHttpLinks(text).length === 0)
  )
}

/** Claims a live search happened but provides no verifiable links. */
export function looksLikeUngroundedSearchClaim(text: string): boolean {
  const s = text.toLowerCase()
  const claimsSearch =
    /\bi searched\b/.test(s) ||
    /\bhere are (some |the )?(current |live )?(job )?listings\b/.test(s) ||
    /\bi found \d+/.test(s)
  if (!claimsSearch) return false
  return extractHttpLinks(text).length === 0
}

export function requiresFreshData(userText: string): boolean {
  const s = userText.toLowerCase()
  return (
    /\b(job fair|job fairs|career fair|career fairs|hiring event|hiring events|career expo|recruiting event|recruiting events)\b/.test(
      s,
    ) ||
    /\b(this week|this month|next week|next month|upcoming|today|tomorrow)\b/.test(s) ||
    /\b(local resources|near me)\b/.test(s)
  )
}

export type GroundingQuality = 'ok' | 'empty' | 'placeholder' | 'ungrounded_claim' | 'no_links'

export function assessLiveSearchOutput(text: string, citationCount: number): GroundingQuality {
  if (!text?.trim()) return 'empty'
  if (looksLikePlaceholderTemplate(text)) return 'placeholder'
  if (looksLikeUngroundedSearchClaim(text) && citationCount === 0) return 'ungrounded_claim'
  const linkCount = extractHttpLinks(text).length
  if (linkCount === 0 && citationCount === 0) return 'no_links'
  return 'ok'
}

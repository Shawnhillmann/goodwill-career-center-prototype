import { extractUserProvidedUrls } from '../../shared/urlDetect.js'

/** @deprecated Prefer extractUserProvidedUrls — kept for reply link counting. */
export function extractHttpLinks(text: string): string[] {
  return extractUserProvidedUrls(text)
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

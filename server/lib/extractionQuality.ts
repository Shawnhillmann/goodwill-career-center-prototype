import { isChromeHeavyText, isLowQualityPageText, JOB_SIGNAL_RE } from './pageContentExtract.js'
import type { ExtractionConfidence, NormalizedJobPosting } from './extractionTypes.js'

export const BLOCKED_PAGE_RE =
  /\b(unsupported browser|switch to a supported browser|please upgrade your browser|enable javascript|javascript is required|access denied|forbidden|captcha|verify you are human|sign in to view|login required|request blocked|bot detection)\b/i

export const JOB_SECTION_RE =
  /\b(responsibilities|qualifications|requirements|about the role|job description|what you.?ll do|what we.?re looking for|salary|compensation|apply|employment type|minimum qualifications|preferred qualifications)\b/i

export type QualityScoreResult = {
  score: number
  confidence: ExtractionConfidence
  positive: string[]
  negative: string[]
  blocked: boolean
  blockedReason?: string
}

function countBullets(text: string): number {
  return (text.match(/(?:^|\n)\s*[-•*]\s+/gm) ?? []).length
}

function linkToParagraphRatio(text: string): number {
  const links = (text.match(/\bhttps?:\/\/|\bwww\./gi) ?? []).length
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length >= 40).length
  return links / Math.max(paragraphs, 1)
}

export function detectBlockedPage(text: string): { blocked: boolean; reason?: string } {
  const sample = text.slice(0, 3000)
  if (BLOCKED_PAGE_RE.test(sample)) {
    const match = sample.match(BLOCKED_PAGE_RE)
    return {
      blocked: true,
      reason: `Page appears blocked or unsupported (${ match?.[0] ?? 'compatibility message' }).`,
    }
  }
  if (/\b(sign in|log in)\b/i.test(sample) && sample.length < 900 && !JOB_SIGNAL_RE.test(sample)) {
    return { blocked: true, reason: 'Page requires sign-in; job content not visible.' }
  }
  return { blocked: false }
}

export function scoreExtractionContent(
  text: string,
  options: { title?: string; structured?: NormalizedJobPosting } = {},
): QualityScoreResult {
  const positive: string[] = []
  const negative: string[] = []
  let score = 0

  const title = options.title ?? options.structured?.title ?? ''
  const blocked = detectBlockedPage(text)
  if (blocked.blocked) {
    return {
      score: 0,
      confidence: 'low',
      positive,
      negative: ['blocked_or_placeholder_page'],
      blocked: true,
      blockedReason: blocked.reason,
    }
  }

  if (isLowQualityPageText(text, title)) negative.push('low_quality_or_spa_config')
  if (isChromeHeavyText(text, title)) negative.push('chrome_heavy_nav_footer')

  const len = text.length
  if (len >= 1500 && len <= 20_000) {
    score += 25
    positive.push('reasonable_length')
  } else if (len >= 800) {
    score += 12
    positive.push('adequate_length')
  } else if (len < 800) {
    score -= 20
    negative.push('text_too_short')
  }

  const jobHits = (text.match(JOB_SIGNAL_RE) ?? []).length
  if (jobHits >= 4) {
    score += 20
    positive.push('strong_job_signals')
  } else if (jobHits >= 2) {
    score += 10
    positive.push('some_job_signals')
  } else {
    score -= 15
    negative.push('weak_job_signals')
  }

  if (JOB_SECTION_RE.test(text)) {
    score += 15
    positive.push('job_section_headings')
  }

  const bullets = countBullets(text)
  if (bullets >= 3) {
    score += 8
    positive.push('bullet_content')
  }

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length >= 60).length
  if (paragraphs >= 3) {
    score += 10
    positive.push('multiple_paragraphs')
  }

  if (title && text.toLowerCase().includes(title.toLowerCase().slice(0, Math.min(24, title.length)))) {
    score += 8
    positive.push('title_present_in_body')
  }

  const structured = options.structured
  if (structured?.title) {
    score += 10
    positive.push('structured_title')
  }
  if (structured?.description && structured.description.length >= 100) {
    score += 12
    positive.push('structured_description')
  }
  if (structured?.qualifications?.length) {
    score += 8
    positive.push('structured_qualifications')
  }
  if (structured?.responsibilities?.length) {
    score += 8
    positive.push('structured_responsibilities')
  }
  if (structured?.location) {
    score += 5
    positive.push('structured_location')
  }
  if (structured?.salary) {
    score += 5
    positive.push('structured_salary')
  }

  const hasStructuredBundle =
    Boolean(structured?.title) &&
    (Boolean(structured?.description && structured.description.length >= 20) ||
      Boolean(structured?.qualifications?.length) ||
      Boolean(structured?.responsibilities?.length))
  if (hasStructuredBundle) {
    score += 18
    positive.push('structured_job_bundle')
    if (len >= 350 && len < 800) {
      score += 12
      positive.push('structured_compact_posting')
    }
  }

  if (linkToParagraphRatio(text) > 4) {
    score -= 12
    negative.push('too_many_links_vs_paragraphs')
  }

  if (negative.includes('chrome_heavy_nav_footer')) score -= 25
  if (negative.includes('low_quality_or_spa_config')) score -= 20

  if (
    hasStructuredBundle &&
    !negative.includes('chrome_heavy_nav_footer') &&
    !negative.includes('low_quality_or_spa_config')
  ) {
    score = Math.max(score, 35)
  }

  score = Math.max(0, Math.min(100, score))

  let confidence: ExtractionConfidence = 'low'
  if (score >= 55 && !negative.includes('chrome_heavy_nav_footer') && len >= 800) {
    confidence = 'high'
  } else if (
    score >= 32 &&
    len >= 500 &&
    jobHits >= 1 &&
    !negative.includes('chrome_heavy_nav_footer')
  ) {
    confidence = 'medium'
  } else if (
    hasStructuredBundle &&
    score >= 28 &&
    len >= 280 &&
    !negative.includes('chrome_heavy_nav_footer')
  ) {
    confidence = 'medium'
  }

  if (
    hasStructuredBundle &&
    score >= 35 &&
    !negative.includes('chrome_heavy_nav_footer') &&
    !blocked.blocked
  ) {
    confidence = confidence === 'high' ? 'high' : 'medium'
  }

  return { score, confidence, positive, negative, blocked: false }
}

export function pickBestCandidate<T extends { text: string; title?: string; structuredJob?: NormalizedJobPosting }>(
  candidates: T[],
  scoreFn: (c: T) => QualityScoreResult = (c) =>
    scoreExtractionContent(c.text, { title: c.title, structured: c.structuredJob }),
): { best: T | null; score: QualityScoreResult | null } {
  let best: T | null = null
  let bestScore: QualityScoreResult | null = null

  for (const candidate of candidates) {
    if (!candidate.text?.trim()) continue
    const scored = scoreFn(candidate)
    if (scored.blocked) continue
    if (!bestScore || scored.score > bestScore.score) {
      best = candidate
      bestScore = scored
    }
  }

  return { best, score: bestScore }
}

export function isAcceptableForLlm(
  confidence: ExtractionConfidence,
  score: number,
  hasStructuredJob = false,
): boolean {
  if (confidence === 'high') return true
  if (confidence === 'medium' && score >= 25) return true
  if (hasStructuredJob && score >= 28 && confidence !== 'low') return true
  return false
}

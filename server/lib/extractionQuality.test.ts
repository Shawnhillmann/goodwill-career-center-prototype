import { describe, expect, it } from 'vitest'
import { isChromeHeavyText } from './pageContentExtract.js'
import { scoreExtractionContent, pickBestCandidate, isAcceptableForLlm } from './extractionQuality.js'

describe('extractionQuality', () => {
  it('rejects chrome-heavy nav-only text', () => {
    const chrome =
      'Sign in All Jobs Cookie Policy Privacy Notice Terms of Use Site Map Accessibility Equal Opportunity Employer © 2026 Footer Navigation'
    expect(isChromeHeavyText(chrome, 'Analyst')).toBe(true)
    const scored = scoreExtractionContent(chrome, { title: 'Analyst' })
    expect(isAcceptableForLlm(scored.confidence, scored.score)).toBe(false)
  })

  it('prefers structured job content over chrome', () => {
    const good = [
      'Title: Product Manager',
      'Description: Lead product strategy for our hiring platform across multiple teams.',
      'Qualifications: 5+ years product management. Strong communication and stakeholder skills required.',
      'Responsibilities: Define roadmap and partner with engineering. Own requirements and launch planning.',
      'Location: Remote, US. Employment type: Full-time. Salary: Competitive compensation package.',
      'Apply: Submit resume via careers page. Benefits include health coverage and professional development.',
    ].join('\n\n')
    const bad = 'Sign in Cookie Policy Privacy Footer Navigation Site Map'
    const structured = {
      title: 'Product Manager',
      description: 'Lead product strategy for our hiring platform.',
      qualifications: ['5+ years product management'],
      source: 'json-ld' as const,
    }
    const { best, score } = pickBestCandidate([
      { text: bad, strategy: 'plain' },
      { text: good, strategy: 'structured', title: 'Product Manager', structuredJob: structured },
    ])
    expect(best?.strategy).toBe('structured')
    expect(score?.confidence).not.toBe('low')
  })
})

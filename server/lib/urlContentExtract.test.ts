import { describe, expect, it } from 'vitest'
import { extractUrlContent } from './urlContentExtract.js'
import { scoreExtractionContent, detectBlockedPage, isAcceptableForLlm } from './extractionQuality.js'
import { extractAllStructuredJobs, normalizedJobToText } from './structuredJobExtract.js'

function buildAppleHydrationHtml(jobsData: Record<string, string>): string {
  const payload = { loaderData: { jobDetails: { jobsData } } }
  const escaped = JSON.stringify(JSON.stringify(payload))
  return `<!DOCTYPE html><html><head><title>Apple Jobs</title></head><body>
    <nav>Sign in Cookie Policy Privacy Equal Opportunity</nav>
    <footer>© 2026 Apple Inc. Site Map</footer>
    <script>window.__staticRouterHydrationData = JSON.parse(${escaped});</script>
  </body></html>`
}

describe('urlContentExtract', () => {
  it('scores blocked ADP-style browser compatibility pages', () => {
    const text =
      'Unsupported Browser. Please switch to a supported browser to view this job posting. Sign in to ADP Workforce Now.'
    expect(detectBlockedPage(text).blocked).toBe(true)
    const scored = scoreExtractionContent(text)
    expect(scored.confidence).toBe('low')
  })

  it('extracts Apple hydration via HTTP stage without browser', async () => {
    const html = buildAppleHydrationHtml({
      postingTitle: 'US - Specialist: Seasonal, Part-time',
      jobSummary: 'Apple Retail is where the best of Apple comes together.',
      description: 'Deliver a great experience with a focus on supporting customers.',
      minimumQualifications: 'You must have availability to work on a flexible schedule.',
      preferredQualifications: 'Knowledge of Apple products and passion for technology.',
    })

    const jobs = extractAllStructuredJobs(html)
    expect(jobs.length).toBeGreaterThan(0)
    const text = normalizedJobToText(jobs[0])
    const scored = scoreExtractionContent(text, { structured: jobs[0], title: jobs[0].title })
    expect(isAcceptableForLlm(scored.confidence, scored.score, true)).toBe(true)
    expect(text).toMatch(/flexible schedule/i)
    expect(text).not.toMatch(/Equal Opportunity Employer/i)
  })

  it('returns failure for invalid URLs', async () => {
    const result = await extractUrlContent('ftp://example.com/job')
    expect(result.success).toBe(false)
    expect(result.confidence).toBe('low')
    expect(result.failureReason).toMatch(/invalid/i)
  })

  it('extracts JSON-LD JobPosting with high confidence', () => {
    const html = `<!DOCTYPE html><html><head>
      <script type="application/ld+json">
      {"@type":"JobPosting","title":"Software Engineer","description":"<p>Build and maintain scalable APIs for our hiring platform.</p><ul><li>5+ years backend experience</li><li>Strong communication</li></ul>","employmentType":"FULL_TIME","jobLocation":{"@type":"Place","address":{"addressLocality":"Austin","addressRegion":"TX"}}}
      </script></head><body><nav>Home</nav></body></html>`
    const jobs = extractAllStructuredJobs(html)
    expect(jobs[0]?.title).toBe('Software Engineer')
    const text = normalizedJobToText(jobs[0])
    const scored = scoreExtractionContent(text, { structured: jobs[0], title: jobs[0].title })
    expect(scored.positive).toContain('structured_title')
    expect(isAcceptableForLlm(scored.confidence, scored.score, true)).toBe(true)
  })
})

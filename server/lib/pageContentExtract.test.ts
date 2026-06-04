import { describe, expect, it } from 'vitest'
import {
  analyzeExtractionMetrics,
  extractReadableContentFromHtml,
  formatJobRecord,
  formatSmartRecruitersPosting,
  isChromeHeavyText,
  isLowQualityPageText,
  parseSmartRecruitersJobUrl,
} from './pageContentExtract.js'

function buildAppleHydrationHtml(jobsData: Record<string, string>): string {
  const payload = { loaderData: { jobDetails: { jobsData } } }
  const escaped = JSON.stringify(JSON.stringify(payload))
  return `<!DOCTYPE html><html><head><title>Apple Jobs</title></head><body>
    <nav>Sign in Cookie Policy Privacy</nav>
    <footer>Equal Opportunity Employer © 2026 Apple Inc.</footer>
    <script>window.__staticRouterHydrationData = JSON.parse(${escaped});</script>
  </body></html>`
}

describe('pageContentExtract', () => {
  it('detects config-heavy SPA shell text', () => {
    const junk =
      'webpackChunk explore jobs function(){var e=window.__APP_CONFIG__={styles:true,chunks:[]}} document.head stylesheet'
    expect(isLowQualityPageText(junk, 'Manager, Account Management')).toBe(true)
  })

  it('extracts JobPosting JSON-LD when visible HTML is only scripts', () => {
    const html = `<!DOCTYPE html><html><head><title>Manager Role</title>
      <script>window.__APP__={chunks:['a','b']}</script>
      <script type="application/ld+json">
      {"@type":"JobPosting","title":"Manager, Account Management","description":"<p>Lead client relationships.</p><ul><li>5+ years experience</li></ul>","employmentType":"FULL_TIME"}
      </script></head><body><div id="root"></div></body></html>`

    const result = extractReadableContentFromHtml(html)
    expect(result.source).toBe('structured')
    expect(result.text).toMatch(/Manager, Account Management/i)
    expect(result.text).toMatch(/Lead client relationships/i)
    expect(result.text).toMatch(/5\+ years experience/i)
  })

  it('parses Netflix SmartRecruiters career URLs', () => {
    const parsed = parseSmartRecruitersJobUrl(
      new URL('https://explore.jobs.netflix.com/careers/job/790315987382?microsite=netflix.com'),
    )
    expect(parsed).toEqual({ company: 'Netflix', postingId: '790315987382' })
  })

  it('formats SmartRecruiters API payloads', () => {
    const text = formatSmartRecruitersPosting({
      name: 'Manager, Account Management',
      location: { city: 'New York', region: 'NY', country: 'US' },
      jobAd: {
        jobDescription: { text: '<p>Own strategic accounts.</p>' },
        qualifications: { text: 'MBA preferred. 7+ years in sales.' },
      },
    })
    expect(text).toMatch(/Manager, Account Management/)
    expect(text).toMatch(/Own strategic accounts/)
    expect(text).toMatch(/MBA preferred/)
  })

  it('extracts Apple Jobs hydration payload instead of nav/footer chrome', () => {
    const html = buildAppleHydrationHtml({
      postingTitle: 'US - Specialist: Seasonal, Part-time',
      jobSummary: 'Apple Retail is where the best of Apple comes together.',
      description: 'Deliver a great experience with a focus on supporting customers.',
      minimumQualifications: 'You must have availability to work on a flexible schedule.',
      preferredQualifications: 'Knowledge of Apple products and passion for technology.',
    })

    const result = extractReadableContentFromHtml(html)
    expect(result.source).toBe('structured')
    expect(result.text).toMatch(/US - Specialist: Seasonal, Part-time/i)
    expect(result.text).toMatch(/Apple Retail is where the best/i)
    expect(result.text).toMatch(/Deliver a great experience/i)
    expect(result.text).toMatch(/flexible schedule/i)
    expect(result.text).toMatch(/Knowledge of Apple products/i)
    expect(result.text).not.toMatch(/Equal Opportunity Employer/i)
  })

  it('flags chrome-heavy visible HTML without job signals', () => {
    const chrome =
      'Sign in All Jobs Cookie Policy Privacy Notice Terms of Use Site Map Accessibility Equal Opportunity Employer © 2026 Footer Navigation'
    expect(isChromeHeavyText(chrome, 'US - Specialist')).toBe(true)
  })

  it('formats generic job records from hydration-like objects', () => {
    const text = formatJobRecord({
      postingTitle: 'Software Engineer',
      jobSummary: 'Build scalable services for our platform.',
      minimumQualifications: 'BS in Computer Science or equivalent experience.',
    })
    expect(text).toMatch(/Software Engineer/)
    expect(text).toMatch(/Build scalable services/)
    expect(text).toMatch(/Computer Science/)
  })

  it('reports low structured signal on SPA shell pages', () => {
    const html = `<html><head><title>Role</title></head><body>
      <nav>Home Careers Sign in</nav>
      <div id="root"></div>
      <script>window.__APP__={chunks:['a','b'],styles:true}</script>
    </body></html>`
    const metrics = analyzeExtractionMetrics(html)
    expect(metrics.structuredBlockCount).toBe(0)
    expect(metrics.lowQuality || metrics.chromeHeavy).toBe(true)
  })
})

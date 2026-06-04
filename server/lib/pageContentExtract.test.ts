import { describe, expect, it } from 'vitest'
import {
  extractReadableContentFromHtml,
  formatSmartRecruitersPosting,
  isLowQualityPageText,
  parseSmartRecruitersJobUrl,
} from './pageContentExtract.js'

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
})

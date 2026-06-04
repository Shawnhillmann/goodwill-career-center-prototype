import type { NetworkRequestLog } from './extractionTypes.js'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const JOB_WAIT_SELECTORS = [
  'main',
  '[role="main"]',
  'article',
  '[data-testid*="job" i]',
  '[class*="job-description" i]',
  '[id*="job-description" i]',
  '[class*="posting" i]',
  '[id*="description" i]',
]

const JOB_TEXT_MARKERS =
  /\b(Responsibilities|Qualifications|Requirements|About the role|Job description|What you.?ll do|Salary|Compensation|Apply|Employment type)\b/i

export type BrowserRenderResult = {
  html: string
  finalUrl: string
  renderedDomLength: number
  networkRequests: NetworkRequestLog[]
  blockedRequests: string[]
  failedRequests: string[]
  jsonBodies: Array<{ url: string; body: string }>
  screenshotNote?: string
}

export function isBrowserRenderEnabled(): boolean {
  return process.env.PAGE_FETCH_USE_BROWSER === '1' || process.env.PAGE_FETCH_USE_BROWSER === 'true'
}

type PlaywrightModule = {
  chromium: { launch: (opts?: { headless?: boolean }) => Promise<PlaywrightBrowser> }
}

type PlaywrightBrowser = {
  newContext: (opts?: Record<string, unknown>) => Promise<PlaywrightContext>
  close: () => Promise<void>
}

type PlaywrightContext = {
  newPage: () => Promise<PlaywrightPage>
  close: () => Promise<void>
}

type PlaywrightPage = {
  goto: (url: string, opts?: Record<string, unknown>) => Promise<void>
  waitForLoadState: (state: string, opts?: Record<string, unknown>) => Promise<void>
  waitForSelector: (selector: string, opts?: Record<string, unknown>) => Promise<void>
  content: () => Promise<string>
  url: () => string
  evaluate: (fn: () => string) => Promise<string>
  on: (event: string, handler: (...args: unknown[]) => void) => void
}

async function loadPlaywright(): Promise<PlaywrightModule | null> {
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (
      s: string,
    ) => Promise<PlaywrightModule>
    return await dynamicImport('playwright')
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Headless Chrome render when Playwright is installed and PAGE_FETCH_USE_BROWSER=1. */
export async function renderPageWithBrowser(url: string, timeoutMs = 25_000): Promise<BrowserRenderResult | null> {
  if (!isBrowserRenderEnabled()) return null

  const pw = await loadPlaywright()
  if (!pw) return null

  const networkRequests: NetworkRequestLog[] = []
  const blockedRequests: string[] = []
  const failedRequests: string[] = []
  const jsonBodies: Array<{ url: string; body: string }> = []

  let browser: PlaywrightBrowser | null = null

  try {
    browser = await pw.chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: BROWSER_UA,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      viewport: { width: 1280, height: 900 },
    })
    const page = await context.newPage()

    const pageEvents = page as PlaywrightPage & {
      on(event: 'requestfailed', handler: (req: PlaywrightRequest) => void): void
      on(event: 'response', handler: (response: PlaywrightResponse) => void): void
    }

    type PlaywrightRequest = {
      method: () => string
      url: () => string
      failure: () => { errorText?: string } | null
    }

    type PlaywrightResponse = {
      url: () => string
      status: () => number
      ok: () => boolean
      headers: () => Record<string, string>
      request: () => { method: () => string; resourceType: () => string }
      text: () => Promise<string>
    }

    pageEvents.on('requestfailed', (req) => {
      failedRequests.push(`${ req.method() } ${ req.url() } — ${ req.failure()?.errorText ?? 'failed' }`)
    })

    pageEvents.on('response', async (response) => {
      const req = response.request()
      const resourceType = req.resourceType()
      const contentType = (response.headers()['content-type'] ?? '').toLowerCase()
      const entry: NetworkRequestLog = {
        url: response.url(),
        method: req.method(),
        status: response.status(),
        contentType,
        ok: response.ok(),
      }
      networkRequests.push(entry)

      if (!response.ok() && ['xhr', 'fetch'].includes(resourceType)) {
        failedRequests.push(`${ req.method() } ${ response.url() } — HTTP ${ response.status() }`)
      }

      if (
        response.ok() &&
        (contentType.includes('json') || resourceType === 'xhr' || resourceType === 'fetch')
      ) {
        try {
          const body = await response.text()
          if (body.length >= 80 && body.length < 500_000) {
            jsonBodies.push({ url: response.url(), body })
          }
        } catch {
          // response body unavailable
        }
      }
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs })

    try {
      await page.waitForLoadState('networkidle', { timeout: 6000 })
    } catch {
      // continue with partial load
    }

    const deadline = Date.now() + 8000
    let lastLen = 0
    while (Date.now() < deadline) {
      const text = await page.evaluate(() => document.body?.innerText ?? '')
      if (JOB_TEXT_MARKERS.test(text) && text.length >= 1200) break
      if (text.length > lastLen + 400) lastLen = text.length
      await sleep(500)
    }

    for (const selector of JOB_WAIT_SELECTORS) {
      try {
        await page.waitForSelector(selector, { timeout: 1500 })
        break
      } catch {
        // try next
      }
    }

    const html = await page.content()
    const finalUrl = page.url()
    await context.close()

    let screenshotNote: string | undefined
    if (process.env.PAGE_FETCH_SCREENSHOT_ON_FAILURE === '1') {
      screenshotNote = 'screenshot skipped (success path)'
    }

    return {
      html,
      finalUrl,
      renderedDomLength: html.length,
      networkRequests: networkRequests.slice(-80),
      blockedRequests,
      failedRequests: failedRequests.slice(-40),
      jsonBodies,
      screenshotNote,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    failedRequests.push(`browser: ${ message }`)
    return null
  } finally {
    if (browser) await browser.close().catch(() => undefined)
  }
}

/** Parse JSON network responses for job-like payloads (used by urlContentExtract). */
export function extractJobTextFromNetworkJsonBodies(
  bodies: Array<{ url: string; body: string }>,
): string | null {
  const JOB_KEYS = /"(title|description|qualifications|responsibilities|jobTitle|postingTitle|requisition)"/i

  for (const { body } of bodies) {
    if (!JOB_KEYS.test(body)) continue
    try {
      const parsed = JSON.parse(body) as unknown
      const parts: string[] = []
      const walk = (v: unknown, depth: number): void => {
        if (depth > 14 || parts.length > 12) return
        if (typeof v === 'string' && v.length >= 60 && JOB_KEYS.test(v)) parts.push(v)
        if (v && typeof v === 'object') {
          for (const val of Object.values(v as Record<string, unknown>)) walk(val, depth + 1)
        }
      }
      walk(parsed, 0)
      const merged = [...new Set(parts)].join('\n\n')
      if (merged.length >= 200) return merged
    } catch {
      // ignore
    }
  }
  return null
}

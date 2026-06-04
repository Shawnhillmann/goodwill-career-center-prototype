import {
  extractHtmlTitle,
  extractReadableContentFromHtml,
  isLowQualityPageText,
} from './pageContentExtract.js'
import { fetchSmartRecruitersJobText } from './smartRecruitersFetch.js'

const FETCH_TIMEOUT_MS = 12_000
const MAX_BYTES = 768_000
const MAX_TEXT_CHARS = 14_000
const MAX_REDIRECTS = 3

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '127.0.0.1' || h === '0.0.0.0' || h === '::1') return true
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  return false
}

export function validateFetchableUrl(raw: string): URL | null {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (isPrivateOrLocalHost(u.hostname)) return null
    return u
  } catch {
    return null
  }
}

export type PageFetchOutcome = {
  url: string
  ok: boolean
  statusCode?: number
  title?: string
  text?: string
  error?: string
}

async function trySupplementalJobText(url: URL, html: string, title: string): Promise<string | null> {
  const sr = await fetchSmartRecruitersJobText(url)
  if (sr) return sr.slice(0, MAX_TEXT_CHARS)

  const extracted = extractReadableContentFromHtml(html)
  if (extracted.text && extracted.source !== 'html' && !isLowQualityPageText(extracted.text, title)) {
    return extracted.text
  }

  return null
}

async function fetchOnce(url: URL, redirectCount: number): Promise<PageFetchOutcome> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: redirectCount >= MAX_REDIRECTS ? 'manual' : 'follow',
      signal: controller.signal,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,application/json;q=0.5,*/*;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': BROWSER_USER_AGENT,
      },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || redirectCount >= MAX_REDIRECTS) {
        return { url: url.toString(), ok: false, statusCode: response.status, error: 'Too many redirects or missing location.' }
      }
      const next = new URL(location, url)
      const validated = validateFetchableUrl(next.toString())
      if (!validated) {
        return { url: url.toString(), ok: false, error: 'Redirect blocked (unsafe target).' }
      }
      return fetchOnce(validated, redirectCount + 1)
    }

    if (!response.ok) {
      return {
        url: url.toString(),
        ok: false,
        statusCode: response.status,
        error: `Page returned HTTP ${ response.status }.`,
      }
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    const reader = response.body?.getReader()
    if (!reader) {
      return { url: url.toString(), ok: false, error: 'Empty response body.' }
    }

    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.length
      if (total > MAX_BYTES) {
        return { url: url.toString(), ok: false, error: 'Page is too large to review.' }
      }
      chunks.push(value)
    }

    const raw = Buffer.concat(chunks).toString('utf8')

    if (contentType.includes('json') && !contentType.includes('html')) {
      const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_CHARS)
      if (text.length < 40) {
        return { url: url.toString(), ok: false, error: 'Could not extract readable text from this response.' }
      }
      return { url: url.toString(), ok: true, statusCode: response.status, text }
    }

    const title = extractHtmlTitle(raw)
    let extracted = extractReadableContentFromHtml(raw)
    let text = extracted.text

    if (!text || isLowQualityPageText(text, title)) {
      const supplemental = await trySupplementalJobText(url, raw, title)
      if (supplemental) {
        text = supplemental
        extracted = { title, text, source: 'structured' }
      }
    }

    if (!text || text.length < 40 || isLowQualityPageText(text, title)) {
      return {
        url: url.toString(),
        ok: false,
        statusCode: response.status,
        error:
          'Could not extract readable job or page content (this site may load details with JavaScript only). Try pasting the job description or an employer career-page link.',
      }
    }

    return {
      url: url.toString(),
      ok: true,
      statusCode: response.status,
      title: title || extracted.title,
      text,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const error =
      message.includes('abort') || message.includes('Abort')
        ? 'Timed out loading this page.'
        : `Could not load this page (${ message }).`
    return { url: url.toString(), ok: false, error }
  } finally {
    clearTimeout(timer)
  }
}

/** Fetch a single user-provided http(s) URL (no browsing beyond redirects). */
export async function fetchUserProvidedPage(rawUrl: string): Promise<PageFetchOutcome> {
  const validated = validateFetchableUrl(rawUrl)
  if (!validated) {
    return { url: rawUrl, ok: false, error: 'Invalid or blocked URL.' }
  }
  return fetchOnce(validated, 0)
}

export const MAX_USER_PROVIDED_URLS = 3

export async function fetchUserProvidedPages(urls: string[]): Promise<PageFetchOutcome[]> {
  const unique = [...new Set(urls)].slice(0, MAX_USER_PROVIDED_URLS)
  const results: PageFetchOutcome[] = []
  for (const url of unique) {
    results.push(await fetchUserProvidedPage(url))
  }
  return results
}

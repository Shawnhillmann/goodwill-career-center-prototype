const FETCH_TIMEOUT_MS = 10_000
const MAX_BYTES = 512_000
const MAX_TEXT_CHARS = 14_000
const MAX_REDIRECTS = 3

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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function htmlToPlainText(html: string): string {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  const titleMatch = s.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = decodeHtmlEntities(
    titleMatch?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? '',
  )
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  s = decodeHtmlEntities(s)
  if (title && !s.toLowerCase().startsWith(title.toLowerCase())) {
    s = title ? `${ title }\n\n${ s }` : s
  }
  return s.slice(0, MAX_TEXT_CHARS)
}

export type PageFetchOutcome = {
  url: string
  ok: boolean
  statusCode?: number
  title?: string
  text?: string
  error?: string
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
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (compatible; GoodwillAICareerCenter/1.0; +https://goodwill.org; user-provided-link-review)',
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
    const text = contentType.includes('html') ? htmlToPlainText(raw) : raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_CHARS)

    if (!text || text.length < 40) {
      return {
        url: url.toString(),
        ok: false,
        statusCode: response.status,
        error:
          'Could not extract readable text from this page (common on job boards like Indeed). Suggest an employer direct link or pasted job description.',
      }
    }

    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = decodeHtmlEntities(
      titleMatch?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? '',
    )

    return {
      url: url.toString(),
      ok: true,
      statusCode: response.status,
      title,
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

import { formatSmartRecruitersPosting, parseSmartRecruitersJobUrl } from './pageContentExtract.js'

const API_TIMEOUT_MS = 8_000

const BROWSER_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS })
    if (!response.ok) return null
    return (await response.json()) as Record<string, unknown>
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchSmartRecruitersJobText(url: URL): Promise<string | null> {
  const parsed = parseSmartRecruitersJobUrl(url)
  if (!parsed) return null

  const apiUrl = `https://api.smartrecruiters.com/v1/companies/${ encodeURIComponent(parsed.company) }/postings/${ encodeURIComponent(parsed.postingId) }`
  const data = await fetchJson(apiUrl)
  if (!data) return null
  const text = formatSmartRecruitersPosting(data)
  return text.length >= 80 ? text : null
}

export function parseAppleJobUrl(url: URL): { positionId: string } | null {
  const m = url.pathname.match(/\/details\/(\d+)/i)
  if (!m?.[1] || !url.hostname.toLowerCase().includes('jobs.apple.com')) return null
  return { positionId: m[1] }
}

export function parseGreenhouseJobUrl(url: URL): { board: string; jobId: string } | null {
  const m = url.pathname.match(/\/([^/]+)\/jobs\/(\d+)/i)
  if (!m?.[1] || !m?.[2]) return null
  if (!url.hostname.toLowerCase().includes('greenhouse.io')) return null
  return { board: m[1], jobId: m[2] }
}

export function parseLeverJobUrl(url: URL): { company: string; jobId: string } | null {
  const m = url.pathname.match(/\/([^/]+)\/([a-f0-9-]{36})/i)
  if (!m?.[1] || !m?.[2]) return null
  if (!url.hostname.toLowerCase().includes('lever.co')) return null
  return { company: m[1], jobId: m[2] }
}

export async function fetchGreenhouseJobText(url: URL): Promise<string | null> {
  const parsed = parseGreenhouseJobUrl(url)
  if (!parsed) return null
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${ encodeURIComponent(parsed.board) }/jobs/${ encodeURIComponent(parsed.jobId) }`
  const data = await fetchJson(apiUrl)
  if (!data) return null
  const parts: string[] = []
  if (typeof data.title === 'string') parts.push(`Title: ${ data.title }`)
  if (typeof data.content === 'string') parts.push(`Description:\n${ data.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }`)
  const text = parts.join('\n\n')
  return text.length >= 80 ? text : null
}

export async function fetchLeverJobText(url: URL): Promise<string | null> {
  const parsed = parseLeverJobUrl(url)
  if (!parsed) return null
  const apiUrl = `https://api.lever.co/v0/postings/${ encodeURIComponent(parsed.company) }/${ encodeURIComponent(parsed.jobId) }`
  const data = await fetchJson(apiUrl)
  if (!data) return null
  const parts: string[] = []
  if (typeof data.text === 'string') parts.push(`Title: ${ data.text }`)
  const lists = data.lists as Array<{ text?: string; content?: string }> | undefined
  if (Array.isArray(lists)) {
    for (const block of lists) {
      const label = block.text ?? 'Section'
      const body = typeof block.content === 'string' ? block.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''
      if (body.length >= 30) parts.push(`${ label }:\n${ body }`)
    }
  }
  if (typeof data.description === 'string') parts.push(`Description:\n${ data.description }`)
  const text = parts.join('\n\n')
  return text.length >= 80 ? text : null
}

/** Try known job-board APIs for a URL (no headless browser). */
export async function fetchKnownJobBoardText(url: URL): Promise<{ text: string; resolver: string } | null> {
  const resolvers: Array<{ name: string; run: () => Promise<string | null> }> = [
    { name: 'smartrecruiters', run: () => fetchSmartRecruitersJobText(url) },
    { name: 'greenhouse', run: () => fetchGreenhouseJobText(url) },
    { name: 'lever', run: () => fetchLeverJobText(url) },
  ]

  for (const { name, run } of resolvers) {
    const text = await run()
    if (text) return { text, resolver: name }
  }
  return null
}

import { formatSmartRecruitersPosting, parseSmartRecruitersJobUrl } from './pageContentExtract.js'
import type { NormalizedJobPosting } from './extractionTypes.js'
import { normalizedJobToText } from './structuredJobExtract.js'

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchSmartRecruitersJobText(url: URL): Promise<string | null> {
  const posting = await fetchSmartRecruitersPosting(url)
  return posting ? normalizedJobToText(posting) : null
}

export async function fetchSmartRecruitersPosting(url: URL): Promise<NormalizedJobPosting | null> {
  const parsed = parseSmartRecruitersJobUrl(url)
  if (!parsed) return null

  const apiUrl = `https://api.smartrecruiters.com/v1/companies/${ encodeURIComponent(parsed.company) }/postings/${ encodeURIComponent(parsed.postingId) }`
  const data = await fetchJson(apiUrl)
  if (!data) return null

  const text = formatSmartRecruitersPosting(data)
  if (text.length < 80) return null

  const name = typeof data.name === 'string' ? data.name : undefined
  const location = data.location as Record<string, unknown> | undefined
  const locParts = location
    ? [location.city, location.region, location.country].filter((x) => typeof x === 'string')
    : []

  const jobAd = data.jobAd as Record<string, unknown> | undefined
  const description =
    typeof (jobAd?.jobDescription as Record<string, unknown> | undefined)?.text === 'string'
      ? stripHtml((jobAd!.jobDescription as Record<string, unknown>).text as string)
      : undefined
  const qualifications =
    typeof (jobAd?.qualifications as Record<string, unknown> | undefined)?.text === 'string'
      ? [stripHtml((jobAd!.qualifications as Record<string, unknown>).text as string)]
      : undefined

  const job: NormalizedJobPosting = {
    title: name,
    company: parsed.company,
    location: locParts.length ? locParts.join(', ') : undefined,
    employmentType: typeof data.typeOfEmployment === 'string' ? data.typeOfEmployment : undefined,
    description,
    qualifications,
    source: 'platform-adapter',
  }
  job.rawText = normalizedJobToText(job) || text
  return job.rawText.length >= 80 ? job : null
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

export function parseAshbyJobUrl(url: URL): { board: string; jobId: string } | null {
  const m = url.pathname.match(/\/([^/]+)\/([a-f0-9-]{36})/i)
  if (!m?.[1] || !m?.[2]) return null
  if (!url.hostname.toLowerCase().includes('ashbyhq.com')) return null
  return { board: m[1], jobId: m[2] }
}

export async function fetchGreenhousePosting(url: URL): Promise<NormalizedJobPosting | null> {
  const parsed = parseGreenhouseJobUrl(url)
  if (!parsed) return null
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${ encodeURIComponent(parsed.board) }/jobs/${ encodeURIComponent(parsed.jobId) }`
  const data = await fetchJson(apiUrl)
  if (!data) return null

  const title = typeof data.title === 'string' ? data.title : undefined
  const description = typeof data.content === 'string' ? stripHtml(data.content) : undefined
  if (!title && !description) return null

  const text = normalizedJobToText({ title, description, source: 'platform-adapter' })
  return {
    title,
    company: parsed.board,
    description,
    rawText: text,
    source: 'platform-adapter',
  }
}

export async function fetchLeverPosting(url: URL): Promise<NormalizedJobPosting | null> {
  const parsed = parseLeverJobUrl(url)
  if (!parsed) return null
  const apiUrl = `https://api.lever.co/v0/postings/${ encodeURIComponent(parsed.company) }/${ encodeURIComponent(parsed.jobId) }`
  const data = await fetchJson(apiUrl)
  if (!data) return null

  const title = typeof data.text === 'string' ? data.text : undefined
  const qualifications: string[] = []
  const lists = data.lists as Array<{ text?: string; content?: string }> | undefined
  if (Array.isArray(lists)) {
    for (const block of lists) {
      const body = typeof block.content === 'string' ? stripHtml(block.content) : ''
      if (body.length >= 30) qualifications.push(`${ block.text ?? 'Section' }:\n${ body }`)
    }
  }
  const description = typeof data.description === 'string' ? data.description : undefined

  const job: NormalizedJobPosting = {
    title,
    company: parsed.company,
    description,
    qualifications: qualifications.length ? qualifications : undefined,
    source: 'platform-adapter',
  }
  job.rawText = normalizedJobToText(job)
  return job.rawText.length >= 80 ? job : null
}

export async function fetchAshbyPosting(url: URL): Promise<NormalizedJobPosting | null> {
  const parsed = parseAshbyJobUrl(url)
  if (!parsed) return null
  const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${ encodeURIComponent(parsed.board) }`
  const data = await fetchJson(apiUrl)
  if (!data || !Array.isArray(data.jobs)) return null

  const match = (data.jobs as Record<string, unknown>[]).find((j) => j.id === parsed.jobId)
  if (!match) return null

  const title = typeof match.title === 'string' ? match.title : undefined
  const description =
    typeof match.descriptionPlain === 'string'
      ? match.descriptionPlain
      : typeof match.description === 'string'
        ? stripHtml(match.description)
        : undefined
  const location =
    typeof match.location === 'string'
      ? match.location
      : match.location && typeof match.location === 'object' && typeof (match.location as Record<string, unknown>).name === 'string'
        ? ((match.location as Record<string, unknown>).name as string)
        : undefined

  const job: NormalizedJobPosting = {
    title,
    company: parsed.board,
    location,
    description,
    employmentType: typeof match.employmentType === 'string' ? match.employmentType : undefined,
    source: 'platform-adapter',
  }
  job.rawText = normalizedJobToText(job)
  return job.rawText.length >= 80 ? job : null
}

export async function fetchGreenhouseJobText(url: URL): Promise<string | null> {
  const job = await fetchGreenhousePosting(url)
  return job?.rawText ?? null
}

export async function fetchLeverJobText(url: URL): Promise<string | null> {
  const job = await fetchLeverPosting(url)
  return job?.rawText ?? null
}

export type JobBoardFetchResult = {
  text: string
  resolver: string
  job: NormalizedJobPosting
}

/** Try known job-board public APIs for a URL. */
export async function fetchKnownJobBoardPosting(url: URL): Promise<JobBoardFetchResult | null> {
  const resolvers: Array<{ name: string; run: () => Promise<NormalizedJobPosting | null> }> = [
    { name: 'smartrecruiters', run: () => fetchSmartRecruitersPosting(url) },
    { name: 'greenhouse', run: () => fetchGreenhousePosting(url) },
    { name: 'lever', run: () => fetchLeverPosting(url) },
    { name: 'ashby', run: () => fetchAshbyPosting(url) },
  ]

  for (const { name, run } of resolvers) {
    const job = await run()
    if (job?.rawText && job.rawText.length >= 80) {
      return { text: job.rawText, resolver: name, job }
    }
    const text = job ? normalizedJobToText(job) : ''
    if (text.length >= 80) {
      job!.rawText = text
      return { text, resolver: name, job: job! }
    }
  }
  return null
}

/** @deprecated Use fetchKnownJobBoardPosting */
export async function fetchKnownJobBoardText(url: URL): Promise<{ text: string; resolver: string } | null> {
  const result = await fetchKnownJobBoardPosting(url)
  if (!result) return null
  return { text: result.text, resolver: result.resolver }
}

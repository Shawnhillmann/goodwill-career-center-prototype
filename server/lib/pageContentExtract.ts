const MAX_TEXT_CHARS = 14_000

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

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function stripHtmlTags(fragment: string): string {
  return decodeHtmlEntities(normalizeWhitespace(fragment.replace(/<[^>]+>/g, ' ')))
}

export function extractHtmlTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return titleMatch ? stripHtmlTags(titleMatch[1]) : ''
}

/** Plain text from visible HTML after removing script/style. */
export function htmlToPlainText(html: string): string {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  const title = extractHtmlTitle(html)
  s = s.replace(/<[^>]+>/g, ' ')
  s = normalizeWhitespace(decodeHtmlEntities(s))
  if (title && !s.toLowerCase().startsWith(title.toLowerCase())) {
    s = title ? `${ title }\n\n${ s }` : s
  }
  return s.slice(0, MAX_TEXT_CHARS)
}

const CONFIG_HEAVY_RE =
  /\b(webpack|chunk|__typename|application\/json|function\s*\(|=>\s*\{|var\s+[a-z0-9_$]+\s*=|window\.|document\.|stylesheet|polyfill)\b/i

const JOB_SIGNAL_RE =
  /\b(responsibilit|qualificat|requirement|experience|description|apply|salary|benefit|position|role|duties|skills|education|location|full[- ]?time|part[- ]?time)\b/i

/** True when extracted text looks like JS bundles/config, not a readable page. */
export function isLowQualityPageText(text: string, title = ''): boolean {
  const sample = text.slice(0, 4000)
  if (sample.length < 80) return true

  const configHits = (sample.match(CONFIG_HEAVY_RE) ?? []).length
  const jobHits = (sample.match(JOB_SIGNAL_RE) ?? []).length
  const braceRatio = (sample.match(/[{}[\]]/g) ?? []).length / Math.max(sample.length, 1)

  if (jobHits >= 2 && configHits <= 4) return false
  if (title && JOB_SIGNAL_RE.test(title) && jobHits >= 1 && configHits <= 6) return false

  if (configHits >= 5 && jobHits === 0) return true
  if (braceRatio > 0.04 && jobHits < 2) return true
  if (/^[\s\w.:-]*\{/.test(sample) && jobHits === 0) return true

  return false
}

function truncate(text: string): string {
  return text.length <= MAX_TEXT_CHARS ? text : `${ text.slice(0, MAX_TEXT_CHARS) }…`
}

function collectStrings(value: unknown, keys: Set<string>, out: string[], depth = 0): void {
  if (depth > 12 || out.length > 40) return
  if (typeof value === 'string') {
    const t = normalizeWhitespace(value)
    if (t.length >= 40) out.push(t)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, keys, out, depth + 1)
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (keys.has(k.toLowerCase())) {
        collectStrings(v, keys, out, depth + 1)
      } else if (typeof v === 'object') {
        collectStrings(v, keys, out, depth + 1)
      }
    }
  }
}

const JOB_JSON_KEYS = new Set(
  [
    'description',
    'jobdescription',
    'job_description',
    'postingdescription',
    'requisitiondescription',
    'responsibilities',
    'qualifications',
    'requirements',
    'summary',
    'about',
    'overview',
    'duties',
    'skills',
    'education',
    'experience',
    'benefits',
    'title',
    'jobtitle',
    'name',
    'location',
    'department',
  ].map((k) => k.toLowerCase()),
)

function formatJobPostingLd(item: Record<string, unknown>): string {
  const parts: string[] = []
  const title = typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : ''
  if (title) parts.push(`Title: ${ title }`)

  const description = typeof item.description === 'string' ? stripHtmlTags(item.description) : ''
  if (description) parts.push(`Description:\n${ description }`)

  const location = item.jobLocation
  if (location && typeof location === 'object') {
    const loc = location as Record<string, unknown>
    const address = loc.address as Record<string, unknown> | undefined
    if (address) {
      const city = [address.addressLocality, address.addressRegion, address.addressCountry]
        .filter(Boolean)
        .join(', ')
      if (city) parts.push(`Location: ${ city }`)
    }
  }

  if (typeof item.employmentType === 'string') parts.push(`Employment type: ${ item.employmentType }`)
  if (typeof item.datePosted === 'string') parts.push(`Posted: ${ item.datePosted }`)

  return parts.join('\n\n')
}

function extractJsonLd(html: string): string[] {
  const blocks: string[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const raw = match[1]?.trim()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as unknown
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        if (!item || typeof item !== 'object') continue
        const obj = item as Record<string, unknown>
        const type = String(obj['@type'] ?? '')
        if (/jobposting/i.test(type)) {
          const formatted = formatJobPostingLd(obj)
          if (formatted.length > 60) blocks.push(formatted)
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return blocks
}

function extractScriptJsonBlobs(html: string): string[] {
  const blobs: string[] = []
  const patterns = [
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
    /<script[^>]*>[\s\S]*?window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});[\s\S]*?<\/script>/i,
    /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ]

  for (const pattern of patterns) {
    if (pattern.global) {
      let m: RegExpExecArray | null
      while ((m = pattern.exec(html)) !== null) {
        const raw = m[1]?.trim()
        if (raw && raw.startsWith('{')) blobs.push(raw)
      }
    } else {
      const m = html.match(pattern)
      if (m?.[1]?.trim().startsWith('{')) blobs.push(m[1].trim())
    }
  }

  const texts: string[] = []
  for (const blob of blobs) {
    try {
      const parsed = JSON.parse(blob) as unknown
      const collected: string[] = []
      collectStrings(parsed, JOB_JSON_KEYS, collected)
      const merged = [...new Set(collected)]
        .filter((t) => t.length >= 50 && JOB_SIGNAL_RE.test(t))
        .join('\n\n')
      if (merged.length > 80) texts.push(merged)
    } catch {
      // ignore
    }
  }
  return texts
}

function extractMetaDescription(html: string): string {
  const patterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    /<meta[^>]+property=["']twitter:description["'][^>]+content=["']([^"']+)["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) {
      const text = stripHtmlTags(m[1])
      if (text.length >= 40) return text
    }
  }
  return ''
}

export type HtmlExtractResult = {
  title: string
  text: string
  source: 'html' | 'structured' | 'meta'
}

/** Best-effort readable text from raw HTML (SPA-safe). */
export function extractReadableContentFromHtml(html: string): HtmlExtractResult {
  const title = extractHtmlTitle(html)
  const plain = htmlToPlainText(html)
  const structured = [...extractJsonLd(html), ...extractScriptJsonBlobs(html)]
  const meta = extractMetaDescription(html)

  if (!isLowQualityPageText(plain, title)) {
    return { title, text: truncate(plain), source: 'html' }
  }

  if (structured.length) {
    const text = truncate(structured.join('\n\n---\n\n'))
    return { title, text, source: 'structured' }
  }

  if (meta && !isLowQualityPageText(meta, title)) {
    const text = truncate(title ? `${ title }\n\n${ meta }` : meta)
    return { title, text, source: 'meta' }
  }

  if (plain.length >= 40) {
    return { title, text: truncate(plain), source: 'html' }
  }

  return { title, text: '', source: 'html' }
}

export function formatSmartRecruitersPosting(data: Record<string, unknown>): string {
  const parts: string[] = []
  const name = typeof data.name === 'string' ? data.name : ''
  if (name) parts.push(`Title: ${ name }`)

  const location = data.location as Record<string, unknown> | undefined
  if (location) {
    const locParts = [location.city, location.region, location.country].filter((x) => typeof x === 'string')
    if (locParts.length) parts.push(`Location: ${ locParts.join(', ') }`)
  }

  const department = data.department as Record<string, unknown> | undefined
  if (department && typeof department.label === 'string') {
    parts.push(`Department: ${ department.label }`)
  }

  const jobAd = data.jobAd as Record<string, unknown> | undefined
  if (jobAd && typeof jobAd === 'object') {
    const sectionLabels: Record<string, string> = {
      jobDescription: 'Job description',
      qualifications: 'Qualifications',
      additionalInformation: 'Additional information',
      companyDescription: 'Company description',
    }
    for (const [key, label] of Object.entries(sectionLabels)) {
      const section = jobAd[key] as Record<string, unknown> | undefined
      const text =
        typeof section?.text === 'string'
          ? stripHtmlTags(section.text)
          : typeof section === 'string'
            ? stripHtmlTags(section)
            : ''
      if (text.length >= 20) parts.push(`${ label }:\n${ text }`)
    }
  }

  if (typeof data.refNumber === 'string') parts.push(`Reference: ${ data.refNumber }`)
  if (typeof data.typeOfEmployment === 'string') parts.push(`Employment: ${ data.typeOfEmployment }`)

  return parts.join('\n\n')
}

/** Parse SmartRecruiters-style career URLs (e.g. explore.jobs.netflix.com/careers/job/123). */
export function parseSmartRecruitersJobUrl(url: URL): { company: string; postingId: string } | null {
  const m = url.pathname.match(/\/careers\/job\/(\d+)/i)
  if (!m?.[1]) return null

  const host = url.hostname.toLowerCase()
  if (!host.includes('jobs')) return null

  const parts = host.split('.')
  const brandIndex = parts[0] === 'explore' && parts[1] === 'jobs' ? 2 : parts[0] === 'jobs' ? 1 : -1
  if (brandIndex < 0 || !parts[brandIndex]) return null

  const brand = parts[brandIndex]
  const company = brand.charAt(0).toUpperCase() + brand.slice(1)
  return { company, postingId: m[1] }
}

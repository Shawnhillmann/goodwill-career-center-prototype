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

const CHROME_BOILERPLATE_RE =
  /\b(cookie policy|privacy notice|terms of use|sign in|all rights reserved|equal opportunity|accessibility|©\s*\d{4}|navigation|site map|footer)\b/gi

const BOILERPLATE_TAG_RE = /<(header|footer|nav|aside)\b[^>]*>[\s\S]*?<\/\1>/gi

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

/** True when visible text is mostly site chrome (nav, legal, footer) vs primary body. */
export function isChromeHeavyText(text: string, title = ''): boolean {
  if (isLowQualityPageText(text, title)) return true
  const sample = text.slice(0, 6000)
  const chromeHits = (sample.match(CHROME_BOILERPLATE_RE) ?? []).length
  const jobHits = (sample.match(JOB_SIGNAL_RE) ?? []).length
  const afterTitle = title ? sample.slice(sample.toLowerCase().indexOf(title.toLowerCase()) + title.length) : sample
  const bodyJobHits = (afterTitle.match(JOB_SIGNAL_RE) ?? []).length

  if (jobHits >= 4 && bodyJobHits >= 2) return false
  if (chromeHits >= 6 && bodyJobHits < 2) return true
  if (sample.length > 2500 && chromeHits >= 4 && jobHits < 3) return true
  return false
}

export function stripBoilerplateHtml(html: string): string {
  let s = html
  s = s.replace(BOILERPLATE_TAG_RE, ' ')
  s = s.replace(/<[^>]+role=["'](?:navigation|banner|contentinfo|complementary)["'][^>]*>[\s\S]*?<\/[^>]+>/gi, ' ')
  return s
}

function countHeadings(text: string): number {
  return (text.match(/\b(description|summary|qualifications|requirements|responsibilities|about the role|job description)\b/gi) ?? [])
    .length
}

function countParagraphs(text: string): number {
  return text.split(/\n{2,}/).filter((p) => p.trim().length >= 60).length
}

/** Extract text from main/article-like regions before falling back to full-document noise. */
export function extractMainContentText(html: string): string {
  const stripped = stripBoilerplateHtml(html)
  const candidates: string[] = []

  const mainPatterns = [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]+(?:id|class)=["'][^"']*(?:job[-_]?description|posting[-_]?content|role[-_]?detail|content-main)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ]

  for (const pattern of mainPatterns) {
    const m = stripped.match(pattern)
    if (m?.[1]) {
      const t = htmlToPlainText(m[1])
      if (t.length >= 120) candidates.push(t)
    }
  }

  const plain = htmlToPlainText(stripped)
  if (plain.length >= 120) candidates.push(plain)

  return candidates.sort((a, b) => b.length - a.length)[0] ?? ''
}

function extractEscapedJsonParseLiteral(html: string, marker: string): unknown | null {
  const markerIndex = html.indexOf(marker)
  if (markerIndex < 0) return null

  const parseIndex = html.indexOf('JSON.parse("', markerIndex)
  if (parseIndex < 0) return null

  let i = parseIndex + 'JSON.parse("'.length
  let raw = ''
  while (i < html.length) {
    const ch = html[i]
    if (ch === '\\') {
      raw += ch + (html[i + 1] ?? '')
      i += 2
      continue
    }
    if (ch === '"') break
    raw += ch
    i++
  }

  if (!raw) return null
  try {
    const unescaped = JSON.parse(`"${raw}"`)
    return typeof unescaped === 'string' ? JSON.parse(unescaped) : unescaped
  } catch {
    return null
  }
}

function findJobRecords(value: unknown, out: Record<string, unknown>[], depth = 0): void {
  if (depth > 18 || out.length >= 6) return
  if (!value || typeof value !== 'object') return

  if (!Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const hasTitle =
      typeof record.postingTitle === 'string' ||
      typeof record.title === 'string' ||
      typeof record.name === 'string'
    const hasBody =
      typeof record.jobSummary === 'string' ||
      typeof record.description === 'string' ||
      typeof record.jobDescription === 'string' ||
      typeof record.summary === 'string'
    if (hasTitle && hasBody) out.push(record)
  }

  const children = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>)
  for (const child of children) findJobRecords(child, out, depth + 1)
}

export function formatJobRecord(record: Record<string, unknown>): string {
  const parts: string[] = []

  const title =
    (typeof record.postingTitle === 'string' && record.postingTitle) ||
    (typeof record.title === 'string' && record.title) ||
    (typeof record.name === 'string' && record.name) ||
    ''
  if (title) parts.push(`Title: ${ title }`)

  const summaryFields: Array<[string, string]> = [
    ['jobSummary', 'Summary'],
    ['summary', 'Summary'],
    ['description', 'Description'],
    ['jobDescription', 'Job description'],
  ]
  for (const [key, label] of summaryFields) {
    const val = record[key]
    if (typeof val === 'string' && val.length >= 20) {
      parts.push(`${ label }:\n${ stripHtmlTags(val) }`)
    }
  }

  const qualFields: Array<[string, string]> = [
    ['minimumQualifications', 'Minimum qualifications'],
    ['preferredQualifications', 'Preferred qualifications'],
    ['qualifications', 'Qualifications'],
    ['requirements', 'Requirements'],
  ]
  for (const [key, label] of qualFields) {
    const val = record[key]
    if (typeof val === 'string' && val.length >= 20) {
      parts.push(`${ label }:\n${ stripHtmlTags(val) }`)
    }
  }

  const locations = record.locations
  if (Array.isArray(locations) && locations.length) {
    const names = locations
      .map((loc) => {
        if (!loc || typeof loc !== 'object') return ''
        const o = loc as Record<string, unknown>
        return [o.city, o.state, o.country, o.name].filter((x) => typeof x === 'string').join(', ')
      })
      .filter(Boolean)
    if (names.length) parts.push(`Location: ${ names.join('; ') }`)
  }

  if (typeof record.teamNames === 'object' && Array.isArray(record.teamNames) && record.teamNames.length) {
    parts.push(`Team: ${ record.teamNames.filter((t) => typeof t === 'string').join(', ') }`)
  }

  return parts.join('\n\n')
}

function extractHydrationJobText(html: string): string[] {
  const markers = ['__staticRouterHydrationData', '__remixContext', '__NEXT_DATA__']
  const texts: string[] = []

  for (const marker of markers) {
    const data = extractEscapedJsonParseLiteral(html, marker)
    if (!data) continue
    const records: Record<string, unknown>[] = []
    findJobRecords(data, records)
    for (const record of records) {
      const formatted = formatJobRecord(record)
      if (formatted.length >= 80) texts.push(formatted)
    }
  }

  const nextScript = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (nextScript?.[1]) {
    try {
      const data = JSON.parse(nextScript[1].trim()) as unknown
      const records: Record<string, unknown>[] = []
      findJobRecords(data, records)
      for (const record of records) {
        const formatted = formatJobRecord(record)
        if (formatted.length >= 80) texts.push(formatted)
      }
    } catch {
      // ignore
    }
  }

  return texts
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

export type ExtractionMetrics = {
  rawHtmlLength: number
  plainTextLength: number
  mainContentLength: number
  structuredBlockCount: number
  headingCount: number
  paragraphCount: number
  chromeHeavy: boolean
  lowQuality: boolean
}

/** Best-effort readable text from raw HTML (SPA-safe). */
export function extractReadableContentFromHtml(html: string): HtmlExtractResult {
  const metrics = analyzeExtractionMetrics(html)
  const title = extractHtmlTitle(html)

  const structured = [
    ...extractHydrationJobText(html),
    ...extractJsonLd(html),
    ...extractScriptJsonBlobs(html),
  ].filter((block, index, arr) => block.length >= 80 && arr.indexOf(block) === index)

  if (structured.length) {
    const best = structured.sort((a, b) => b.length - a.length)[0]
    return { title, text: truncate(best), source: 'structured' }
  }

  const main = extractMainContentText(html)
  if (main.length >= 200 && !metrics.chromeHeavy) {
    return { title, text: truncate(main), source: 'html' }
  }

  const plain = htmlToPlainText(stripBoilerplateHtml(html))
  if (plain.length >= 200 && !metrics.chromeHeavy && !metrics.lowQuality) {
    return { title, text: truncate(plain), source: 'html' }
  }

  const meta = extractMetaDescription(html)
  if (meta && !isChromeHeavyText(meta, title)) {
    const text = truncate(title ? `${ title }\n\n${ meta }` : meta)
    return { title, text, source: 'meta' }
  }

  if (plain.length >= 40) {
    return { title, text: truncate(plain), source: 'html' }
  }

  return { title, text: '', source: 'html' }
}

export function analyzeExtractionMetrics(html: string): ExtractionMetrics {
  const title = extractHtmlTitle(html)
  const plain = htmlToPlainText(html)
  const main = extractMainContentText(html)
  const structuredCount =
    extractHydrationJobText(html).length + extractJsonLd(html).length + extractScriptJsonBlobs(html).length

  return {
    rawHtmlLength: html.length,
    plainTextLength: plain.length,
    mainContentLength: main.length,
    structuredBlockCount: structuredCount,
    headingCount: countHeadings(plain),
    paragraphCount: countParagraphs(plain),
    chromeHeavy: isChromeHeavyText(plain, title),
    lowQuality: isLowQualityPageText(plain, title),
  }
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

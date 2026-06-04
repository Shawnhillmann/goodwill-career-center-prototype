import { collectEmbeddedJobRecords } from './pageContentExtract.js'
import type { NormalizedJobPosting } from './extractionTypes.js'

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function stripHtmlTags(fragment: string): string {
  return decodeHtmlEntities(fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function splitListField(value: string): string[] {
  const plain = decodeHtmlEntities(value.replace(/<[^>]+>/g, '\n'))
  return plain
    .split(/\n|•|·|(?:^|\n)\s*[-*]\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 12)
}

function salaryFromLd(item: Record<string, unknown>): string | undefined {
  const base = item.baseSalary
  if (!base || typeof base !== 'object') return undefined
  const o = base as Record<string, unknown>
  const value = o.value as Record<string, unknown> | undefined
  if (value && typeof value.minValue === 'number' && typeof value.maxValue === 'number') {
    return `${ value.minValue }–${ value.maxValue } ${ value.unitText ?? '' }`.trim()
  }
  if (typeof o.value === 'number') return String(o.value)
  return undefined
}

export function normalizeJobPostingFromJsonLd(item: Record<string, unknown>): NormalizedJobPosting | null {
  const type = String(item['@type'] ?? '')
  if (!/jobposting/i.test(type)) return null

  const title = typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : undefined
  const description =
    typeof item.description === 'string' ? stripHtmlTags(item.description) : undefined

  let company: string | undefined
  const org = item.hiringOrganization
  if (org && typeof org === 'object') {
    const o = org as Record<string, unknown>
    company = typeof o.name === 'string' ? o.name : undefined
  }

  let location: string | undefined
  const jobLocation = item.jobLocation
  if (jobLocation && typeof jobLocation === 'object') {
    const loc = jobLocation as Record<string, unknown>
    const address = loc.address as Record<string, unknown> | undefined
    if (address) {
      location = [address.addressLocality, address.addressRegion, address.addressCountry]
        .filter((x) => typeof x === 'string')
        .join(', ')
    }
  }

  const responsibilities =
    typeof item.responsibilities === 'string' ? splitListField(item.responsibilities) : undefined
  const qualifications =
    typeof item.qualifications === 'string'
      ? splitListField(item.qualifications)
      : typeof item.experienceRequirements === 'string'
        ? splitListField(item.experienceRequirements)
        : undefined
  const skills = typeof item.skills === 'string' ? splitListField(item.skills) : undefined

  if (!title && !description) return null

  return {
    title,
    company,
    location,
    employmentType: typeof item.employmentType === 'string' ? item.employmentType : undefined,
    salary: salaryFromLd(item),
    datePosted: typeof item.datePosted === 'string' ? item.datePosted : undefined,
    description,
    responsibilities,
    qualifications,
    skills,
    source: 'json-ld',
  }
}

export function normalizeJobRecord(record: Record<string, unknown>): NormalizedJobPosting | null {
  const title =
    (typeof record.postingTitle === 'string' && record.postingTitle) ||
    (typeof record.title === 'string' && record.title) ||
    (typeof record.name === 'string' && record.name) ||
    undefined

  const description =
    (typeof record.jobSummary === 'string' && stripHtmlTags(record.jobSummary)) ||
    (typeof record.summary === 'string' && stripHtmlTags(record.summary)) ||
    (typeof record.description === 'string' && stripHtmlTags(record.description)) ||
    (typeof record.jobDescription === 'string' && stripHtmlTags(record.jobDescription)) ||
    undefined

  const qualifications: string[] = []
  for (const key of ['minimumQualifications', 'preferredQualifications', 'qualifications', 'requirements']) {
    const val = record[key]
    if (typeof val === 'string' && val.length >= 20) qualifications.push(stripHtmlTags(val))
  }

  let location: string | undefined
  const locations = record.locations
  if (Array.isArray(locations) && locations.length) {
    const names = locations
      .map((loc) => {
        if (!loc || typeof loc !== 'object') return ''
        const o = loc as Record<string, unknown>
        return [o.city, o.state, o.country, o.name].filter((x) => typeof x === 'string').join(', ')
      })
      .filter(Boolean)
    if (names.length) location = names.join('; ')
  }

  if (!title && !description) return null

  return {
    title,
    company:
      typeof record.company === 'string'
        ? record.company
        : Array.isArray(record.teamNames)
          ? record.teamNames.filter((t) => typeof t === 'string').join(', ')
          : undefined,
    location,
    employmentType:
      typeof record.employmentType === 'string'
        ? record.employmentType
        : typeof record.typeOfEmployment === 'string'
          ? record.typeOfEmployment
          : undefined,
    description,
    qualifications: qualifications.length ? qualifications : undefined,
    source: 'embedded-json',
  }
}

export function normalizedJobToText(job: NormalizedJobPosting): string {
  const parts: string[] = []
  if (job.title) parts.push(`Title: ${ job.title }`)
  if (job.company) parts.push(`Company: ${ job.company }`)
  if (job.location) parts.push(`Location: ${ job.location }`)
  if (job.employmentType) parts.push(`Employment type: ${ job.employmentType }`)
  if (job.salary) parts.push(`Salary: ${ job.salary }`)
  if (job.datePosted) parts.push(`Posted: ${ job.datePosted }`)
  if (job.description) parts.push(`Description:\n${ job.description }`)
  if (job.responsibilities?.length) {
    parts.push(`Responsibilities:\n${ job.responsibilities.map((r) => `• ${ r }`).join('\n') }`)
  }
  if (job.qualifications?.length) {
    parts.push(`Qualifications:\n${ job.qualifications.map((q) => `• ${ q }`).join('\n') }`)
  }
  if (job.skills?.length) parts.push(`Skills:\n${ job.skills.map((s) => `• ${ s }`).join('\n') }`)
  if (job.benefits?.length) parts.push(`Benefits:\n${ job.benefits.map((b) => `• ${ b }`).join('\n') }`)
  const text = parts.join('\n\n')
  return text
}

export function extractJsonLdJobPostings(html: string): NormalizedJobPosting[] {
  const jobs: NormalizedJobPosting[] = []
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
        const normalized = normalizeJobPostingFromJsonLd(item as Record<string, unknown>)
        if (normalized) jobs.push(normalized)
        const graph = (item as Record<string, unknown>)['@graph']
        if (Array.isArray(graph)) {
          for (const g of graph) {
            if (g && typeof g === 'object') {
              const n = normalizeJobPostingFromJsonLd(g as Record<string, unknown>)
              if (n) jobs.push(n)
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }
  return jobs
}

export function extractEmbeddedJobPostings(html: string): NormalizedJobPosting[] {
  return collectEmbeddedJobRecords(html)
    .map((r) => normalizeJobRecord(r))
    .filter((j): j is NormalizedJobPosting => j !== null)
}

export function extractAllStructuredJobs(html: string): NormalizedJobPosting[] {
  const all = [...extractJsonLdJobPostings(html), ...extractEmbeddedJobPostings(html)]
  const seen = new Set<string>()
  return all.filter((j) => {
    const key = `${ j.title ?? '' }|${ (j.description ?? '').slice(0, 80) }`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function bestStructuredJob(html: string): NormalizedJobPosting | null {
  const jobs = extractAllStructuredJobs(html)
  if (!jobs.length) return null
  return jobs.sort((a, b) => normalizedJobToText(b).length - normalizedJobToText(a).length)[0]
}

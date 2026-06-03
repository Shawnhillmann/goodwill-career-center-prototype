export type ResumeEntry = {
  title: string
  meta?: string
  bullets: string[]
}

export type ResumeSection = {
  title: string
  paragraphs: string[]
  entries: ResumeEntry[]
  bullets: string[]
}

export type ResumeDocument = {
  name: string
  headline?: string
  contact?: string
  sections: ResumeSection[]
}

const SECTION_TITLES =
  /^(professional\s+summary|work\s+experience|experience|education|skills|certifications|projects|volunteer|awards)$/i

/** All-caps instructional preamble, not a candidate name or section. */
function isResumeMetaBanner(line: string): boolean {
  const t = line.trim()
  if (!t || t.length < 24) return false
  if (SECTION_TITLES.test(stripInlineMd(t))) return false
  if (/resume content only|no extra conversational|sample resume|final layout|professional sample/i.test(t)) {
    return true
  }
  return t === t.toUpperCase() && t.split(/\s+/).length >= 8 && /\b(RESUME|CONTENT|CONVERSATIONAL|SAMPLE|LAYOUT)\b/.test(t)
}

function stripInlineMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/, '')
    .trim()
}

export function cleanResumeOutput(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n').trim()
  text = text.replace(/^```[\w]*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  const junk =
    /^(sure|okay|ok|great|nice|here'?s|here is|below is|i'?ve|i have|you can|paste|let me|i'll|i will|updated your|one page|this version|i tightened|i've tightened)/i

  const metaIntro =
    /^(here'?s a |this is |resume content only|no extra conversational|professional sample|clean,? professional sample|final layout|software engineer so you can)/i

  const lines = text.split('\n')
  let start = 0
  while (start < lines.length) {
    const line = lines[start].trim()
    if (!line || junk.test(line) || metaIntro.test(line) || isResumeMetaBanner(line)) {
      start++
      continue
    }
    break
  }

  let end = lines.length - 1
  while (end >= start && (lines[end].trim() === '' || junk.test(lines[end].trim()))) end--

  return lines.slice(start, end + 1).join('\n').trim()
}

function normalizeSectionTitle(title: string): string {
  const t = stripInlineMd(title).toUpperCase().trim()
  if (t === 'EXPERIENCE') return 'WORK EXPERIENCE'
  return t
}

function isSectionHeader(line: string): boolean {
  const s = stripInlineMd(line).trim()
  if (!s) return false
  if (/^#{1,3}\s+/.test(line.trim())) return SECTION_TITLES.test(stripInlineMd(line))
  if (SECTION_TITLES.test(s)) return true
  return s === s.toUpperCase() && s.length >= 4 && s.length <= 48 && /[A-Z]/.test(s) && !/\|/.test(s)
}

function isContactLine(line: string): boolean {
  const s = line.trim()
  if (!s || isSectionHeader(line)) return false
  return (
    /@/.test(s) ||
    /\(\d{3}\)\s*\d{3}/.test(s) ||
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(s) ||
    /\b(linkedin|github)\.com\b/i.test(s) ||
    (/\|/.test(s) && /\b[A-Z]{2}\b/.test(s) && /\d{5}/.test(s))
  )
}

function isHeadlineLine(line: string): boolean {
  const s = stripInlineMd(line)
  if (!s || isSectionHeader(line) || isContactLine(line)) return false
  return !/^[-*•]/.test(line.trim())
}

function isEntryTitle(line: string, nextLine?: string): boolean {
  const s = stripInlineMd(line)
  if (!s || isSectionHeader(line)) return false
  if (/^[-*•]/.test(line.trim())) return false
  if (nextLine && /\|/.test(nextLine) && !/^[-*•]/.test(nextLine.trim())) return true
  if (/^#{2,3}\s+/.test(line.trim()) && !SECTION_TITLES.test(s)) return true
  return false
}

function isBullet(line: string): boolean {
  return /^\s*[-*•]\s+/.test(line)
}

function bulletText(line: string): string {
  return stripInlineMd(line.replace(/^\s*[-*•]\s+/, ''))
}

export function parseResumeMeta(meta: string): { left: string; right: string } {
  const parts = meta.split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    return {
      left: `${ parts[0] } | ${ parts[1] }`,
      right: parts.slice(2).join(' | '),
    }
  }
  if (parts.length === 2) {
    const rightDate = /\b(19|20)\d{2}\b|present|graduated/i.test(parts[1])
    return rightDate ? { left: parts[0], right: parts[1] } : { left: parts.join(' | '), right: '' }
  }
  return { left: meta, right: '' }
}

export function parseResumeDocument(raw: string): ResumeDocument | null {
  const text = cleanResumeOutput(raw)
  if (!text) return null

  const lines = text.split('\n')
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  if (i >= lines.length) return null

  const name = stripInlineMd(lines[i])
  if (!name || name.length < 2) return null
  i++

  let headline: string | undefined
  let contact: string | undefined
  const preSectionLines: string[] = []

  while (i < lines.length && !isSectionHeader(lines[i])) {
    const raw = lines[i].trim()
    if (raw) {
      const text = stripInlineMd(raw)
      if (isContactLine(raw) && !contact) contact = text
      else if (!headline && isHeadlineLine(raw)) headline = text
      else if (isContactLine(raw)) preSectionLines.push(text)
      else preSectionLines.push(text)
    }
    i++
  }

  const sections: ResumeSection[] = []
  let current: ResumeSection | null = null
  let pendingEntry: ResumeEntry | null = null

  const flushEntry = () => {
    if (pendingEntry && current) {
      current.entries.push(pendingEntry)
      pendingEntry = null
    }
  }

  const flushSection = () => {
    flushEntry()
    if (!current) return
    if (isSectionEmpty(current)) {
      current = null
      return
    }
    const existing = sections.find((s) => s.title === current!.title)
    if (existing) {
      mergeSection(existing, current)
      current = null
      return
    }
    sections.push(current)
    current = null
  }

  const openSection = (title: string) => {
    const normalized = normalizeSectionTitle(title)
    const existing = sections.find((s) => s.title === normalized)
    if (existing) {
      current = existing
      return
    }
    current = {
      title: normalized,
      paragraphs: [],
      entries: [],
      bullets: [],
    }
  }

  if (preSectionLines.length) {
    openSection('PROFESSIONAL SUMMARY')
    for (const line of preSectionLines) {
      if (isContactLine(line) && !contact) {
        contact = line
        continue
      }
      current!.paragraphs.push(line)
    }
  }

  for (; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    if (isSectionHeader(line)) {
      flushSection()
      openSection(stripInlineMd(line))
      continue
    }

    if (!current) continue
    const section: ResumeSection = current

    if (isBullet(line)) {
      const b = bulletText(line)
      if (pendingEntry) pendingEntry.bullets.push(b)
      else section.bullets.push(b)
      continue
    }

    const next = lines[i + 1]
    if (isEntryTitle(line, next)) {
      flushEntry()
      pendingEntry = { title: stripInlineMd(line), bullets: [] }
      continue
    }

    if (pendingEntry && !pendingEntry.meta && /\|/.test(line)) {
      pendingEntry.meta = stripInlineMd(line)
      continue
    }

    if (pendingEntry) flushEntry()

    section.paragraphs.push(stripInlineMd(line))
  }

  flushSection()

  const deduped = dedupeResumeSections(sections)
  if (!deduped.length && !headline && !contact) return null
  return { name, headline, contact, sections: deduped }
}

function isSectionEmpty(section: ResumeSection): boolean {
  return (
    section.paragraphs.length === 0 &&
    section.entries.length === 0 &&
    section.bullets.length === 0
  )
}

function mergeSection(target: ResumeSection, source: ResumeSection): void {
  target.paragraphs.push(...source.paragraphs)
  target.entries.push(...source.entries)
  target.bullets.push(...source.bullets)
}

function dedupeResumeSections(sections: ResumeSection[]): ResumeSection[] {
  const out: ResumeSection[] = []
  for (const section of sections) {
    if (isSectionEmpty(section)) continue
    const title = normalizeSectionTitle(section.title)
    const existing = out.find((s) => s.title === title)
    if (existing) mergeSection(existing, { ...section, title })
    else out.push({ ...section, title })
  }
  return out
}

function looksLikeResumeCandidateName(name: string): boolean {
  const n = name.trim()
  if (n.length < 3 || n.length > 72) return false
  if (/\?/.test(n)) return false
  if (
    /^(I\b|I'm|If you|Want |When |Here |Sure|Okay|Great|Good |The |You |We |Please|Note:|Tip:)/i.test(n)
  ) {
    return false
  }
  if (/\b(can't|cannot|won't|browse|paste|link|help you|job board|listings|platforms|keywords|filters)\b/i.test(n)) {
    return false
  }
  if (n.split(/\s+/).length > 8) return false
  return true
}

/** True only for structured resume/CV output — not coaching chat that mentions a section title. */
export function looksLikeResume(raw: string): boolean {
  const doc = parseResumeDocument(raw)
  if (!doc || !looksLikeResumeCandidateName(doc.name)) return false

  const titles = doc.sections.map((s) => s.title.toUpperCase())
  const hasWorkExperience = titles.some((t) => /WORK\s+EXPERIENCE|^EXPERIENCE$/.test(t))
  const hasEducation = titles.some((t) => t.includes('EDUCATION'))
  const hasSkills = titles.some((t) => t === 'SKILLS' || t.startsWith('SKILLS'))
  const experienceEntries = doc.sections
    .filter((s) => /EXPERIENCE/.test(s.title.toUpperCase()))
    .reduce((sum, s) => sum + s.entries.length, 0)

  if (experienceEntries >= 1) return true
  if (hasWorkExperience && (hasEducation || hasSkills)) return true
  if (hasEducation && doc.sections.some((s) => s.title.toUpperCase().includes('EDUCATION') && s.entries.length > 0)) {
    return true
  }

  const standardSections = titles.filter((t) => SECTION_TITLES.test(t) || /^(WORK\s+)?EXPERIENCE$/.test(t)).length
  if (standardSections >= 2 && experienceEntries > 0) return true

  // A lone PROFESSIONAL SUMMARY (or similar) with bullets is coaching, not a resume deliverable.
  return false
}

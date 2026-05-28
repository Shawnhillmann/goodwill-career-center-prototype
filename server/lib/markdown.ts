import { Paragraph, TextRun } from 'docx'

type InlineToken = { text: string; bold?: boolean; italics?: boolean }

function parseInline(md: string): InlineToken[] {
  // Minimal inline markdown: **bold**, *italic*, __bold__, _italic_
  const out: InlineToken[] = []
  let i = 0
  let bold = false
  let italics = false
  let buf = ''

  const flush = () => {
    if (!buf) return
    out.push({ text: buf, bold: bold || undefined, italics: italics || undefined })
    buf = ''
  }

  while (i < md.length) {
    const ch = md[i]
    const next = md[i + 1]

    if (ch === '*' && next === '*') {
      flush()
      bold = !bold
      i += 2
      continue
    }
    if (ch === '_' && next === '_') {
      flush()
      bold = !bold
      i += 2
      continue
    }
    if (ch === '*') {
      flush()
      italics = !italics
      i += 1
      continue
    }
    if (ch === '_') {
      flush()
      italics = !italics
      i += 1
      continue
    }

    buf += ch
    i += 1
  }

  flush()

  // If markdown markers were unbalanced, just return plain text
  const unbalanced = bold || italics
  if (unbalanced) return [{ text: md }]

  return out.length ? out : [{ text: md }]
}

export function markdownToDocxParagraphs(markdown: string): Paragraph[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const paragraphs: Paragraph[] = []

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (!line.trim()) {
      paragraphs.push(new Paragraph(''))
      continue
    }

    // Horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      paragraphs.push(new Paragraph(''))
      continue
    }

    // Headings (# ...)
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line.trim())
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: level === 1 ? 32 : level === 2 ? 28 : 24 })],
          spacing: { after: 180, before: 120 },
        }),
      )
      continue
    }

    // Bullets (-, *, •)
    const bulletMatch = /^(\s*)([-*•])\s+(.*)$/.exec(rawLine)
    if (bulletMatch) {
      const content = bulletMatch[3] ?? ''
      const runs = parseInline(content).map(
        (t) =>
          new TextRun({
            text: t.text,
            bold: t.bold,
            italics: t.italics,
            size: 22,
          }),
      )
      paragraphs.push(
        new Paragraph({
          children: runs.length ? runs : [new TextRun({ text: content, size: 22 })],
          bullet: { level: 0 },
        }),
      )
      continue
    }

    const runs = parseInline(line).map(
      (t) =>
        new TextRun({
          text: t.text,
          bold: t.bold,
          italics: t.italics,
          size: 22,
          font: 'Calibri',
        }),
    )

    paragraphs.push(
      new Paragraph({
        children: runs.length ? runs : [new TextRun({ text: line, size: 22, font: 'Calibri' })],
      }),
    )
  }

  return paragraphs
}

export function markdownToPlainText(markdown: string): string {
  // Remove common markdown markers so PDFs don't show asterisks.
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '• ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export function sanitizeDocumentMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')

  const isJunkLine = (line: string) => {
    const s = line.trim().toLowerCase()
    if (!s) return false
    return (
      s.startsWith('sure') ||
      s.startsWith("here's") ||
      s.startsWith('here is') ||
      s.startsWith('below is') ||
      s.startsWith('i can help') ||
      s.startsWith('feel free') ||
      s.includes('would you like help') ||
      s.includes('anything else i can help') ||
      s.includes('let me know if')
    )
  }

  // Trim leading junk/preamble
  let start = 0
  while (start < lines.length && (lines[start].trim() === '' || isJunkLine(lines[start]))) start++

  // Trim trailing junk/outro
  let end = lines.length - 1
  while (end >= start && (lines[end].trim() === '' || isJunkLine(lines[end]))) end--

  return lines.slice(start, end + 1).join('\n').trim()
}


import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from 'docx'
import PDFDocument from 'pdfkit'
import { parseResumeMeta, type ResumeDocument } from '../../shared/resumeParse.js'

export {
  parseResumeDocument,
  looksLikeResume,
  cleanResumeOutput,
  type ResumeDocument,
} from '../../shared/resumeParse.js'

const PAGE_MARGIN = 54
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2

type PdfDoc = InstanceType<typeof PDFDocument>

function drawSectionRule(doc: PdfDoc, y: number): number {
  doc
    .strokeColor('#333333')
    .lineWidth(0.75)
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, y)
    .stroke()
  return y + 10
}

export function renderResumePdf(doc: PdfDoc, resume: ResumeDocument): void {
  let y = PAGE_MARGIN

  const ensureSpace = (need: number) => {
    if (y + need > doc.page.height - PAGE_MARGIN) {
      doc.addPage()
      y = PAGE_MARGIN
    }
  }

  doc.font('Helvetica-Bold').fontSize(20)
  const nameH = doc.heightOfString(resume.name, { width: CONTENT_WIDTH, align: 'center' })
  ensureSpace(nameH + 8)
  doc.text(resume.name.toUpperCase(), PAGE_MARGIN, y, { width: CONTENT_WIDTH, align: 'center' })
  y += nameH + 6

  if (resume.headline) {
    doc.font('Helvetica-Bold').fontSize(11)
    const h = doc.heightOfString(resume.headline, { width: CONTENT_WIDTH, align: 'center' })
    ensureSpace(h + 4)
    doc.text(resume.headline, PAGE_MARGIN, y, { width: CONTENT_WIDTH, align: 'center' })
    y += h + 4
  }

  if (resume.contact) {
    doc.font('Helvetica').fontSize(10)
    const h = doc.heightOfString(resume.contact, { width: CONTENT_WIDTH, align: 'center' })
    ensureSpace(h + 10)
    doc.fillColor('#333333').text(resume.contact, PAGE_MARGIN, y, { width: CONTENT_WIDTH, align: 'center' })
    y += h + 12
    doc.fillColor('#000000')
  }

  for (const section of resume.sections) {
    ensureSpace(36)
    doc.font('Helvetica-Bold').fontSize(11)
    const sh = doc.heightOfString(section.title, { width: CONTENT_WIDTH })
    doc.text(section.title, PAGE_MARGIN, y, { width: CONTENT_WIDTH })
    y += sh + 4
    y = drawSectionRule(doc, y)

    for (const para of section.paragraphs) {
      doc.font('Helvetica').fontSize(10)
      const ph = doc.heightOfString(para, { width: CONTENT_WIDTH, lineGap: 2 })
      ensureSpace(ph + 6)
      doc.text(para, PAGE_MARGIN, y, { width: CONTENT_WIDTH, lineGap: 2 })
      y += ph + 8
    }

    for (const entry of section.entries) {
      ensureSpace(40)
      doc.font('Helvetica-Bold').fontSize(10.5)
      const th = doc.heightOfString(entry.title, { width: CONTENT_WIDTH })
      doc.text(entry.title, PAGE_MARGIN, y, { width: CONTENT_WIDTH })
      y += th + 2

      if (entry.meta) {
        const { left, right } = parseResumeMeta(entry.meta)
        doc.font('Helvetica').fontSize(10)
        if (right) {
          const lh = doc.heightOfString(left, { width: CONTENT_WIDTH * 0.62 })
          ensureSpace(lh + 4)
          doc.text(left, PAGE_MARGIN, y, { width: CONTENT_WIDTH * 0.62, lineBreak: false })
          doc.text(right, PAGE_MARGIN, y, { width: CONTENT_WIDTH, align: 'right' })
          y += lh + 4
        } else {
          const mh = doc.heightOfString(entry.meta, { width: CONTENT_WIDTH })
          doc.text(entry.meta, PAGE_MARGIN, y, { width: CONTENT_WIDTH })
          y += mh + 4
        }
      }

      for (const bullet of entry.bullets) {
        doc.font('Helvetica').fontSize(10)
        const bh = doc.heightOfString(`• ${ bullet }`, { width: CONTENT_WIDTH - 14, lineGap: 1 })
        ensureSpace(bh + 3)
        doc.text(`• ${ bullet }`, PAGE_MARGIN + 8, y, { width: CONTENT_WIDTH - 14, lineGap: 1 })
        y += bh + 3
      }
      y += 4
    }

    for (const bullet of section.bullets) {
      doc.font('Helvetica').fontSize(10)
      const bh = doc.heightOfString(`• ${ bullet }`, { width: CONTENT_WIDTH - 14, lineGap: 1 })
      ensureSpace(bh + 3)
      doc.text(`• ${ bullet }`, PAGE_MARGIN + 8, y, { width: CONTENT_WIDTH - 14, lineGap: 1 })
      y += bh + 3
    }
    y += 6
  }
}

export async function buildResumePdfBuffer(resume: ResumeDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
    })
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    renderResumePdf(doc, resume)
    doc.end()
  })
}

function sectionRuleParagraph(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333' } },
    spacing: { after: 140, before: 60 },
  })
}

function entryMetaParagraph(meta: string): Paragraph {
  const { left, right } = parseResumeMeta(meta)
  if (!right) {
    return new Paragraph({
      children: [new TextRun({ text: meta, size: 20, font: 'Calibri' })],
      spacing: { after: 80 },
    })
  }
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: `${ left }\t`, size: 20, font: 'Calibri' }),
      new TextRun({ text: right, size: 20, font: 'Calibri' }),
    ],
    spacing: { after: 80 },
  })
}

export function buildResumeDocx(resume: ResumeDocument): Document {
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: resume.name.toUpperCase(), bold: true, size: 36, font: 'Calibri' })],
      spacing: { after: 80 },
    }),
  )

  if (resume.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: resume.headline, bold: true, size: 22, font: 'Calibri' })],
        spacing: { after: 60 },
      }),
    )
  }

  if (resume.contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: resume.contact, size: 20, font: 'Calibri', color: '333333' })],
        spacing: { after: 200 },
      }),
    )
  }

  for (const section of resume.sections) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.title, bold: true, size: 22, font: 'Calibri' })],
        spacing: { before: 120 },
      }),
    )
    children.push(sectionRuleParagraph())

    for (const para of section.paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para, size: 20, font: 'Calibri' })],
          spacing: { after: 120 },
        }),
      )
    }

    for (const entry of section.entries) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: entry.title, bold: true, size: 21, font: 'Calibri' })],
          spacing: { before: 80, after: 40 },
        }),
      )
      if (entry.meta) children.push(entryMetaParagraph(entry.meta))
      for (const bullet of entry.bullets) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: bullet, size: 20, font: 'Calibri' })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          }),
        )
      }
    }

    for (const bullet of section.bullets) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: bullet, size: 20, font: 'Calibri' })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        }),
      )
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  })
}

export async function buildResumeDocxBuffer(resume: ResumeDocument): Promise<Buffer> {
  return Packer.toBuffer(buildResumeDocx(resume))
}

export function streamResumePdf(resume: ResumeDocument): PdfDoc {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
  })
  renderResumePdf(doc, resume)
  doc.end()
  return doc
}

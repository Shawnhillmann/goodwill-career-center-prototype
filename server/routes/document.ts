import express from 'express'
import { Document, Packer, Paragraph } from 'docx'
import PDFDocument from 'pdfkit'
import { markdownToDocxParagraphs, markdownToPlainText, sanitizeDocumentMarkdown } from '../lib/markdown.js'
import { sendError } from '../lib/errors.js'

type ResumeDocBody = {
  resumeText: string
  fileName?: string
}

type ExportBody = {
  content: string
  fileName?: string
  format: 'docx' | 'pdf'
}

function safeFileBase(name: string) {
  return name.replace(/[^a-z0-9_\-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'resume'
}

export const documentRouter = express.Router()

async function sendDocx(res: express.Response, opts: { fileBase: string; markdown: string }) {
  const fileName = opts.fileBase.endsWith('.docx') ? opts.fileBase : `${ opts.fileBase }.docx`
  const clean = sanitizeDocumentMarkdown(opts.markdown)
  const paragraphs = markdownToDocxParagraphs(clean)
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs.length ? paragraphs : [new Paragraph('')],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  res.setHeader('Content-Disposition', `attachment; filename="${ fileName }"`)
  res.send(buffer)
}

async function sendPdf(res: express.Response, opts: { fileBase: string; markdown: string }) {
  const fileName = opts.fileBase.endsWith('.pdf') ? opts.fileBase : `${ opts.fileBase }.pdf`
  const clean = sanitizeDocumentMarkdown(opts.markdown)
  const text = markdownToPlainText(clean)

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${ fileName }"`)

  doc.on('error', () => {
    // ignore streaming errors
  })

  doc.pipe(res)
  doc.font('Helvetica').fontSize(11)

  const lines = text.split('\n')
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      doc.moveDown(0.6)
      continue
    }

    // Basic section heading detection
    if (/^(objective|summary|experience|education|skills|projects|certifications|work experience)\b/i.test(line)) {
      doc.moveDown(0.2)
      doc.font('Helvetica-Bold').fontSize(12).text(line)
      doc.font('Helvetica').fontSize(11)
      continue
    }

    doc.text(line)
  }

  doc.end()
}

documentRouter.post('/export', async (req, res) => {
  const body = req.body as ExportBody
  if (!body || typeof body.content !== 'string' || !body.content.trim() || (body.format !== 'docx' && body.format !== 'pdf')) {
    return sendError(res, 400, 'Invalid request. Expected { content: string, format: \"docx\" | \"pdf\" }.')
  }

  const fileBase = safeFileBase(body.fileName ?? (body.format === 'pdf' ? 'document' : 'resume'))

  if (body.format === 'pdf') {
    return sendPdf(res, { fileBase, markdown: body.content })
  }
  return sendDocx(res, { fileBase, markdown: body.content })
})

documentRouter.post('/resume', async (req, res) => {
  const body = req.body as ResumeDocBody
  if (!body || typeof body.resumeText !== 'string' || !body.resumeText.trim()) {
    return sendError(res, 400, 'Invalid request. Expected { resumeText: string }.')
  }

  const fileBase = safeFileBase(body.fileName ?? 'resume')
  return sendDocx(res, { fileBase, markdown: body.resumeText })
})


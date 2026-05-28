import express from 'express'
import mammoth from 'mammoth'
import multer from 'multer'
import { sendError } from '../lib/errors'
import { extractPdfText } from '../lib/pdfText'

const MAX_FILE_BYTES = 5 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
})

function extOf(name: string) {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : ''
}

async function extractText(file: Express.Multer.File): Promise<string> {
  const ext = extOf(file.originalname)
  if (ext === 'txt') {
    return file.buffer.toString('utf8')
  }
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer })
    return result.value ?? ''
  }
  if (ext === 'pdf') {
    return extractPdfText(file.buffer)
  }
  throw new Error('Unsupported file type. Please upload a .docx, .pdf, or .txt file.')
}

export const uploadRouter = express.Router()

uploadRouter.post('/', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) {
    return sendError(res, 400, 'No file uploaded. Please choose a .docx, .pdf, or .txt file.')
  }

  try {
    const extractedText = (await extractText(file)).trim()
    if (!extractedText) {
      return sendError(res, 422, 'We could not read any text from that file. Try a different file or format.')
    }
    res.json({
      fileName: file.originalname,
      extractedText,
    })
  } catch (err: any) {
    return sendError(res, 400, err?.message ?? 'Unable to process that file.')
  }
})


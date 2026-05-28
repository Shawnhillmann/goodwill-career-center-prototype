/** Extract plain text from a PDF buffer (pdf-parse v2 API). */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // Lazy-load pdf parsing to avoid serverless startup crashes.
  // Some pdfjs-dist builds reference DOM APIs (e.g. DOMMatrix) that can break bundlers/runtime.
  let PDFParseCtor: any
  try {
    const mod: any = await import('pdf-parse')
    PDFParseCtor = mod?.PDFParse ?? mod?.default?.PDFParse ?? mod?.default ?? mod
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[upload] Failed to load pdf-parse:', err instanceof Error ? err.message : String(err))
    throw new Error('PDF parsing is temporarily unavailable. Please upload a .docx or .txt file instead.')
  }

  try {
    const parser = new PDFParseCtor({ data: buffer })
    const result = await parser.getText()
    await parser.destroy?.()
    return result?.text ?? ''
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.error('[upload] PDF parse failed:', message)
    if (/DOMMatrix is not defined/i.test(message)) {
      throw new Error('PDF parsing is temporarily unavailable. Please upload a .docx or .txt file instead.')
    }
    throw new Error('We could not read text from that PDF. Try exporting it as a text-based PDF or upload a .docx/.txt.')
  }
}

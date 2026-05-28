/**
 * Extract plain text from a PDF buffer.
 *
 * IMPORTANT: Must be Node/serverless safe.
 * We keep imports lazy to avoid serverless startup crashes.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse uses pdfjs-dist internally; polyfill DOMMatrix for serverless Node.
  // This avoids crashes like "DOMMatrix is not defined".
  if (!(globalThis as any).DOMMatrix) {
    try {
      const dm: any = await import('@thednp/dommatrix')
      ;(globalThis as any).DOMMatrix = dm?.DOMMatrix ?? dm?.default ?? dm
    } catch {
      // If the polyfill can't load, pdf-parse may still fail; we'll surface a friendly error below.
    }
  }

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
    const raw = String(result?.text ?? '')
    // pdf-parse adds page markers like "-- 1 of 3 --" even when no real text exists.
    const normalized = raw.replace(/[ \t]+\n/g, '\n').trim()
    const withoutMarkers = normalized.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '').trim()
    const meaningfulChars = (withoutMarkers.match(/[a-z0-9]/gi) ?? []).length
    // If we only have page markers or essentially no text, treat as scanned/image-only.
    if (!withoutMarkers || meaningfulChars < 5) {
      throw new Error('This PDF appears to be image-only. Please upload a text-based PDF, DOCX, or TXT file.')
    }
    return withoutMarkers
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.error('[upload] PDF parse failed:', msg)

    if (/password|encrypted|PasswordException/i.test(msg)) {
      throw new Error('This PDF is password-protected and can’t be read.')
    }
    if (/DOMMatrix is not defined/i.test(msg)) {
      throw new Error('PDF parsing is temporarily unavailable. Please try again, or upload a .docx or .txt file.')
    }
    if (/image-only|scanned/i.test(msg)) {
      throw new Error('This PDF appears to be image-only. Please upload a text-based PDF, DOCX, or TXT file.')
    }
    throw new Error('We could not read text from that PDF. Try exporting it as a text-based PDF, or upload a .docx/.txt.')
  }
}

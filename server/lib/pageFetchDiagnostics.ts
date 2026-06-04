import type { ExtractionResult } from './extractionTypes.js'

export type PageFetchDiagnostics = {
  url: string
  statusCode?: number
  rawHtmlBytes: number
  renderedDomNote: string
  extractionSource: string
  plainTextChars: number
  finalTextChars: number
  headingCount: number
  paragraphCount: number
  structuredBlockCount: number
  chromeHeavy: boolean
  lowQuality: boolean
  supplementalResolver?: string
  htmlSample?: string
  finalTextSample?: string
}

export function isPageFetchDebugEnabled(): boolean {
  return process.env.PAGE_FETCH_DEBUG === '1' || process.env.DEBUG_PAGE_FETCH === '1'
}

export function sampleText(text: string, max = 400): string {
  return text.length <= max ? text : `${ text.slice(0, max) }…`
}

/** @deprecated Use logExtractionDiagnostics */
export function logPageFetchDiagnostics(diag: PageFetchDiagnostics): void {
  if (!isPageFetchDebugEnabled()) return
  console.info('[page-fetch]', JSON.stringify(diag, null, 2))
}

export function logExtractionDiagnostics(result: ExtractionResult): void {
  if (!isPageFetchDebugEnabled()) return
  console.info('[url-extract]', JSON.stringify(result, null, 2))
}

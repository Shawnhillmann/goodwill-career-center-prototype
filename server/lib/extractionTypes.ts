export type NormalizedJobPostingSource =
  | 'json-ld'
  | 'embedded-json'
  | 'rendered-dom'
  | 'network-json'
  | 'platform-adapter'

export type NormalizedJobPosting = {
  title?: string
  company?: string
  location?: string
  employmentType?: string
  salary?: string
  datePosted?: string
  description?: string
  responsibilities?: string[]
  qualifications?: string[]
  skills?: string[]
  benefits?: string[]
  rawText?: string
  source?: NormalizedJobPostingSource
}

export type NetworkRequestLog = {
  url: string
  method?: string
  status?: number
  contentType?: string
  ok?: boolean
  error?: string
}

export type ExtractionDiagnostics = {
  urlRequested: string
  finalUrl?: string
  redirectChain: string[]
  httpStatus?: number
  responseHeaders: Record<string, string>
  rawHtmlLength: number
  renderedDomLength: number
  extractedTextLength: number
  strategyUsed: string
  structuredJobFound: boolean
  networkRequests: NetworkRequestLog[]
  blockedRequests: string[]
  failedRequests: string[]
  screenshotNote?: string
  failureReason?: string
  stagesAttempted: string[]
  qualityScore: number
  qualitySignals: { positive: string[]; negative: string[] }
  textPreview?: string
}

export type ExtractionConfidence = 'high' | 'medium' | 'low'

export type ExtractionResult = {
  success: boolean
  confidence: ExtractionConfidence
  url: string
  finalUrl?: string
  title?: string
  text?: string
  structuredJob?: NormalizedJobPosting
  strategyUsed: string
  diagnostics: ExtractionDiagnostics
  failureReason?: string
  recommendedUserAction?: string
}

export type ExtractionCandidate = {
  text: string
  title?: string
  strategy: string
  structuredJob?: NormalizedJobPosting
  source?: NormalizedJobPostingSource
}

export const MAX_EXTRACTED_TEXT_CHARS = 14_000

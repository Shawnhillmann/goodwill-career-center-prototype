import {
  analyzeExtractionMetrics,
  extractHtmlTitle,
  extractMainContentText,
  extractReadableContentFromHtml,
  htmlToPlainText,
} from './pageContentExtract.js'
import { fetchKnownJobBoardPosting } from './jobBoardResolvers.js'
import { detectJobPlatform, platformFailureHint } from './jobPlatformDetect.js'
import {
  detectBlockedPage,
  isAcceptableForLlm,
  pickBestCandidate,
  scoreExtractionContent,
} from './extractionQuality.js'
import {
  bestStructuredJob,
  extractAllStructuredJobs,
  normalizedJobToText,
} from './structuredJobExtract.js'
import {
  extractJobTextFromNetworkJsonBodies,
  isBrowserRenderEnabled,
  renderPageWithBrowser,
} from './pageBrowserRender.js'
import { logExtractionDiagnostics, sampleText } from './pageFetchDiagnostics.js'
import { validateFetchableUrl } from './fetchUrlPolicy.js'
import type { ExtractionCandidate, ExtractionDiagnostics, ExtractionResult } from './extractionTypes.js'

const FETCH_TIMEOUT_MS = 12_000
const MAX_BYTES = 768_000
const MAX_REDIRECTS = 3
const MAX_TEXT = 14_000

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

type HttpFetchSuccess = {
  ok: true
  html: string
  finalUrl: string
  redirectChain: string[]
  status: number
  headers: Record<string, string>
}

type HttpFetchFailure = { ok: false; error: string; status?: number; redirectChain: string[] }

async function fetchRawHtml(url: URL, redirectCount = 0, chain: string[] = []): Promise<HttpFetchSuccess | HttpFetchFailure> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  chain = [...chain, url.toString()]

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: redirectCount >= MAX_REDIRECTS ? 'manual' : 'follow',
      signal: controller.signal,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,application/json;q=0.5,*/*;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': BROWSER_USER_AGENT,
      },
    })

    const headers: Record<string, string> = {}
    response.headers.forEach((v, k) => {
      headers[k] = v
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || redirectCount >= MAX_REDIRECTS) {
        return { ok: false, error: 'Too many redirects or missing location.', status: response.status, redirectChain: chain }
      }
      const next = new URL(location, url)
      const validated = validateFetchableUrl(next.toString())
      if (!validated) return { ok: false, error: 'Redirect blocked (unsafe target).', redirectChain: chain }
      return fetchRawHtml(validated, redirectCount + 1, chain)
    }

    if (!response.ok) {
      return { ok: false, error: `Page returned HTTP ${ response.status }.`, status: response.status, redirectChain: chain }
    }

    const reader = response.body?.getReader()
    if (!reader) return { ok: false, error: 'Empty response body.', redirectChain: chain }

    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.length
      if (total > MAX_BYTES) return { ok: false, error: 'Page is too large to review.', redirectChain: chain }
      chunks.push(value)
    }

    const html = Buffer.concat(chunks).toString('utf8')
    return {
      ok: true,
      html,
      finalUrl: response.url || url.toString(),
      redirectChain: chain,
      status: response.status,
      headers,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const error =
      message.includes('abort') || message.includes('Abort')
        ? 'Timed out loading this page.'
        : `Could not load this page (${ message }).`
    return { ok: false, error, redirectChain: chain }
  } finally {
    clearTimeout(timer)
  }
}

function truncate(text: string): string {
  return text.length <= MAX_TEXT ? text : `${ text.slice(0, MAX_TEXT) }…`
}

function collectHtmlCandidates(html: string, prefix: string): ExtractionCandidate[] {
  const candidates: ExtractionCandidate[] = []
  const title = extractHtmlTitle(html)

  const structuredJobs = extractAllStructuredJobs(html)
  for (const job of structuredJobs) {
    const text = normalizedJobToText(job)
    if (text.length >= 80) {
      candidates.push({
        text,
        title: job.title ?? title,
        strategy: `${ prefix }:structured-${ job.source ?? 'data' }`,
        structuredJob: job,
        source: job.source,
      })
    }
  }

  const readable = extractReadableContentFromHtml(html)
  if (readable.text.length >= 40) {
    const bestJob = bestStructuredJob(html)
    candidates.push({
      text: readable.text,
      title: readable.title || title,
      strategy: `${ prefix }:readable-${ readable.source }`,
      structuredJob: bestJob ?? undefined,
      source: bestJob?.source,
    })
  }

  const main = extractMainContentText(html)
  if (main.length >= 200) {
    candidates.push({ text: main, title, strategy: `${ prefix }:main-content` })
  }

  const plain = htmlToPlainText(html)
  if (plain.length >= 200) {
    candidates.push({ text: plain, title, strategy: `${ prefix }:plain-text` })
  }

  return candidates
}

function buildFailureResult(
  url: string,
  partial: Partial<ExtractionResult> & { diagnostics: ExtractionDiagnostics },
): ExtractionResult {
  const platform = partial.diagnostics.finalUrl
    ? detectJobPlatform(new URL(partial.diagnostics.finalUrl))
    : detectJobPlatform(new URL(url))

  const hint =
    partial.recommendedUserAction ??
    platformFailureHint(platform) ??
    'Paste the job description manually or try a public employer careers-page link.'

  return {
    success: false,
    confidence: 'low',
    url,
    finalUrl: partial.finalUrl,
    title: partial.title,
    text: undefined,
    structuredJob: partial.structuredJob,
    strategyUsed: partial.strategyUsed ?? 'none',
    diagnostics: partial.diagnostics,
    failureReason:
      partial.failureReason ??
      partial.diagnostics.failureReason ??
      'Could not extract readable job or page content.',
    recommendedUserAction: hint,
  }
}

function buildSuccessResult(
  url: string,
  best: ExtractionCandidate,
  score: ReturnType<typeof scoreExtractionContent>,
  diagnostics: ExtractionDiagnostics,
  finalUrl?: string,
): ExtractionResult {
  const text = truncate(best.text)
  diagnostics.extractedTextLength = text.length
  diagnostics.strategyUsed = best.strategy
  diagnostics.structuredJobFound = Boolean(best.structuredJob)
  diagnostics.qualityScore = score.score
  diagnostics.qualitySignals = { positive: score.positive, negative: score.negative }
  diagnostics.textPreview = sampleText(text, 400)
  diagnostics.failureReason = undefined

  return {
    success: true,
    confidence: score.confidence,
    url,
    finalUrl,
    title: best.title ?? best.structuredJob?.title,
    text,
    structuredJob: best.structuredJob,
    strategyUsed: best.strategy,
    diagnostics,
  }
}

/** Multi-stage URL extraction: HTTP → structured data → platform APIs → Playwright → best candidate scoring. */
export async function extractUrlContent(rawUrl: string): Promise<ExtractionResult> {
  const validated = validateFetchableUrl(rawUrl)
  const stagesAttempted: string[] = []

  const baseDiagnostics: ExtractionDiagnostics = {
    urlRequested: rawUrl,
    redirectChain: [],
    responseHeaders: {},
    rawHtmlLength: 0,
    renderedDomLength: 0,
    extractedTextLength: 0,
    strategyUsed: 'none',
    structuredJobFound: false,
    networkRequests: [],
    blockedRequests: [],
    failedRequests: [],
    stagesAttempted,
    qualityScore: 0,
    qualitySignals: { positive: [], negative: [] },
  }

  if (!validated) {
    return buildFailureResult(rawUrl, {
      strategyUsed: 'validation',
      diagnostics: {
        ...baseDiagnostics,
        failureReason: 'Invalid or blocked URL.',
        stagesAttempted: ['validation'],
      },
      failureReason: 'Invalid or blocked URL.',
      recommendedUserAction: 'Use a public http(s) job or careers page link.',
    })
  }

  const platform = detectJobPlatform(validated)
  const allCandidates: ExtractionCandidate[] = []

  stagesAttempted.push('stage-1-http-fetch')
  const http = await fetchRawHtml(validated)
  if (!http.ok) {
    return buildFailureResult(rawUrl, {
      diagnostics: {
        ...baseDiagnostics,
        httpStatus: http.status,
        redirectChain: http.redirectChain,
        failureReason: http.error,
        stagesAttempted,
      },
      failureReason: http.error,
    })
  }

  baseDiagnostics.finalUrl = http.finalUrl
  baseDiagnostics.redirectChain = http.redirectChain
  baseDiagnostics.httpStatus = http.status
  baseDiagnostics.responseHeaders = http.headers
  baseDiagnostics.rawHtmlLength = http.html.length

  stagesAttempted.push('stage-2-platform-adapter')
  const board = await fetchKnownJobBoardPosting(validated)
  if (board) {
    allCandidates.push({
      text: board.text,
      title: board.job.title,
      strategy: `platform-adapter:${ board.resolver }`,
      structuredJob: board.job,
      source: 'platform-adapter',
    })
  }

  stagesAttempted.push('stage-2-structured-html')
  allCandidates.push(...collectHtmlCandidates(http.html, 'http'))

  let { best, score } = pickBestCandidate(allCandidates)

  const tryBrowser =
    isBrowserRenderEnabled() &&
    (!best || !score || !isAcceptableForLlm(score.confidence, score.score, Boolean(best?.structuredJob)))

  if (tryBrowser) {
    stagesAttempted.push('stage-3-headless-browser')
    const rendered = await renderPageWithBrowser(http.finalUrl)
    if (rendered) {
      baseDiagnostics.renderedDomLength = rendered.renderedDomLength
      baseDiagnostics.networkRequests = rendered.networkRequests
      baseDiagnostics.blockedRequests = rendered.blockedRequests
      baseDiagnostics.failedRequests = rendered.failedRequests
      baseDiagnostics.screenshotNote = rendered.screenshotNote

      stagesAttempted.push('stage-4-rendered-dom')
      allCandidates.push(...collectHtmlCandidates(rendered.html, 'browser'))

      const networkText = extractJobTextFromNetworkJsonBodies(rendered.jsonBodies)
      if (networkText) {
        allCandidates.push({
          text: networkText,
          strategy: 'browser:network-json',
          source: 'network-json',
        })
      }

      const picked = pickBestCandidate(allCandidates)
      best = picked.best
      score = picked.score
    } else {
      baseDiagnostics.failedRequests.push(
        'Headless browser unavailable (install playwright and set PAGE_FETCH_USE_BROWSER=1).',
      )
    }
  }

  if (best?.text) {
    const blocked = detectBlockedPage(best.text)
    if (blocked.blocked) {
      return buildFailureResult(rawUrl, {
        finalUrl: http.finalUrl,
        title: best.title,
        strategyUsed: best.strategy,
        structuredJob: best.structuredJob,
        diagnostics: {
          ...baseDiagnostics,
          strategyUsed: best.strategy,
          textPreview: sampleText(best.text, 400),
          failureReason: blocked.reason,
          stagesAttempted,
        },
        failureReason: blocked.reason,
        recommendedUserAction: platformFailureHint(platform),
      })
    }
  }

  if (!best || !score) {
    const metrics = analyzeExtractionMetrics(http.html)
    return buildFailureResult(rawUrl, {
      finalUrl: http.finalUrl,
      diagnostics: {
        ...baseDiagnostics,
        failureReason: 'No extractable content candidates.',
        textPreview: sampleText(htmlToPlainText(http.html), 400),
        stagesAttempted,
        qualityScore: 0,
        qualitySignals: {
          positive: [],
          negative: metrics.chromeHeavy ? ['chrome_heavy'] : ['no_candidates'],
        },
      },
      failureReason: 'Job content not found in page HTML.',
      recommendedUserAction: platformFailureHint(platform),
    })
  }

  if (!isAcceptableForLlm(score.confidence, score.score, Boolean(best.structuredJob))) {
    return buildFailureResult(rawUrl, {
      finalUrl: http.finalUrl,
      title: best.title,
      strategyUsed: best.strategy,
      structuredJob: best.structuredJob,
      diagnostics: {
        ...baseDiagnostics,
        strategyUsed: best.strategy,
        structuredJobFound: Boolean(best.structuredJob),
        textPreview: sampleText(best.text, 400),
        qualityScore: score.score,
        qualitySignals: { positive: score.positive, negative: score.negative },
        failureReason: `Low-confidence extraction (score ${ score.score }, confidence ${ score.confidence }).`,
        stagesAttempted,
      },
      failureReason: `Extracted text looks like site chrome or placeholder content, not a full job posting (confidence: ${ score.confidence }).`,
      recommendedUserAction: platformFailureHint(platform),
    })
  }

  const result = buildSuccessResult(rawUrl, best, score, baseDiagnostics, http.finalUrl)
  result.diagnostics.stagesAttempted = stagesAttempted
  logExtractionDiagnostics(result)
  return result
}

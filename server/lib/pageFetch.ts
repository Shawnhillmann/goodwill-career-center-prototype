import { extractUrlContent } from './urlContentExtract.js'
export { validateFetchableUrl } from './fetchUrlPolicy.js'

export type PageFetchOutcome = {
  url: string
  ok: boolean
  statusCode?: number
  title?: string
  text?: string
  error?: string
  confidence?: 'high' | 'medium' | 'low'
  strategyUsed?: string
  failureReason?: string
  recommendedUserAction?: string
}

function toPageFetchOutcome(result: Awaited<ReturnType<typeof extractUrlContent>>): PageFetchOutcome {
  const ok = result.success && result.text && result.text.length >= 40
  return {
    url: result.url,
    ok: Boolean(ok),
    statusCode: result.diagnostics.httpStatus,
    title: result.title,
    text: ok ? result.text : undefined,
    error: ok
      ? undefined
      : result.failureReason ??
        result.recommendedUserAction ??
        'Could not extract readable job or page content.',
    confidence: result.confidence,
    strategyUsed: result.strategyUsed,
    failureReason: result.failureReason,
    recommendedUserAction: result.recommendedUserAction,
  }
}

/** Fetch a single user-provided http(s) URL (multi-stage extraction pipeline). */
export async function fetchUserProvidedPage(rawUrl: string): Promise<PageFetchOutcome> {
  const result = await extractUrlContent(rawUrl)
  return toPageFetchOutcome(result)
}

export const MAX_USER_PROVIDED_URLS = 3

export async function fetchUserProvidedPages(urls: string[]): Promise<PageFetchOutcome[]> {
  const unique = [...new Set(urls)].slice(0, MAX_USER_PROVIDED_URLS)
  const results: PageFetchOutcome[] = []
  for (const url of unique) {
    results.push(await fetchUserProvidedPage(url))
  }
  return results
}

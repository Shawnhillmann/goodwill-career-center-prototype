import { extractUserProvidedUrls, hasUserProvidedUrl } from '../../shared/urlDetect.js'
import { fetchUserProvidedPages, type PageFetchOutcome } from './pageFetch.js'

export type WebAccessContext = {
  userProvidedUrls: string[]
  pages: PageFetchOutcome[]
  webFetchEnabled: boolean
}

export function getUrlsFromLastUserMessage(lastUserMessage: string): string[] {
  return extractUserProvidedUrls(lastUserMessage)
}

export function shouldFetchUserProvidedPages(lastUserMessage: string): boolean {
  return hasUserProvidedUrl(lastUserMessage)
}

/** Open-ended browse requests without a link — coaching only, no fetch. */
export function isOpenEndedWebSearchRequest(text: string): boolean {
  if (hasUserProvidedUrl(text)) return false
  const s = text.toLowerCase()
  return (
    /\b(find|search|look up|look for|browse)\b.{0,40}\b(jobs?|openings?|listings?|positions?)\b/.test(s) ||
    /\b(find|search|look for)\b.{0,40}\b(local resources?|training programs?|programs?)\b/.test(s) ||
    /\b(jobs? near me|near me)\b/.test(s) ||
    /\bwhat companies are hiring\b/.test(s) ||
    /\bfind\b.{0,30}\b(forklift|warehouse|retail)\b.{0,20}\b(jobs?|work)\b/.test(s)
  )
}

export async function buildWebAccessContext(lastUserMessage: string): Promise<WebAccessContext> {
  const userProvidedUrls = getUrlsFromLastUserMessage(lastUserMessage)
  if (userProvidedUrls.length === 0) {
    return { userProvidedUrls: [], pages: [], webFetchEnabled: false }
  }
  const pages = await fetchUserProvidedPages(userProvidedUrls)
  return {
    userProvidedUrls,
    pages,
    webFetchEnabled: true,
  }
}

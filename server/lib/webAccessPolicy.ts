import { extractUserProvidedUrls, hasUserProvidedUrl } from '../../shared/urlDetect.js'
import { isLiveLookupRequest } from '../../shared/searchConfirm.js'
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

/** Open-ended browse requests without a link — coaching / confirm-before-search workflow. */
export function isOpenEndedWebSearchRequest(text: string): boolean {
  return isLiveLookupRequest(text)
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

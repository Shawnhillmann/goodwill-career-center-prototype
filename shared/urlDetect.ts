const HTTP_URL = /https?:\/\/[^\s)\]>]+/gi
const WWW_URL = /\bwww\.[^\s)\]>]+/gi

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?)]+$/, '')
}

/** URLs the user explicitly pasted (http(s) or www.). */
export function extractUserProvidedUrls(text: string): string[] {
  const found: string[] = []
  for (const match of text.match(HTTP_URL) ?? []) {
    found.push(stripTrailingPunctuation(match))
  }
  for (const match of text.match(WWW_URL) ?? []) {
    found.push(stripTrailingPunctuation(`https://${ match }`))
  }
  return [...new Set(found)]
}

export function hasUserProvidedUrl(text: string): boolean {
  return extractUserProvidedUrls(text).length > 0
}

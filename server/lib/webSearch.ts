type WebSearchResult = {
  title: string
  url: string
  snippet?: string
}

function decodeHtml(s: string): string {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#39;', "'")
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

function normalizeSpace(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * Very small, dependency-free web search using DuckDuckGo's HTML endpoint.
 * This is a best-effort scraper for local prototyping (no guaranteed stability).
 */
export async function webSearch(query: string, limit = 5): Promise<WebSearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const url = `https://html.duckduckgo.com/html/?q=${ encodeURIComponent(q) }`
  const resp = await fetch(url, {
    headers: {
      // Some deployments respond differently without a UA.
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!resp.ok) {
    throw new Error(`Web search failed (${ resp.status })`)
  }

  const html = await resp.text()

  // DuckDuckGo HTML results typically contain:
  // - <a class="result__a" href="...">Title</a>
  // - <a class="result__snippet">Snippet</a>
  const results: WebSearchResult[] = []
  const linkRe =
    /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/g

  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) && results.length < limit) {
    const rawHref = match[1] ?? ''
    const rawTitle = match[2] ?? ''
    const rawSnippet = match[3] ?? ''

    const title = normalizeSpace(decodeHtml(stripTags(rawTitle)))
    if (!title) continue

    const href = decodeHtml(rawHref)
    // DDG uses redirect links like https://duckduckgo.com/l/?uddg=...
    // For prototype display, keep as-is (still clickable).
    const snippet = rawSnippet ? normalizeSpace(decodeHtml(stripTags(rawSnippet))) : undefined

    results.push({ title, url: href, snippet })
  }

  return results
}


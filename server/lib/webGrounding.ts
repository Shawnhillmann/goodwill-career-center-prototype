export type WebSearchResult = { title: string; url: string; snippet?: string }

export function formatWebResultsForInstructions(results: WebSearchResult[]): string {
  return results
    .map((r, i) => {
      const snippet = r.snippet ? `\nSnippet: ${ r.snippet }` : ''
      return `Result ${ i + 1 }:\nTitle: ${ r.title }\nURL: ${ r.url }${ snippet }`
    })
    .join('\n\n')
}

export function appendWebGroundingToInstructions(baseInstructions: string, webContext: string): string {
  return (
    `${ baseInstructions }\n\n` +
    '--- Retrieved web results (grounding only; do not invent listings, URLs, dates, or employers beyond these) ---\n' +
    `${ webContext }\n` +
    '--- End retrieved web results ---\n' +
    'Cite only URLs from the block above when summarizing.'
  )
}

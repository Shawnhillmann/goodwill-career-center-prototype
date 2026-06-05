export const MAX_WEB_SEARCH_RESULTS = 3

/** Instructions appended to approved web-search turns to keep replies short and fast. */
export function buildSearchResultLimitInstructions(
  maxResults: number = MAX_WEB_SEARCH_RESULTS,
): string {
  return [
    `RESULT LIMIT (mandatory): Return at most ${ maxResults } of the best, most relevant results — never more than ${ maxResults }, regardless of topic (jobs, companies, people, events, training, or anything else).`,
    `Format: a brief intro sentence, then at most ${ maxResults } bullets or numbered items (one line each + source link when available).`,
    `Do not include honorable mentions, runner-ups, or "also saw" extras beyond the ${ maxResults } cap.`,
    `If more exist online, say so in one sentence and suggest refining criteria.`,
  ].join('\n')
}

/** Keep in sync with src/lib/streamingPolicy.ts — doc-only and web-search turns are buffered, not streamed. */
export function shouldStreamAdvisorReply(opts: {
  clientWantsStream: boolean
  docOnly: boolean
  webSearchExecute?: boolean
}): boolean {
  if (!opts.clientWantsStream) return false
  if (opts.docOnly) return false
  if (opts.webSearchExecute) return false
  return true
}

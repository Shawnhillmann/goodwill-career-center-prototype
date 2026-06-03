/** Keep in sync with src/lib/streamingPolicy.ts — doc-only turns are buffered, not streamed. */
export function shouldStreamAdvisorReply(opts: {
  clientWantsStream: boolean
  docOnly: boolean
}): boolean {
  if (!opts.clientWantsStream) return false
  if (opts.docOnly) return false
  return true
}

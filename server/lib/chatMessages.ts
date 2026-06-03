import type { ChatMessage } from './advisorPrompt.js'
import type { PageFetchOutcome } from './pageFetch.js'

/** Attach server-fetched page text to the latest user turn so the model uses it reliably. */
export function augmentMessagesWithFetchedPages(
  messages: ChatMessage[],
  pages: PageFetchOutcome[],
): ChatMessage[] {
  const loaded = pages.filter((p) => p.ok && p.text?.trim())
  if (!loaded.length) return messages

  let lastUserIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserIdx = i
      break
    }
  }
  if (lastUserIdx < 0) return messages

  const blocks = loaded.map(
    (p) =>
      `[System loaded this page from the user's link — not text the user pasted]\nURL: ${ p.url }\n${ p.title ? `Title: ${ p.title }\n` : '' }${ p.text }`,
  )

  const copy = [...messages]
  copy[lastUserIdx] = {
    role: 'user',
    content: `${ copy[lastUserIdx].content }\n\n---\n${ blocks.join('\n\n---\n') }`,
  }
  return copy
}

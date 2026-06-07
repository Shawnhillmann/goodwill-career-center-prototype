import { advisorOfferedResumeConfirmation } from './confirmGate.js'
import {
  extractStructuredSearchPlanBlock,
  isExecutableSearchPlan,
  normalizeSearchPlan,
  stripSearchPlanBlock,
  assistantMessageHasSearchPlanBlock,
  type SearchPlan,
} from './searchPlan.js'

function extractLegacyBulletLines(text: string): string[] {
  const lines: string[] = []

  for (const match of text.matchAll(/^\s*[•\-\*]\s+(.+)$/gm)) {
    const line = match[1]?.trim() ?? ''
    if (line.length >= 4) lines.push(line)
  }
  if (lines.length) return lines

  const afterSearchFor = text.split(/\bI will search for:\s*/i)[1]
  if (afterSearchFor) {
    const section = afterSearchFor.split(/\bReply\s+CONFIRM\b/i)[0] ?? afterSearchFor
    for (const part of section.split(/•/)) {
      const line = part.replace(/\s+/g, ' ').trim()
      if (line.length >= 4) lines.push(line)
    }
  }

  if (lines.length) return lines

  for (const match of text.matchAll(/^\s*\d+[.)]\s+(.+)$/gm)) {
    const line = match[1]?.trim() ?? ''
    if (line.length >= 4) lines.push(line)
  }

  return lines
}

function extractLegacySearchPlan(assistantText: string): SearchPlan | null {
  const structured = extractStructuredSearchPlanBlock(assistantText)
  if (structured) return structured

  const visible = stripSearchPlanBlock(assistantText)
  const confirmMatch = visible.match(
    /you want me to search for[:\s]+(.+?)(?:\.|\n|please confirm)/is,
  )
  const inlineQuery = confirmMatch?.[1]?.replace(/\s+/g, ' ').trim()

  const bullets = extractLegacyBulletLines(visible)
  if (inlineQuery && !bullets.length) bullets.push(inlineQuery)

  if (bullets.length === 0) {
    const inline = visible.match(/\bI will search for:\s*([^\n]+)/i)
    if (inline?.[1]) bullets.push(inline[1].trim())
  }

  if (bullets.length === 0) return null

  return normalizeSearchPlan({ bullets, rawPreview: assistantText }, assistantText) ?? null
}

/** Extract a structured search plan from an assistant message. */
export function extractSearchPlan(assistantText: string): SearchPlan | null {
  const structured = extractStructuredSearchPlanBlock(assistantText)
  if (structured) return structured

  if (
    !assistantMessageHasSearchPlanBlock(assistantText) &&
    !/\b(please confirm before i search|reply confirm search|confirm search to begin)\b/i.test(assistantText)
  ) {
    return null
  }

  return extractLegacySearchPlan(assistantText)
}

export type FinalizedAssistantReply = {
  reply: string
  conversationState: {
    pendingAction: 'search' | 'resume' | null
    pendingSearchPlan?: SearchPlan
  }
}

/** Strip hidden plan metadata and compute next conversation state from an assistant reply. */
export function finalizeAssistantSearchReply(assistantReply: string): FinalizedAssistantReply {
  const plan = extractSearchPlan(assistantReply)
  const reply = stripSearchPlanBlock(assistantReply)

  if (plan?.search_query && isExecutableSearchPlan(plan)) {
    return {
      reply,
      conversationState: {
        pendingAction: 'search',
        pendingSearchPlan: { ...plan, rawPreview: assistantReply },
      },
    }
  }

  if (advisorOfferedResumeConfirmation(assistantReply)) {
    return { reply, conversationState: { pendingAction: 'resume' } }
  }

  return { reply, conversationState: { pendingAction: null } }
}

import { advisorOfferedSearchPreview } from './confirmGate.js'
import { isPendingSearchConfirmVisible, type ConversationState } from './conversationState.js'
import type { FinalizedAssistantReply } from './searchFinalize.js'
import type { SearchRequestClassification } from './searchClassification.js'
import type { SearchWorkflowPhase } from './searchConfirm.js'

const SEARCH_CONFIRM_MISMATCH_NOTES: Record<string, string> = {
  en: "I wasn't able to finalize the search setup on my side. Please tell me again what you'd like me to look up, or send your request once more and I'll prepare the search.",
  es: 'No pude finalizar la configuración de la búsqueda. Dígame de nuevo qué desea que busque, o envíe su solicitud otra vez y prepararé la búsqueda.',
  it: 'Non sono riuscito a finalizzare la configurazione della ricerca. Mi dica di nuovo cosa desidera che cerchi, oppure invii di nuovo la richiesta e preparerò la ricerca.',
  ht: 'Mwen pa t kapab finalize konfigirasyon rechèch la. Tanpri di m ankò kisa ou vle m chèche, oswa voye demann ou an yon lòt fwa e m ap prepare rechèch la.',
  pl: 'Nie udało mi się sfinalizować ustawień wyszukiwania. Proszę ponownie napisać, czego mam szukać, lub wysłać prośbę jeszcze raz — przygotuję wyszukiwanie.',
  ru: 'Мне не удалось завершить настройку поиска. Пожалуйста, ещё раз напишите, что вы хотите найти, или отправьте запрос снова — я подготовлю поиск.',
  ar: 'لم أتمكن من إكمال إعداد البحث. يُرجى إخباري مرة أخرى بما تريد أن أبحث عنه، أو إرسال طلبك مرة أخرى وسأجهّز البحث.',
}

function stripTrailingConfirmPrompt(reply: string): string {
  return reply
    .replace(/\s*(?:reply|type|say|respond)\s+["'`]*confirm\s+search["'`]*[\s\S]*$/i, '')
    .replace(/\s*please\s+confirm\s+before\s+i\s+search[\s\S]*$/i, '')
    .replace(/\s*confirm\s+search\s+to\s+begin[\s\S]*$/i, '')
    .trim()
}

/** Visible stream text: never expose hidden SEARCH_PLAN metadata while streaming. */
export function visibleAdvisorStreamText(raw: string): string {
  const blockStart = raw.indexOf('<!--SEARCH_PLAN:')
  let visible = blockStart === -1 ? raw : raw.slice(0, blockStart)
  const partial = visible.match(/<!--(?:SEARCH(?:_(?:PLAN)?)?)?$/)
  if (partial) visible = visible.slice(0, -partial[0].length)
  return visible.replace(/<!--SEARCH_PLAN:[\s\S]*?-->/g, '')
}

export function createAdvisorStreamSanitizer(): {
  push: (chunk: string) => string
  visibleLength: () => number
} {
  let raw = ''
  let sentVisibleLen = 0

  return {
    push(chunk: string): string {
      raw += chunk
      const visible = visibleAdvisorStreamText(raw)
      const delta = visible.slice(sentVisibleLen)
      sentVisibleLen = visible.length
      return delta
    },
    visibleLength(): number {
      return sentVisibleLen
    },
  }
}

/** Do not ask users to confirm search unless a valid executable plan exists. */
export function enforceSearchConfirmInvariant(
  finalized: FinalizedAssistantReply,
  language = 'en',
): FinalizedAssistantReply {
  if (isPendingSearchConfirmVisible(finalized.conversationState)) return finalized
  if (!advisorOfferedSearchPreview(finalized.reply)) return finalized

  const note = SEARCH_CONFIRM_MISMATCH_NOTES[language] ?? SEARCH_CONFIRM_MISMATCH_NOTES.en
  const cleaned = stripTrailingConfirmPrompt(finalized.reply)
  const reply = cleaned ? `${ cleaned }\n\n${ note }` : note

  return {
    reply,
    conversationState: { pendingAction: null },
  }
}

export function shouldBufferSearchOfferReply(opts: {
  searchWorkflowPhase?: SearchWorkflowPhase
  searchClassification?: SearchRequestClassification | null
  searchIntent?: boolean
}): boolean {
  if (opts.searchClassification === 'search_confirmation') return true
  if (opts.searchWorkflowPhase === 'clarifying' && opts.searchIntent) return true
  return false
}

type RecoveryMessage = { role: string; text?: string; streaming?: boolean }

/** Show recovery actions when the advisor asked to confirm but structured state is missing. */
export function isSearchConfirmRecoveryVisible(
  messages: RecoveryMessage[],
  state: ConversationState,
  awaitingAdvisor: boolean,
): boolean {
  if (awaitingAdvisor) return false
  if (isPendingSearchConfirmVisible(state)) return false

  const lastAdvisor = [...messages].reverse().find((m) => m.role === 'advisor' && !m.streaming)
  if (!lastAdvisor?.text?.trim()) return false

  return advisorOfferedSearchPreview(lastAdvisor.text)
}

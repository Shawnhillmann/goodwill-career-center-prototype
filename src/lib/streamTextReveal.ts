function nextWordEnd(text: string, from: number): number {
  if (from >= text.length) return text.length
  let i = from
  while (i < text.length && /\s/.test(text[i] ?? '')) i++
  while (i < text.length && !/\s/.test(text[i] ?? '')) i++
  return i
}

export type StreamTextReveal = {
  setTarget: (text: string) => void
  flush: () => void
  reset: () => void
  isRevealing: () => boolean
}

/** Reveal streamed text word-by-word so it is easier to read than raw token speed. */
export function createStreamTextReveal(
  onDisplay: (text: string) => void,
  options?: { wordDelayMs?: number; onWord?: () => void },
): StreamTextReveal {
  const wordDelayMs = options?.wordDelayMs ?? 44
  let target = ''
  let displayed = ''
  let timer: ReturnType<typeof setInterval> | null = null

  const emit = () => onDisplay(displayed)

  const step = () => {
    if (displayed.length >= target.length) {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      return
    }
    const prevLen = displayed.length
    displayed = target.slice(0, nextWordEnd(target, displayed.length))
    if (displayed.length > prevLen) options?.onWord?.()
    emit()
  }

  const ensureTimer = () => {
    if (timer) return
    timer = setInterval(step, wordDelayMs)
    step()
  }

  return {
    setTarget(text: string) {
      target = text
      if (displayed.length > target.length) displayed = target
      ensureTimer()
    },
    flush() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      displayed = target
      emit()
    },
    reset() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      target = ''
      displayed = ''
    },
    isRevealing: () => displayed.length < target.length,
  }
}

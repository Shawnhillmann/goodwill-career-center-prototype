type ToneStep = {
  freq: number
  start: number
  duration: number
  gain?: number
}

let audioCtx: AudioContext | null = null
let thinkingInterval: ReturnType<typeof setInterval> | null = null

function soundsAllowed(): boolean {
  if (typeof window === 'undefined') return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getCtx(): AudioContext | null {
  if (!soundsAllowed()) return null
  const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

export function unlockChatAudio(): void {
  const ctx = getCtx()
  if (ctx?.state === 'suspended') {
    void ctx.resume()
  }
}

function playSequence(steps: ToneStep[], type: OscillatorType = 'sine'): void {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const t0 = ctx.currentTime
  for (const step of steps) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(step.freq, t0 + step.start)
    const peak = step.gain ?? 0.06
    const start = t0 + step.start
    const end = start + step.duration
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, end)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(end + 0.04)
  }
}

/** Short upward tone when the user sends a message. */
export function playUserMessageSound(): void {
  playSequence([
    { freq: 523.25, start: 0, duration: 0.055, gain: 0.045 },
    { freq: 659.25, start: 0.065, duration: 0.075, gain: 0.05 },
  ])
}

/** Warm two-note tone when the advisor replies. */
export function playAdvisorMessageSound(): void {
  playSequence(
    [
      { freq: 587.33, start: 0, duration: 0.085, gain: 0.042 },
      { freq: 440, start: 0.095, duration: 0.11, gain: 0.048 },
    ],
    'triangle',
  )
}

function playThinkingPulse(): void {
  playSequence([{ freq: 349.23, start: 0, duration: 0.1, gain: 0.022 }])
}

/** Soft repeating pulse while the advisor is generating a reply. */
export function startThinkingSound(): void {
  stopThinkingSound()
  if (!soundsAllowed()) return
  playThinkingPulse()
  thinkingInterval = setInterval(playThinkingPulse, 1400)
}

export function stopThinkingSound(): void {
  if (thinkingInterval) {
    clearInterval(thinkingInterval)
    thinkingInterval = null
  }
}

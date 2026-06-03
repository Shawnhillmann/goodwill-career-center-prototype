/** Fire-and-forget warmup so Vercel loads the serverless handler before the first chat message. */
let warmupStarted = false

export function warmApiBackend(): void {
  if (warmupStarted || typeof fetch === 'undefined') return
  warmupStarted = true

  const run = () => {
    void fetch('/api/health', { method: 'GET', cache: 'no-store' }).catch(() => {})
    void fetch('/api/warm', { method: 'GET', cache: 'no-store' }).catch(() => {})
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2500 })
  } else {
    window.setTimeout(run, 300)
  }
}

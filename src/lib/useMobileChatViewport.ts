import { useEffect } from 'react'

/**
 * Keeps the fixed composer above the iOS/Android virtual keyboard via visualViewport.
 */
export function useMobileChatViewport(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      document.documentElement.style.removeProperty('--chat-keyboard-offset')
      document.documentElement.style.removeProperty('--chat-vvh')
      return
    }

    const vv = window.visualViewport
    if (!vv) return

    let frame = 0
    let lastLift = -1

    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rawLift = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        // Ignore stale lift values after the keyboard closes (common on iOS).
        const keyboardLift = rawLift < 72 ? 0 : rawLift
        if (Math.abs(keyboardLift - lastLift) < 2) return
        lastLift = keyboardLift
        document.documentElement.style.setProperty('--chat-keyboard-offset', `${ keyboardLift }px`)
        document.documentElement.style.setProperty('--chat-vvh', `${ vv.height }px`)
      })
    }

    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    window.addEventListener('orientationchange', sync)

    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      window.removeEventListener('orientationchange', sync)
      document.documentElement.style.removeProperty('--chat-keyboard-offset')
      document.documentElement.style.removeProperty('--chat-vvh')
    }
  }, [enabled])
}

export type TextSizeLevel = 'small' | 'normal' | 'large' | 'veryLarge'

export const TEXT_SIZE_STORAGE_KEY = 'gw.textSize'
export const LEGACY_TEXT_SIZE_STORAGE_KEY = 'gw.textSizePercent'

export const DEFAULT_TEXT_SIZE_LEVEL: TextSizeLevel = 'normal'

export const TEXT_SIZE_LEVELS: TextSizeLevel[] = ['small', 'normal', 'large', 'veryLarge']

/** Base scale (mobile / narrow viewports). Desktop overrides live in App.css. */
const TEXT_SIZE_SCALE: Record<TextSizeLevel, number> = {
  small: 0.94,
  normal: 1,
  large: 1.03,
  veryLarge: 1.06,
}

const TEXT_SIZE_SCALE_DESKTOP: Record<TextSizeLevel, number> = {
  small: 0.94,
  normal: 1,
  large: 1.09,
  veryLarge: 1.16,
}

function isDesktopViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(min-width: 1024px)').matches
}

export function isTextSizeLevel(value: unknown): value is TextSizeLevel {
  return typeof value === 'string' && TEXT_SIZE_LEVELS.includes(value as TextSizeLevel)
}

function percentToLevel(percent: number): TextSizeLevel {
  if (percent < 94) return 'small'
  if (percent < 106) return 'normal'
  if (percent < 120) return 'large'
  return 'veryLarge'
}

export function getTextSizeScale(level: TextSizeLevel): number {
  const map = isDesktopViewport() ? TEXT_SIZE_SCALE_DESKTOP : TEXT_SIZE_SCALE
  return map[level]
}

export function loadTextSizeLevel(): TextSizeLevel {
  try {
    const saved = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY)
    if (isTextSizeLevel(saved)) return saved

    const legacy = window.localStorage.getItem(LEGACY_TEXT_SIZE_STORAGE_KEY)
    if (legacy) {
      const parsed = Number.parseInt(legacy, 10)
      if (Number.isFinite(parsed)) return percentToLevel(parsed)
    }
  } catch {
    // ignore
  }
  return DEFAULT_TEXT_SIZE_LEVEL
}

export function applyTextSizeLevel(level: TextSizeLevel): TextSizeLevel {
  const valid = isTextSizeLevel(level) ? level : DEFAULT_TEXT_SIZE_LEVEL
  document.documentElement.dataset.textSize = valid
  document.documentElement.style.removeProperty('--gw-text-scale')
  return valid
}

export function saveTextSizeLevel(level: TextSizeLevel): TextSizeLevel {
  const valid = isTextSizeLevel(level) ? level : DEFAULT_TEXT_SIZE_LEVEL
  try {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, valid)
    window.localStorage.removeItem(LEGACY_TEXT_SIZE_STORAGE_KEY)
  } catch {
    // ignore quota / private mode
  }
  return applyTextSizeLevel(valid)
}

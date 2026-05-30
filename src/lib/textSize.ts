export type TextSizeLevel = 'small' | 'normal' | 'large' | 'veryLarge'

export const TEXT_SIZE_STORAGE_KEY = 'gw.textSize'
export const LEGACY_TEXT_SIZE_STORAGE_KEY = 'gw.textSizePercent'

export const DEFAULT_TEXT_SIZE_LEVEL: TextSizeLevel = 'normal'

export const TEXT_SIZE_LEVELS: TextSizeLevel[] = ['small', 'normal', 'large', 'veryLarge']

const TEXT_SIZE_SCALE: Record<TextSizeLevel, number> = {
  small: 0.875,
  normal: 1,
  large: 1.125,
  veryLarge: 1.3125,
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
  return TEXT_SIZE_SCALE[level]
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
  const scale = getTextSizeScale(level)
  document.documentElement.style.setProperty('--gw-text-scale', String(scale))
  document.documentElement.dataset.textSize = level
  return level
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

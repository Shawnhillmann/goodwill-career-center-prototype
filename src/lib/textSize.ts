export const TEXT_SIZE_STORAGE_KEY = 'gw.textSizePercent'

export const DEFAULT_TEXT_SIZE_PERCENT = 100
export const MIN_TEXT_SIZE_PERCENT = 85
export const MAX_TEXT_SIZE_PERCENT = 150
export const TEXT_SIZE_STEP = 5

export function clampTextSizePercent(percent: number): number {
  const rounded = Math.round(percent / TEXT_SIZE_STEP) * TEXT_SIZE_STEP
  return Math.min(MAX_TEXT_SIZE_PERCENT, Math.max(MIN_TEXT_SIZE_PERCENT, rounded))
}

export function loadTextSizePercent(): number {
  try {
    const saved = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY)
    if (!saved) return DEFAULT_TEXT_SIZE_PERCENT
    const parsed = Number.parseInt(saved, 10)
    return Number.isFinite(parsed) ? clampTextSizePercent(parsed) : DEFAULT_TEXT_SIZE_PERCENT
  } catch {
    return DEFAULT_TEXT_SIZE_PERCENT
  }
}

export function applyTextSizePercent(percent: number): number {
  const clamped = clampTextSizePercent(percent)
  const scale = clamped / 100
  document.documentElement.style.setProperty('--gw-text-scale', String(scale))
  document.documentElement.dataset.textSizePercent = String(clamped)
  return clamped
}

export function saveTextSizePercent(percent: number): number {
  const clamped = clampTextSizePercent(percent)
  try {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, String(clamped))
  } catch {
    // ignore quota / private mode
  }
  return applyTextSizePercent(clamped)
}

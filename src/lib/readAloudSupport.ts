import type { SupportedLanguage } from '../uiCopy'

/** Arabic TTS is unreliable in browsers; keep UI translation without read-aloud. */
export function isReadAloudSupported(language: SupportedLanguage): boolean {
  return language !== 'ar'
}

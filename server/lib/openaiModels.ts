import { getEnv } from './env.js'

export type ModelTier = 'nano' | 'mini' | 'search_fallback'

export function getOpenAiConfig() {
  const env = getEnv()
  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? 'gpt-5-mini',
  }
}

export function getOpenAiModelIds() {
  const env = getEnv()
  return {
    nano: env.OPENAI_MODEL_NANO ?? 'gpt-5-nano',
    mini: env.OPENAI_MODEL ?? 'gpt-5-mini',
    searchFallback: env.OPENAI_MODEL_SEARCH_FALLBACK ?? 'gpt-5.5',
  }
}

export function selectChatModel(opts: {
  hasUploadedDocument: boolean
  isLiveWebSearch: boolean
  tier?: ModelTier
}): string {
  const models = getOpenAiModelIds()
  if (opts.isLiveWebSearch) {
    return opts.tier === 'search_fallback' ? models.searchFallback : models.mini
  }
  if (opts.hasUploadedDocument) return models.mini
  return models.nano
}

export function missingOpenAiEnv(): string[] {
  const missing: string[] = []
  if (!getEnv().OPENAI_API_KEY) missing.push('OPENAI_API_KEY')
  return missing
}

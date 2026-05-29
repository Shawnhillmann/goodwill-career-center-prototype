import { getEnv } from './env.js'

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
    /** Set only when OPENAI_MODEL_NANO is explicitly configured (opt-in). */
    nano: env.OPENAI_MODEL_NANO,
    mini: env.OPENAI_MODEL ?? 'gpt-5-mini',
  }
}

/** Chat and document paths. Opt-in nano via OPENAI_MODEL_NANO; otherwise mini. */
export function selectChatModel(_opts?: { hasUploadedDocument?: boolean }): string {
  const models = getOpenAiModelIds()
  if (models.nano) return models.nano
  return models.mini
}

export function missingOpenAiEnv(): string[] {
  const missing: string[] = []
  if (!getEnv().OPENAI_API_KEY) missing.push('OPENAI_API_KEY')
  return missing
}

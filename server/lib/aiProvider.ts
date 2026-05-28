import { getEnv } from './env.js'

export type AiProvider = 'bedrock' | 'openai'

/**
 * Resolves the active AI backend.
 * - Explicit AI_PROVIDER=openai|bedrock always wins.
 * - Otherwise, use OpenAI when OPENAI_API_KEY is set (local prototype default).
 * - Fall back to Bedrock for AWS/grant deployments.
 */
export function getAiProvider(): AiProvider {
  const env = getEnv()
  const explicit = env.AI_PROVIDER?.toLowerCase()
  if (explicit === 'openai') return 'openai'
  if (explicit === 'bedrock') return 'bedrock'
  if (env.OPENAI_API_KEY) return 'openai'
  return 'bedrock'
}

export function getOpenAiConfig() {
  const env = getEnv()
  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? 'gpt-5-mini',
  }
}

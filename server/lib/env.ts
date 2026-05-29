type Env = {
  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
  OPENAI_MODEL_NANO?: string
  OPENAI_MODEL_SEARCH_FALLBACK?: string
}

function clean(v: string | undefined) {
  const trimmed = v?.trim()
  return trimmed ? trimmed : undefined
}

export function getEnv(): Env {
  return {
    OPENAI_API_KEY: clean(process.env.OPENAI_API_KEY),
    OPENAI_MODEL: clean(process.env.OPENAI_MODEL),
    OPENAI_MODEL_NANO: clean(process.env.OPENAI_MODEL_NANO),
    OPENAI_MODEL_SEARCH_FALLBACK: clean(process.env.OPENAI_MODEL_SEARCH_FALLBACK),
  }
}

export function requireEnv(...keys: (keyof Env)[]): Required<Pick<Env, (typeof keys)[number]>> {
  const env = getEnv()
  const missing = keys.filter((k) => !env[k])
  if (missing.length) {
    throw new Error(`Missing required env var(s): ${ missing.join(', ') }`)
  }
  return env as Required<Pick<Env, (typeof keys)[number]>>
}

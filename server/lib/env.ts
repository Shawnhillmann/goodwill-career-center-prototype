type Env = {
  AI_PROVIDER?: string
  AWS_REGION?: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  BEDROCK_MODEL_ID?: string
  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
}

function clean(v: string | undefined) {
  const trimmed = v?.trim()
  return trimmed ? trimmed : undefined
}

export function getEnv(): Env {
  return {
    AI_PROVIDER: clean(process.env.AI_PROVIDER),
    AWS_REGION: clean(process.env.AWS_REGION),
    AWS_ACCESS_KEY_ID: clean(process.env.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: clean(process.env.AWS_SECRET_ACCESS_KEY),
    BEDROCK_MODEL_ID: clean(process.env.BEDROCK_MODEL_ID),
    OPENAI_API_KEY: clean(process.env.OPENAI_API_KEY),
    OPENAI_MODEL: clean(process.env.OPENAI_MODEL),
  }
}

export function requireEnv(...keys: (keyof Env)[]): Required<Pick<Env, (typeof keys)[number]>> {
  const env = getEnv()
  const missing = keys.filter((k) => !env[k])
  if (missing.length) {
    throw new Error(`Missing required env var(s): ${ missing.join(', ') }`)
  }
  return env as any
}


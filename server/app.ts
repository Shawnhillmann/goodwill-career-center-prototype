import cors from 'cors'
import express from 'express'
import { getAiProvider, getOpenAiConfig } from './lib/aiProvider.js'
import { getEnv } from './lib/env.js'
import { chatRouter } from './routes/chat.js'
import { searchRouter } from './routes/search.js'
import { documentRouter } from './routes/document.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  )

  // Keep this low: uploads use multipart (multer), not JSON.
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    try {
      const aiProvider = getAiProvider()
      const env = getEnv()
      const openAi = getOpenAiConfig()
      const openaiReady = Boolean(openAi.apiKey)
      res.json({
        ok: true,
        runtime: 'vercel-serverless',
        aiProvider,
        openaiConfigured: openaiReady,
        openaiModel: openaiReady ? openAi.model : null,
        bedrockConfigured: Boolean(env.AWS_REGION && env.BEDROCK_MODEL_ID),
        region: env.AWS_REGION ?? null,
        modelId: env.BEDROCK_MODEL_ID ? '(set)' : null,
        ...(aiProvider === 'openai' && !openaiReady
          ? {
              warning:
                'AI_PROVIDER is openai but OPENAI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.',
            }
          : {}),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Health check failed'
      res.status(500).json({ ok: false, error: { message, details: message } })
    }
  })

  app.use('/api/chat', chatRouter)
  app.use('/api/search', searchRouter)
  // Lazy-load upload route so Node-only PDF parsing libs don't load for plain chat requests.
  // This prevents serverless startup crashes when optional PDF dependencies require DOM APIs.
  app.use('/api/upload', async (req, res, next) => {
    try {
      const mod = await import('./routes/upload.js')
      return mod.uploadRouter(req, res, next)
    } catch (err) {
      next(err)
    }
  })
  app.use('/api/document', documentRouter)

  // Always return JSON for unhandled server errors (important for serverless).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('[api] Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    res.status(500).json({
      error: {
        message: 'A server error has occurred',
        details: message,
      },
    })
  })

  return app
}


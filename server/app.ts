import cors from 'cors'
import express from 'express'
import { getAiProvider, getOpenAiConfig } from './lib/aiProvider.js'
import { getEnv } from './lib/env.js'
import { chatRouter } from './routes/chat.js'
import { documentRouter } from './routes/document.js'
import { uploadRouter } from './routes/upload.js'

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
    const aiProvider = getAiProvider()
    const env = getEnv()
    const openAi = getOpenAiConfig()
    res.json({
      ok: true,
      aiProvider,
      openaiConfigured: Boolean(openAi.apiKey),
      openaiModel: openAi.apiKey ? openAi.model : null,
      bedrockConfigured: Boolean(env.AWS_REGION && env.BEDROCK_MODEL_ID),
      region: env.AWS_REGION ?? null,
      modelId: env.BEDROCK_MODEL_ID ? '(set)' : null,
    })
  })

  app.use('/api/chat', chatRouter)
  app.use('/api/upload', uploadRouter)
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


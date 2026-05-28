import cors from 'cors'
import express from 'express'
import { getAiProvider, getOpenAiConfig } from './lib/aiProvider'
import { getEnv } from './lib/env'
import { chatRouter } from './routes/chat'
import { documentRouter } from './routes/document'
import { uploadRouter } from './routes/upload'

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

  return app
}


import cors from 'cors'
import express from 'express'
import { getOpenAiConfig, getOpenAiModelIds } from './lib/openaiModels.js'
import { chatRouter } from './routes/chat.js'
import { documentRouter } from './routes/document.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  )

  app.use(express.json({ limit: '1mb' }))

  app.get('/api/warm', (_req, res) => {
    res.json({ ok: true, warmed: true, runtime: 'local' })
  })

  app.get('/api/health', (_req, res) => {
    try {
      const openAi = getOpenAiConfig()
      const models = getOpenAiModelIds()
      const openaiReady = Boolean(openAi.apiKey)
      res.json({
        ok: true,
        runtime: 'vercel-serverless',
        openaiConfigured: openaiReady,
        openaiModel: openaiReady ? openAi.model : null,
        openaiNanoModel: openaiReady && models.nano ? models.nano : null,
        ...(!openaiReady
          ? {
              warning: 'OPENAI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.',
            }
          : {}),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Health check failed'
      res.status(500).json({ ok: false, error: { message, details: message } })
    }
  })

  app.use('/api/chat', chatRouter)
  app.use('/api/upload', async (req, res, next) => {
    try {
      const mod = await import('./routes/upload.js')
      return mod.uploadRouter(req, res, next)
    } catch (err) {
      next(err)
    }
  })
  app.use('/api/document', documentRouter)

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

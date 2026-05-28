import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createApp } from './app.js'

// Ensure Vercel uses Node runtime (not Edge).
export const runtime = 'nodejs'

const app = createApp()

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return app(req as any, res as any)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[vercel] handler crash:', err)
    if (!res.headersSent) {
      const message = err instanceof Error ? err.message : 'Server error'
      res.status(500).json({
        error: {
          message: 'A server error has occurred',
          details: message,
        },
      })
    }
  }
}

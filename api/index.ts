import type { VercelRequest, VercelResponse } from '@vercel/node'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from '../server/app.js'

// Local dev convenience: load ../.env when present. On Vercel, env vars come from project settings.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })

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
    return
  }
}


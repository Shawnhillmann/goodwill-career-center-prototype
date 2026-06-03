import type { Response } from 'express'

export function initSse(res: Response): void {
  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()
}

export function writeSse(res: Response, event: string, data: Record<string, unknown>): void {
  res.write(`event: ${ event }\ndata: ${ JSON.stringify(data) }\n\n`)
}

export function endSse(res: Response): void {
  res.end()
}

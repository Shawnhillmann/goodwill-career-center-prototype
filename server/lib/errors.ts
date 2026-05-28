import type { Response } from 'express'

export function sendError(res: Response, status: number, message: string, details?: unknown) {
  res.status(status).json({
    error: {
      message,
      ...(details ? { details } : {}),
    },
  })
}


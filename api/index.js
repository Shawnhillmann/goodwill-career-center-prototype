/**
 * Vercel Serverless Function entrypoint (CommonJS).
 *
 * Keep this file extremely defensive: it must not import heavy modules at
 * top-level, because any import-time failure results in FUNCTION_INVOCATION_FAILED.
 *
 * Health/debug routes return JSON using process.env only.
 * The full Express app is lazy-loaded from ./_handler.cjs for all other routes.
 */

let cachedHandler = null

function safeJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function envBool(name) {
  const v = process.env[name]
  return Boolean(v && String(v).trim())
}

async function getFullHandler() {
  if (cachedHandler) return cachedHandler
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const mod = require('./_handler.cjs')
  cachedHandler = mod && (mod.default || mod)
  if (typeof cachedHandler !== 'function') {
    throw new Error('API handler bundle did not export a function')
  }
  return cachedHandler
}

module.exports = async function vercelHandler(req, res) {
  try {
    const url = req.url || ''

    if (url.startsWith('/api/health')) {
      return safeJson(res, 200, {
        ok: true,
        openaiConfigured: envBool('OPENAI_API_KEY'),
        openaiModel: envBool('OPENAI_API_KEY') ? process.env.OPENAI_MODEL || 'gpt-5-mini' : null,
        openaiNanoModel: envBool('OPENAI_API_KEY') ? process.env.OPENAI_MODEL_NANO || 'gpt-5-nano' : null,
      })
    }

    if (url.startsWith('/api/debug-env')) {
      return safeJson(res, 200, {
        OPENAI_API_KEY: envBool('OPENAI_API_KEY'),
        OPENAI_MODEL: Boolean((process.env.OPENAI_MODEL || '').trim()),
        OPENAI_MODEL_NANO: Boolean((process.env.OPENAI_MODEL_NANO || '').trim()),
        OPENAI_MODEL_SEARCH_FALLBACK: Boolean((process.env.OPENAI_MODEL_SEARCH_FALLBACK || '').trim()),
      })
    }

    const handler = await getFullHandler()
    return handler(req, res)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api] Entry crash:', err && err.message ? err.message : err)
    return safeJson(res, 500, {
      error: 'Serverless function failed to start',
      details: err instanceof Error ? err.message : String(err),
    })
  }
}

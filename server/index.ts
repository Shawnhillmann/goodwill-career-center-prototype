import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAiProvider, getOpenAiConfig } from './lib/aiProvider'
import { getEnv } from './lib/env'
import { createApp } from './app'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// override: true ensures values from .env win over empty system env vars (common on Windows).
dotenv.config({ path: envPath, override: true })

const app = createApp()

const port = Number(process.env.PORT ?? 8787)

const server = app.listen(port, () => {
  const aiProvider = getAiProvider()
  const openAi = getOpenAiConfig()
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://127.0.0.1:${ port }`)
  // eslint-disable-next-line no-console
  console.log(`Health check: http://127.0.0.1:${ port }/api/health`)
  // eslint-disable-next-line no-console
  console.log(
    `AI provider: ${ aiProvider }` +
      (aiProvider === 'openai' ? ` (model: ${ openAi.model })` : ` (Bedrock model id: ${ getEnv().BEDROCK_MODEL_ID ?? 'not set' })`),
  )
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`Port ${ port } is already in use. Set PORT in .env or stop the other process.`)
  } else {
    // eslint-disable-next-line no-console
    console.error(err)
  }
  process.exit(1)
})


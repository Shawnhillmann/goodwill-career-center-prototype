import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getOpenAiConfig, getOpenAiModelIds } from './lib/openaiModels.js'
import { createApp } from './app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

dotenv.config({ path: envPath, override: true })

const app = createApp()

const port = Number(process.env.PORT ?? 8787)

const server = app.listen(port, () => {
  const openAi = getOpenAiConfig()
  const models = getOpenAiModelIds()
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://127.0.0.1:${ port }`)
  // eslint-disable-next-line no-console
  console.log(`Health check: http://127.0.0.1:${ port }/api/health`)
  // eslint-disable-next-line no-console
  console.log(
    openAi.apiKey
      ? `OpenAI: chat=${ models.nano } / doc=${ models.mini } / search-fallback=${ models.searchFallback }`
      : 'OpenAI: OPENAI_API_KEY not set',
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

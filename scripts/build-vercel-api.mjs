import * as esbuild from 'esbuild'
import { mkdir } from 'node:fs/promises'

await mkdir('api', { recursive: true })

await esbuild.build({
  entryPoints: ['server/vercelHandler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'api/_handler.cjs',
  // Keep npm packages in node_modules (smaller bundle, fewer pdf/font issues).
  packages: 'external',
  logLevel: 'info',
})

console.log('Built Vercel API handler -> api/_handler.cjs')

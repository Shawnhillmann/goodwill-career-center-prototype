import { getEnv } from './env.js'

export function isWebSearchEnabled(): boolean {
  const flag = getEnv().WEB_SEARCH_ENABLED
  if (flag === '0' || flag === 'false') return false
  return true
}

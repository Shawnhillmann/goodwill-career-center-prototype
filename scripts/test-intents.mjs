import {
  buildConciseSearchQuery,
  inferSearchTopic,
  isExplicitWebSearchCommand,
  shouldShowSearchOnline,
} from '../server/lib/searchIntent.ts'

const messages = [{ role: 'user' as const, content: 'Help me find a job' }]
console.log('job starter:', JSON.stringify(shouldShowSearchOnline(messages)))
console.log('query:', buildConciseSearchQuery(messages, inferSearchTopic(messages)))

const local = [
  { role: 'user' as const, content: 'Help me find local resources' },
  { role: 'assistant' as const, content: 'What city or ZIP?' },
  { role: 'user' as const, content: 'Middletown CT 06457' },
]
console.log('local thread:', JSON.stringify(shouldShowSearchOnline(local)))
console.log('local query:', buildConciseSearchQuery(local, inferSearchTopic(local)))

console.log('explicit search:', isExplicitWebSearchCommand('search online for retail jobs in Hartford CT'))
console.log('vague ask:', isExplicitWebSearchCommand('help me find a job'))

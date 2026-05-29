import {
  buildConciseSearchQuery,
  inferSearchTopic,
  shouldRunWebSearch,
} from '../server/lib/searchIntent.ts'

const coaching = [{ role: 'user', content: 'Help me find a job' }]
console.log('coaching:', JSON.stringify(shouldRunWebSearch(coaching, false)))

const withResume = [{ role: 'user', content: 'What jobs fit me?' }]
console.log('resume analysis:', JSON.stringify(shouldRunWebSearch(withResume, true)))

const liveJobs = [{ role: 'user', content: 'Find current retail openings near Hartford CT' }]
console.log('live jobs:', JSON.stringify(shouldRunWebSearch(liveJobs, false)))
console.log('live query:', buildConciseSearchQuery(liveJobs, inferSearchTopic(liveJobs)))

const local = [
  { role: 'user', content: 'Help me find local resources' },
  { role: 'assistant', content: 'What city or ZIP?' },
  { role: 'user', content: 'Middletown CT 06457' },
]
console.log('location follow-up:', JSON.stringify(shouldRunWebSearch(local, false)))

const liveLocal = [{ role: 'user', content: 'Find workforce programs near Middletown CT' }]
console.log('live local:', JSON.stringify(shouldRunWebSearch(liveLocal, false)))

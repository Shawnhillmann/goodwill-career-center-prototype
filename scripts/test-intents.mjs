import { matchStarterPrompt } from '../server/lib/starterPrompts.ts'
import {
  buildConciseSearchQuery,
  inferSearchTopicFromUserMessages,
  isAffirmativeSearchReply,
  isDocumentOrCoachingTask,
  isExplicitWebSearchCommand,
  resolveWebSearchAction,
} from '../server/lib/searchIntent.ts'

const samples = [
  'Help me find a job',
  'Help me find local resources',
  'middletown ct, 06457',
  'yes',
  'search online',
  'job fairs near middletown ct',
  'tailor my resume for this job',
]

for (const m of samples) {
  const topic = inferSearchTopicFromUserMessages([{ role: 'user', content: m }])
  const query = buildConciseSearchQuery([{ role: 'user', content: m }], topic)
  console.log(
    JSON.stringify({
      m,
      starter: matchStarterPrompt(m),
      doc: isDocumentOrCoachingTask(m),
      explicit: isExplicitWebSearchCommand(m),
      affirmative: isAffirmativeSearchReply(m),
      topic,
      query,
    }),
  )
}

const followUp = resolveWebSearchAction(
  [
    { role: 'user', content: 'Help me find local resources' },
    { role: 'assistant', content: 'What city and state or ZIP code?' },
    { role: 'user', content: 'Middletown CT, 06457' },
    {
      role: 'assistant',
      content: 'I can look up Goodwill centers and workshops near you. Would you like me to do that?',
    },
  ],
  'yes',
  {
    pendingWebSearchConfirmation: {
      topic: 'local_resources',
      querySoFar: 'Goodwill career center training workshops Middletown CT 06457',
    },
  },
)
console.log('follow-up confirm:', JSON.stringify(followUp))

const noPendingYes = resolveWebSearchAction(
  [
    { role: 'user', content: 'Help me find a job' },
    { role: 'assistant', content: 'Would you like help with your resume?' },
  ],
  'yes',
)
console.log('yes without pending (should not search):', JSON.stringify(noPendingYes))

const vagueJob = resolveWebSearchAction([{ role: 'user', content: 'help me find a job' }], 'help me find a job')
console.log('vague job ask (should not search):', JSON.stringify(vagueJob))

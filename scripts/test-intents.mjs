import { detectSearchIntent, isDocumentOrCoachingTask } from '../server/lib/searchIntent.ts'
import { matchStarterPrompt } from '../server/lib/starterPrompts.ts'

const msgs = [
  'Help me find a job',
  'Explore career options',
  'Write my resume / CV',
  'Help me find local resources',
  'Practice interview questions',
  'Help me build skills',
  'hello',
]
for (const m of msgs) {
  console.log(JSON.stringify({ m, starter: matchStarterPrompt(m), intent: detectSearchIntent(m), doc: isDocumentOrCoachingTask(m) }))
}

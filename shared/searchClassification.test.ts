import { describe, expect, it } from 'vitest'
import { classifyUserRequest } from './searchClassification'

type ExpectedRoute = 'SEARCH_CONFIRMATION' | 'COACHING_RESPONSE' | 'CLARIFICATION_REQUIRED'

function route(prompt: string): ExpectedRoute {
  const assessment = classifyUserRequest(prompt)
  if (assessment.classification === 'coaching') return 'COACHING_RESPONSE'
  if (assessment.classification === 'clarification_required') return 'CLARIFICATION_REQUIRED'
  return 'SEARCH_CONFIRMATION'
}

const EXAMPLES: Array<{ prompt: string; expected: ExpectedRoute; reason: string }> = [
  {
    prompt: 'What is the current Connecticut minimum wage?',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Current jurisdiction-specific wage fact',
  },
  {
    prompt: 'minimum wage ct',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Wage topic with state signal',
  },
  {
    prompt: 'OSHA training near Hartford',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Local compliance training lookup',
  },
  {
    prompt: 'Amazon warehouse jobs near me',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Employer + role + near-me job search',
  },
  {
    prompt: 'What companies are hiring in New Haven?',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Hiring lookup with location',
  },
  {
    prompt: 'Who runs Goodwill in Boston?',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Leadership lookup with org + location',
  },
  {
    prompt: 'Current unemployment benefits in Connecticut',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Current policy/benefits with jurisdiction',
  },
  {
    prompt: 'Search for welding schools near me',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Explicit search verb + training + location',
  },
  {
    prompt: 'Find local housing assistance programs',
    expected: 'CLARIFICATION_REQUIRED',
    reason: 'Resource intent but missing location',
  },
  {
    prompt: 'Find local housing assistance programs in Hartford CT',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Local resource program with location',
  },
  {
    prompt: 'What is a resume?',
    expected: 'COACHING_RESPONSE',
    reason: 'Evergreen educational concept',
  },
  {
    prompt: 'What is customer service?',
    expected: 'COACHING_RESPONSE',
    reason: 'Evergreen career concept',
  },
  {
    prompt: 'What is networking?',
    expected: 'COACHING_RESPONSE',
    reason: 'Evergreen career concept',
  },
  {
    prompt: 'How do I prepare for an interview?',
    expected: 'COACHING_RESPONSE',
    reason: 'Coaching how-to request',
  },
  {
    prompt: 'What is OSHA?',
    expected: 'COACHING_RESPONSE',
    reason: 'General knowledge concept without local/current lookup signals',
  },
  {
    prompt: 'How do cover letters work?',
    expected: 'COACHING_RESPONSE',
    reason: 'Educational explanation request',
  },
  {
    prompt: 'What are transferable skills?',
    expected: 'COACHING_RESPONSE',
    reason: 'Evergreen educational concept',
  },
  {
    prompt: 'john smith',
    expected: 'CLARIFICATION_REQUIRED',
    reason: 'Ambiguous person name only',
  },
  {
    prompt: 'goodwill',
    expected: 'CLARIFICATION_REQUIRED',
    reason: 'Ambiguous organization only',
  },
  {
    prompt: 'john smith goodwill',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Person with organization context (medium confidence)',
  },
  {
    prompt: 'microsoft ceo',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Public leadership lookup (medium confidence)',
  },
  {
    prompt: 'resources',
    expected: 'CLARIFICATION_REQUIRED',
    reason: 'Ambiguous generic topic',
  },
  {
    prompt: 'amazon',
    expected: 'CLARIFICATION_REQUIRED',
    reason: 'Ambiguous organization only',
  },
  {
    prompt: 'jobs',
    expected: 'CLARIFICATION_REQUIRED',
    reason: 'Job topic without role or location',
  },
  {
    prompt: 'goodwill locations in boston',
    expected: 'SEARCH_CONFIRMATION',
    reason: 'Organization + intent + location',
  },
]

describe('searchClassification', () => {
  it.each(EXAMPLES)('routes "$prompt" to $expected', ({ prompt, expected }) => {
    expect(route(prompt)).toBe(expected)
  })

  it('scores high confidence for specific local searches', () => {
    expect(classifyUserRequest('current ct minimum wage').confidence).toBe('high')
    expect(classifyUserRequest('osha classes near hartford').confidence).toBe('high')
    expect(classifyUserRequest('amazon jobs near me').confidence).toBe('high')
  })

  it('scores medium confidence for partially specific searches', () => {
    expect(classifyUserRequest('john smith goodwill').confidence).toBe('medium')
    expect(classifyUserRequest('microsoft ceo').confidence).toBe('medium')
  })

  it('marks ambiguous entities for clarification', () => {
    expect(classifyUserRequest('john smith').ambiguousEntity).toBe('john smith')
    expect(classifyUserRequest('goodwill').ambiguousEntity).toBe('goodwill')
  })

  it('keeps coaching and search separate for similar topics', () => {
    expect(route('What is OSHA?')).toBe('COACHING_RESPONSE')
    expect(route('OSHA training near Hartford')).toBe('SEARCH_CONFIRMATION')
  })
})

import type { SearchPlan } from '../../shared/searchConfirm.js'

export function buildSearchUnavailableReply(plan: SearchPlan | null): string {
  const criteria = plan?.bullets.map((b) => `• ${ b }`).join('\n') ?? ''
  const criteriaBlock = criteria ? `\n\nYour approved search criteria:\n${ criteria }` : ''

  return [
    'Thanks for confirming. I was not able to run a live web search from here just now, so I do not have current listings to show you.',
    criteriaBlock,
    '',
    'Here are strong next steps:',
    '• Search Indeed, LinkedIn, or CT Department of Labor with keywords from your criteria',
    '• Paste a direct link to any posting you like — I can explain the role and help with your resume or application',
    '• Tell me if you want help tailoring your resume for accounting roles in the Middletown area',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildSearchEmptyResultReply(plan: SearchPlan): string {
  const criteria = plan.bullets.map((b) => `• ${ b }`).join('\n')
  return [
    'I ran your approved search but did not get usable listing details back.',
    '',
    'Approved criteria:',
    criteria,
    '',
    'Try pasting a direct job link here, or search Indeed/LinkedIn with those terms and bring back any postings you want help with.',
  ].join('\n')
}

export function buildSearchPlanMissingReply(): string {
  return [
    'Thanks for confirming. I want to search with the right details, but I could not read the search preview from our conversation.',
    '',
    'Please ask me to show the search preview again, or paste the criteria you want searched.',
  ].join('\n')
}

import type { SearchPlan } from '../../shared/searchConfirm.js'
import { isJobCategoryPlan, planCriteriaSummary } from '../../shared/searchPlan.js'

function formatCriteriaBlock(plan: SearchPlan | null): string {
  if (!plan) return ''
  const summary = planCriteriaSummary(plan)
  return summary ? `\n\nYour approved search:\n${ summary }` : ''
}

function jobSpecificNextSteps(): string[] {
  return [
    '• Search Indeed, LinkedIn, or your state workforce site with keywords from your search',
    '• Paste a direct link to any result you like — I can explain it and help with your resume or application',
  ]
}

function generalNextSteps(): string[] {
  return [
    '• Try a more specific search — add a location, organization name, date range, or type of result',
    '• Paste a direct link or page text here if you have one',
  ]
}

export function buildSearchUnavailableReply(plan: SearchPlan | null): string {
  const criteriaBlock = formatCriteriaBlock(plan)
  const nextSteps = plan && isJobCategoryPlan(plan) ? jobSpecificNextSteps() : generalNextSteps()

  return [
    'Thanks for confirming. I was not able to run a live web search from here just now, so I do not have current results to show you.',
    criteriaBlock,
    '',
    'Here are strong next steps:',
    ...nextSteps,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildSearchEmptyResultReply(plan: SearchPlan): string {
  const criteria = planCriteriaSummary(plan)
  const nextSteps =
    isJobCategoryPlan(plan)
      ? 'Try pasting a direct job link here, or search Indeed/LinkedIn with those terms and bring back any results you want help with.'
      : 'Try a more specific search, such as adding a location, organization name, date range, or type of result. You can also paste a direct link or page text here.'

  return [
    'I ran the approved search but did not get usable results back.',
    '',
    'Approved search:',
    criteria,
    '',
    nextSteps,
  ].join('\n')
}

export function buildSearchPlanMissingReply(): string {
  return [
    'Thanks for confirming. I want to search with the right details, but I could not read the search plan from our conversation.',
    '',
    'Please ask me to show the search confirmation again, or describe what you want searched.',
  ].join('\n')
}

export type JobPlatform =
  | 'smartrecruiters'
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'workday'
  | 'adp'
  | 'apple'
  | 'linkedin'
  | 'indeed'
  | 'icims'
  | 'taleo'
  | 'successfactors'
  | 'bamboohr'
  | 'unknown'

export function detectJobPlatform(url: URL): JobPlatform {
  const host = url.hostname.toLowerCase()
  if (host.includes('jobs.apple.com')) return 'apple'
  if (host.includes('explore.jobs.') || host.includes('smartrecruiters')) return 'smartrecruiters'
  if (host.includes('greenhouse.io') || host.includes('boards.greenhouse')) return 'greenhouse'
  if (host.includes('lever.co')) return 'lever'
  if (host.includes('ashbyhq.com')) return 'ashby'
  if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) return 'workday'
  if (host.includes('workforcenow') || host.includes('adp.com')) return 'adp'
  if (host.includes('linkedin.com')) return 'linkedin'
  if (host.includes('indeed.com')) return 'indeed'
  if (host.includes('icims.com')) return 'icims'
  if (host.includes('taleo.net')) return 'taleo'
  if (host.includes('successfactors')) return 'successfactors'
  if (host.includes('bamboohr.com')) return 'bamboohr'
  return 'unknown'
}

export function platformFailureHint(platform: JobPlatform): string | undefined {
  switch (platform) {
    case 'adp':
      return 'ADP WorkforceNow often shows a browser compatibility page to automated clients. Paste the job description or open the posting in your browser and copy the text.'
    case 'linkedin':
    case 'indeed':
      return 'This job board often blocks automated access. Try the employer’s direct careers page link or paste the job description.'
    case 'workday':
      return 'Workday pages may require JavaScript. If content is missing, paste the job description.'
    default:
      return undefined
  }
}

export type QuickActionId =
  | 'find_jobs'
  | 'career_options'
  | 'resume_review'
  | 'interview_prep'
  | 'build_skills'
  | 'local_resources'

const QUICK_ACTION_IDS: QuickActionId[] = [
  'find_jobs',
  'career_options',
  'resume_review',
  'interview_prep',
  'build_skills',
  'local_resources',
]

export function isQuickActionId(value: unknown): value is QuickActionId {
  return typeof value === 'string' && (QUICK_ACTION_IDS as string[]).includes(value)
}

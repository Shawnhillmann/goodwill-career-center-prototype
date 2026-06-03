export type QuickActionId =
  | 'explore_careers'
  | 'build_resume'
  | 'help_apply'
  | 'practice_interviews'
  | 'career_plan'
  | 'local_resources'

const QUICK_ACTION_IDS: QuickActionId[] = [
  'explore_careers',
  'build_resume',
  'help_apply',
  'practice_interviews',
  'career_plan',
  'local_resources',
]

export function isQuickActionId(value: unknown): value is QuickActionId {
  return typeof value === 'string' && (QUICK_ACTION_IDS as string[]).includes(value)
}

/** Quick-action chip text (English and close translations) → conversational first turn, no web search. */

export type StarterPromptKind = 'job' | 'careers' | 'resume' | 'local' | 'interviews' | 'skills'

const STARTER_PATTERNS: Array<{ kind: StarterPromptKind; re: RegExp }> = [
  { kind: 'job', re: /\b(help\s+(me\s+)?)?find\s+(a\s+)?job\b|\bfind\s+work\b/i },
  { kind: 'careers', re: /\bexplore\s+career\s+options\b|\bcareer\s+options\b|\bexplore\s+(my\s+)?career\b/i },
  { kind: 'resume', re: /\b(write|create|draft|build)\s+(my\s+)?(resume|résumé|cv)\b|\bresume\s*\/\s*cv\b/i },
  { kind: 'local', re: /\b(find|get)\s+local\s+resources\b|\blocal\s+resources\b/i },
  { kind: 'interviews', re: /\bpractice\s+interview\b|\binterview\s+questions\b/i },
  { kind: 'skills', re: /\b(build|improve)\s+skills\b|\bhelp\s+(me\s+)?(build|with)\s+skills\b/i },
]

export function matchStarterPrompt(q: string): StarterPromptKind | null {
  const s = q.trim()
  if (!s || s.length > 120) return null
  for (const { kind, re } of STARTER_PATTERNS) {
    if (re.test(s)) return kind
  }
  return null
}

export const STARTER_TURN_INSTRUCTIONS: Record<StarterPromptKind, string> = {
  job:
    'The user tapped a starter about finding a job. Reply warmly in under 55 words. Ask if they would like you to search current job postings online. Do not search or list jobs yet. If asking permission, set offerWebSearch in JSON (topic: jobs, querySoFar: concise query with any known role/location).',
  careers:
    'The user wants to explore career options. Reply warmly in under 55 words. Ask exactly ONE question about what they enjoy or are curious about (types of work or industries). Do not list jobs or search the web yet.',
  resume:
    'The user wants help with a resume. Reply warmly in under 55 words. Ask exactly ONE question: do they have a resume to upload, or are they starting from scratch? Do not output a full resume yet unless they uploaded one.',
  local:
    'The user wants local career resources. Reply warmly in under 55 words. Ask exactly ONE question for their city and state (or ZIP). Do not search the web yet. offerWebSearch must be null until you have a location and are asking permission.',
  interviews:
    'The user wants interview practice. Reply warmly in under 55 words. Ask exactly ONE question about what role or type of job they are interviewing for. Do not run a long interview prep lecture.',
  skills:
    'The user wants to build skills. Reply warmly in under 55 words. Ask exactly ONE question about what kind of work or skill area they are interested in. Do not list long training catalogs.',
}

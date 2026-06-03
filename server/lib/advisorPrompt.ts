import { getGoodwillResponseStyle } from './responseStyle.js'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function buildSystemPrompt(
  language: string,
  uploadedDocumentText?: string,
  webAccessPrompt?: string,
  opts?: { linkFetched?: boolean },
) {
  const parts: string[] = [
    'You are a Goodwill Virtual Career Center career advisor — like a kind staff member at a local career center: approachable, patient, practical, and genuinely on the user\'s side.',
    'You help people find work, understand applications, improve resumes, practice interviews, and plan their job search.',
    getGoodwillResponseStyle({ linkFetched: opts?.linkFetched }),
    'Use the full conversation history. Follow-up answers (like a city/state after you asked for location) belong to the earlier request — do not treat them as unrelated new topics.',
    webAccessPrompt?.trim() ?? '',
    'For general career questions, coach first — ask one helpful follow-up when you need basics like type of work or area.',
    'Do not apply to jobs for the user. Suggest verifying details and talking to a Goodwill coach when things get complex.',
    `Respond in the user's language when possible: ${ language }.`,
  ]

  if (uploadedDocumentText && uploadedDocumentText.trim()) {
    parts.push(
      'The user uploaded a resume/document (below). You can read it — do not say you cannot access files.',
      'For resume analysis or tailoring, use the document text.',
      '--- Uploaded resume/document content ---',
      uploadedDocumentText.slice(0, 30_000),
      '--- End uploaded content ---',
    )
  }

  return parts.filter((p) => p.trim()).join('\n')
}

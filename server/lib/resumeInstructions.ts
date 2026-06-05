/** Coaching turn: gather info and ask for confirm before formatted output. */
export const RESUME_PREP_INSTRUCTIONS = `
RESUME PREPARATION (mandatory for this reply — user has NOT confirmed generation yet):
- Do NOT output a formatted resume, ALL CAPS section headers (PROFESSIONAL SUMMARY, WORK EXPERIENCE, etc.), or a sample resume document.
- Coach in normal conversation: ask for missing details, suggest improvements, or summarize what you will include.
- When you have enough to generate, end with a clear gate: say you will generate the resume with the information discussed, and ask the user to reply CONFIRM RESUME or tell you which details to change.
- Example close: "I'll generate your resume with this information. Reply CONFIRM RESUME, or let me know which details to change."
- Never say "here is your resume" or paste resume layout until they confirm.
`.trim()

/** System instructions appended when generating or rewriting resume/CV content only. */
export const RESUME_OUTPUT_INSTRUCTIONS = `
RESUME OUTPUT RULES (mandatory — overrides conversational style for this reply):
- Return ONLY the resume document. No greetings, explanations, process notes, disclaimers, samples, or text before/after the resume.
- Do NOT use markdown code fences (\`\`\`). Do NOT say "here is", "I've updated", "paste this", "sample resume", "resume content only", or similar.
- Do NOT include meta lines like "HERE'S A CLEAN PROFESSIONAL SAMPLE RESUME" or "THIS IS RESUME CONTENT ONLY".
- The first line must be the candidate's full name (ALL CAPS preferred, e.g. MICHAEL HARRIS) — a person's name, not a sentence.
- Line 2: professional title/headline (e.g. Digital Marketing | SEO | SEM | Content Marketing).
- Line 3: one contact line with items separated by | (City, State | email | phone | LinkedIn URL). Do NOT put contact info under PROFESSIONAL SUMMARY.
- Use each section header exactly once on its own line in ALL CAPS (never repeat PROFESSIONAL SUMMARY or other headers):
  PROFESSIONAL SUMMARY
  WORK EXPERIENCE
  EDUCATION
  SKILLS
  CERTIFICATIONS
  (include only sections that apply; omit empty sections)
- PROFESSIONAL SUMMARY: one short paragraph, no bullets.
- WORK EXPERIENCE — each role exactly:
  Job Title (own line, may use **bold**)
  Company Name | City, State | Month Year – Month Year (or Present)
  - accomplishment with measurable impact when possible
  - accomplishment
  (3–5 bullets per recent role; fewer for older roles)
- EDUCATION — each entry:
  Degree or Program Name (own line)
  Institution Name | City, State | Graduated: Year (or date range)
- SKILLS: grouped bullet lines (e.g. - Digital Marketing Strategy, SEO, Google Analytics)
- CERTIFICATIONS: one certification per bullet line.
- Focus on outcomes, metrics, and impact. Use consistent date formatting (Month Year – Month Year).
- Keep to one page when reasonable: concise bullets, no filler, no redundant sections.
- ATS-friendly plain structure; no tables or multi-column layout in the text.
`.trim()

import { formatSmartRecruitersPosting, parseSmartRecruitersJobUrl } from './pageContentExtract.js'

const API_TIMEOUT_MS = 8_000

export async function fetchSmartRecruitersJobText(url: URL): Promise<string | null> {
  const parsed = parseSmartRecruitersJobUrl(url)
  if (!parsed) return null

  const apiUrl = `https://api.smartrecruiters.com/v1/companies/${ encodeURIComponent(parsed.company) }/postings/${ encodeURIComponent(parsed.postingId) }`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; GoodwillAICareerCenter/1.0; job-link-review)',
      },
    })
    if (!response.ok) return null
    const data = (await response.json()) as Record<string, unknown>
    const text = formatSmartRecruitersPosting(data)
    return text.length >= 80 ? text : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

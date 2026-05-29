import type { CareerCenter } from '../data/careerCenters'

export function normalizeZipInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5)
}

export function parseZipCode(zip: string): number | null {
  const normalized = normalizeZipInput(zip)
  if (normalized.length !== 5) return null
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : null
}

/** Rough sort by numeric ZIP distance (placeholder until real geocoding is available). */
export function sortCentersByZip(centers: CareerCenter[], userZip: string): CareerCenter[] {
  const user = parseZipCode(userZip)
  if (user === null) return [...centers]

  return [...centers].sort((a, b) => {
    const zipA = parseZipCode(a.zip) ?? Number.MAX_SAFE_INTEGER
    const zipB = parseZipCode(b.zip) ?? Number.MAX_SAFE_INTEGER
    return Math.abs(zipA - user) - Math.abs(zipB - user)
  })
}

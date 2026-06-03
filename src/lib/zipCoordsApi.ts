import type { Coordinates } from './careerCenterZip'
import { parseZipCode } from './careerCenterZip'

export async function fetchZipCoordinates(zipInput: string): Promise<Coordinates | null> {
  const zip = parseZipCode(zipInput)
  if (!zip) return null

  try {
    const resp = await fetch(`/api/zip/${ zip }`)
    if (!resp.ok) return null
    const data = (await resp.json()) as { lat?: number; lng?: number }
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return null
    return { lat: data.lat, lng: data.lng }
  } catch {
    return null
  }
}

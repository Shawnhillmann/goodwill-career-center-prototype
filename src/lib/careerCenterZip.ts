import type { CareerCenter } from '../data/careerCenters'

export function normalizeZipInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5)
}

export function parseZipCode(zip: string): string | null {
  const normalized = normalizeZipInput(zip)
  return normalized.length === 5 ? normalized : null
}

export type Coordinates = { lat: number; lng: number }

const EARTH_RADIUS_MILES = 3958.8

/** Great-circle distance in miles between two lat/lng points. */
export function haversineDistanceMiles(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export type RankedCareerCenter = CareerCenter & {
  distanceMiles: number | null
}

export type ZipSortResult = {
  centers: RankedCareerCenter[]
}

function defaultCenterOrder(centers: CareerCenter[]): RankedCareerCenter[] {
  return [...centers]
    .sort((a, b) => a.city.localeCompare(b.city))
    .map((center) => ({ ...center, distanceMiles: null }))
}

/** Sort career centers by distance from the user's coordinates. */
export function sortCentersByDistance(
  centers: CareerCenter[],
  userCoords: Coordinates | null,
): ZipSortResult {
  if (!userCoords) {
    return { centers: defaultCenterOrder(centers) }
  }

  const ranked = centers.map((center) => ({
    ...center,
    distanceMiles: haversineDistanceMiles(userCoords, {
      lat: center.latitude,
      lng: center.longitude,
    }),
  }))

  ranked.sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
  return { centers: ranked }
}

declare module 'zipcodes' {
  export type ZipRecord = {
    zip: string
    latitude: number
    longitude: number
    city: string
    state: string
    country: string
  }

  export function lookup(zip: string): ZipRecord | undefined
}

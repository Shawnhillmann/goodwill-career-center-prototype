export type CareerCenter = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  latitude: number
  longitude: number
}

export const careerCenters: CareerCenter[] = [
  {
    id: 'bridgeport',
    name: 'Goodwill Bridgeport Career Center',
    address: '165 Ocean Terrace',
    city: 'Bridgeport',
    state: 'CT',
    zip: '06605',
    phone: '(203) 581-5040',
    latitude: 41.1668,
    longitude: -73.2163,
  },
  {
    id: 'enfield',
    name: 'Goodwill Enfield Career Center',
    address: '53 Palomba Drive',
    city: 'Enfield',
    state: 'CT',
    zip: '06082',
    phone: '(203) 581-5324',
    latitude: 41.989,
    longitude: -72.5652,
  },
  {
    id: 'hartford',
    name: 'Goodwill Hartford Career Center',
    address: '315 New Park Avenue',
    city: 'Hartford',
    state: 'CT',
    zip: '06106',
    phone: '(860) 856-2301',
    latitude: 41.7498,
    longitude: -72.6947,
  },
  {
    id: 'norwalk',
    name: 'Goodwill Norwalk Career Center',
    address: '15 Cross Street',
    city: 'Norwalk',
    state: 'CT',
    zip: '06851',
    phone: '(203) 581-5381',
    latitude: 41.1323,
    longitude: -73.4058,
  },
  {
    id: 'shelton',
    name: 'Goodwill Shelton Career Center',
    address: '397 Bridgeport Avenue',
    city: 'Shelton',
    state: 'CT',
    zip: '06484',
    phone: '(203) 581-5384',
    latitude: 41.3047,
    longitude: -73.1294,
  },
  {
    id: 'waterbury',
    name: 'Goodwill Waterbury Career Center',
    address: '943 Wolcott Street',
    city: 'Waterbury',
    state: 'CT',
    zip: '06705',
    phone: '(203) 581-5382',
    latitude: 41.5503,
    longitude: -72.9963,
  },
]

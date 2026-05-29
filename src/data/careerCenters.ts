export type CareerCenter = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
}

/** Placeholder locations — replace with real Goodwill career center data when available. */
export const careerCenters: CareerCenter[] = [
  {
    id: 'dc-metro',
    name: 'Goodwill of Greater Washington — Career Center',
    address: '2200 South Dakota Ave NE',
    city: 'Washington',
    state: 'DC',
    zip: '20018',
    phone: '(202) 555-0142',
  },
  {
    id: 'atlanta',
    name: 'Goodwill of North Georgia — Career Center',
    address: '3333 Buford Hwy NE',
    city: 'Buford',
    state: 'GA',
    zip: '30519',
    phone: '(770) 555-0198',
  },
  {
    id: 'chicago',
    name: 'Goodwill Industries of Metropolitan Chicago — Career Center',
    address: '1141 W Washington Blvd',
    city: 'Chicago',
    state: 'IL',
    zip: '60607',
    phone: '(312) 555-0163',
  },
  {
    id: 'dallas',
    name: 'Goodwill Industries of Dallas — Career Center',
    address: '3025 N Westmoreland Rd',
    city: 'Dallas',
    state: 'TX',
    zip: '75212',
    phone: '(214) 555-0177',
  },
  {
    id: 'denver',
    name: 'Goodwill of Colorado — Career Center',
    address: '6850 Federal Blvd',
    city: 'Denver',
    state: 'CO',
    zip: '80221',
    phone: '(303) 555-0134',
  },
  {
    id: 'phoenix',
    name: 'Goodwill of Central and Northern Arizona — Career Center',
    address: '2626 W Beryl Ave',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85021',
    phone: '(602) 555-0189',
  },
  {
    id: 'seattle',
    name: 'Seattle Goodwill — Career Center',
    address: '700 Dearborn Pl S',
    city: 'Seattle',
    state: 'WA',
    zip: '98144',
    phone: '(206) 555-0156',
  },
  {
    id: 'los-angeles',
    name: 'Goodwill Southern California — Career Center',
    address: '342 N San Fernando Blvd',
    city: 'Burbank',
    state: 'CA',
    zip: '91502',
    phone: '(818) 555-0121',
  },
]

// Popular locations for autocomplete
export const POPULAR_LOCATIONS = [
  // United States
  'California, United States',
  'New York, United States',
  'Texas, United States',
  'Florida, United States',
  'Illinois, United States',
  'Washington, United States',
  'Massachusetts, United States',
  'Georgia, United States',
  
  // United Kingdom
  'England, United Kingdom',
  'Scotland, United Kingdom',
  'Wales, United Kingdom',
  
  // Canada
  'Ontario, Canada',
  'British Columbia, Canada',
  'Quebec, Canada',
  'Alberta, Canada',
  
  // Malaysia
  'Kuala Lumpur, Malaysia',
  'Selangor, Malaysia',
  'Penang, Malaysia',
  'Johor, Malaysia',
  'Kedah, Malaysia',
  'Perak, Malaysia',
  'Sabah, Malaysia',
  'Sarawak, Malaysia',
  
  // Singapore
  'Singapore, Singapore',
  
  // Australia
  'New South Wales, Australia',
  'Victoria, Australia',
  'Queensland, Australia',
  'Western Australia, Australia',
  
  // India
  'Maharashtra, India',
  'Karnataka, India',
  'Delhi, India',
  'Tamil Nadu, India',
  'Gujarat, India',
  
  // Europe
  'Paris, France',
  'Berlin, Germany',
  'Madrid, Spain',
  'Rome, Italy',
  'Amsterdam, Netherlands',
  'Brussels, Belgium',
  'Stockholm, Sweden',
  'Copenhagen, Denmark',
  'Oslo, Norway',
  'Helsinki, Finland',
  
  // Asia
  'Tokyo, Japan',
  'Seoul, South Korea',
  'Beijing, China',
  'Shanghai, China',
  'Hong Kong, Hong Kong',
  'Bangkok, Thailand',
  'Ho Chi Minh City, Vietnam',
  'Jakarta, Indonesia',
  'Manila, Philippines',
  
  // Middle East
  'Dubai, United Arab Emirates',
  'Abu Dhabi, United Arab Emirates',
  'Riyadh, Saudi Arabia',
  'Tel Aviv, Israel',
  
  // Africa
  'Lagos, Nigeria',
  'Nairobi, Kenya',
  'Cairo, Egypt',
  'Cape Town, South Africa',
  
  // South America
  'São Paulo, Brazil',
  'Buenos Aires, Argentina',
  'Santiago, Chile',
  'Bogotá, Colombia',
  'Lima, Peru',
  
  // Remote
  'Remote',
];

export function filterLocations(query: string): string[] {
  if (!query || query.length < 2) {
    return POPULAR_LOCATIONS.slice(0, 10); // Show top 10 by default
  }
  
  const lowerQuery = query.toLowerCase();
  return POPULAR_LOCATIONS.filter(location => 
    location.toLowerCase().includes(lowerQuery)
  ).slice(0, 10); // Limit to 10 results
}


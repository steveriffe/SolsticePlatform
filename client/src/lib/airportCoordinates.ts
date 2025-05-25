// This file provides coordinates for airports to be used in flight visualizations

// Airport coordinates map: IATA code -> [longitude, latitude]
export const airportCoordinates: Record<string, [number, number]> = {
  // United States
  'ANC': [-149.9961, 61.1741], // Anchorage
  'ATL': [-84.4277, 33.6407], // Atlanta
  'BNA': [-86.6782, 36.1245], // Nashville
  'BOS': [-71.0096, 42.3656], // Boston
  'CLE': [-81.8495, 41.4117], // Cleveland
  'CLT': [-80.9431, 35.2139], // Charlotte
  'DEN': [-104.6737, 39.8561], // Denver
  'DFW': [-97.0380, 32.8968], // Dallas/Fort Worth
  'DTW': [-83.3534, 42.2124], // Detroit
  'GEG': [-117.5339, 47.6199], // Spokane
  'EWR': [-74.1745, 40.6895], // Newark
  'HNL': [-157.9251, 21.3245], // Honolulu
  'IAD': [-77.4558, 38.9445], // Washington Dulles
  'JFK': [-73.7781, 40.6413], // New York JFK
  'LAS': [-115.1537, 36.0840], // Las Vegas
  'LAX': [-118.4085, 33.9416], // Los Angeles
  'LGA': [-73.8726, 40.7772], // New York LaGuardia
  'MCO': [-81.3085, 28.4312], // Orlando
  'MDW': [-87.7522, 41.7868], // Chicago Midway
  'MIA': [-80.2906, 25.7932], // Miami
  'MSP': [-93.2218, 44.8820], // Minneapolis/St. Paul
  'ORD': [-87.9073, 41.9742], // Chicago O'Hare
  'PDX': [-122.5969, 45.5887], // Portland
  'PHL': [-75.2437, 39.8729], // Philadelphia
  'PHX': [-112.0101, 33.4352], // Phoenix
  'SAN': [-117.1897, 32.7336], // San Diego
  'SEA': [-122.3088, 47.4502], // Seattle
  'SFO': [-122.3790, 37.6213], // San Francisco
  'SLC': [-111.9779, 40.7884], // Salt Lake City
  'TPA': [-82.5332, 27.9756], // Tampa

  // Europe
  'LHR': [-0.4543, 51.4700], // London Heathrow
  'FRA': [8.5622, 50.0379], // Frankfurt
  'CDG': [2.5479, 49.0097], // Paris Charles de Gaulle
  'AMS': [4.7641, 52.3086], // Amsterdam
  'MAD': [-3.5673, 40.4983], // Madrid
  'FCO': [12.2531, 41.8003], // Rome
  'MUC': [11.7861, 48.3537], // Munich
  'ZRH': [8.5555, 47.4647], // Zurich
  'VIE': [16.5697, 48.1103], // Vienna
  'BRU': [4.4834, 50.9014], // Brussels
  
  // Asia
  'HND': [139.7821, 35.5493], // Tokyo Haneda
  'PEK': [116.5977, 40.0799], // Beijing
  'HKG': [113.9145, 22.3080], // Hong Kong
  'SIN': [103.9915, 1.3644], // Singapore
  'BKK': [100.7501, 13.6900], // Bangkok
  'DXB': [55.3657, 25.2532], // Dubai
  'DEL': [77.1003, 28.5562], // Delhi
  'ICN': [126.4505, 37.4602], // Seoul
  'KUL': [101.7101, 2.7456], // Kuala Lumpur
  'BOM': [72.8686, 19.0896], // Mumbai

  // Australia/Oceania
  'SYD': [151.1772, -33.9461], // Sydney
  'MEL': [144.8430, -37.6690], // Melbourne
  'BNE': [153.1175, -27.3842], // Brisbane
  'AKL': [174.7924, -37.0082], // Auckland
  'PER': [115.9672, -31.9402], // Perth

  // Add BHX (Birmingham, UK)
  'BHX': [-1.7459, 52.4539]
};

/**
 * Get airport coordinates by IATA code
 * @param iataCode The IATA airport code
 * @returns [longitude, latitude] or a default if not found
 */
export function getAirportCoordinates(iataCode: string): [number, number] {
  // Ensure uppercase for airport code
  const uppercaseIata = iataCode.toUpperCase();
  const coordinates = airportCoordinates[uppercaseIata];
  
  if (coordinates) {
    return coordinates;
  } else {
    // Default to a location in the middle of the US if coordinates not found
    console.warn(`No coordinates found for airport: ${iataCode}`);
    return [-98.5, 39.5]; 
  }
}

/**
 * Check if coordinates are available for an airport
 * @param iataCode The IATA airport code
 * @returns true if coordinates exist
 */
export function hasAirportCoordinates(iataCode: string): boolean {
  // Ensure uppercase for airport code
  const uppercaseIata = iataCode.toUpperCase();
  return !!airportCoordinates[uppercaseIata];
}
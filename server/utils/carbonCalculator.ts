/**
 * Carbon footprint calculation utilities for the server
 */

/**
 * Calculate carbon footprint in kilograms of CO2 for a flight
 * 
 * Uses a distance-based approach with different emissions factors for short, medium and long flights
 * 
 * @param distanceMiles Flight distance in miles
 * @param aircraftType Optional aircraft type for more accurate calculation
 * @returns Carbon footprint in kg of CO2
 */
export function calculateCarbonFootprint(
  distanceMiles: number,
  aircraftType?: string | null
): number {
  if (!distanceMiles || distanceMiles <= 0) {
    return 0;
  }
  
  // Convert miles to kilometers for calculation
  const distanceKm = distanceMiles * 1.60934;
  
  // Base emission factors in kg CO2 per passenger per km
  let emissionFactor: number;
  
  // Determine emission factor based on flight distance
  if (distanceKm < 500) {
    // Short-haul flights have higher emissions per km
    emissionFactor = 0.255;
  } else if (distanceKm < 3000) {
    // Medium-haul flights
    emissionFactor = 0.156;
  } else {
    // Long-haul flights
    emissionFactor = 0.139;
  }
  
  // Apply simple aircraft adjustment if available
  if (aircraftType) {
    // Adjust emissions based on aircraft type
    if (aircraftType.includes('787') || aircraftType.includes('A350')) {
      // More fuel-efficient modern aircraft
      emissionFactor *= 0.85;
    } else if (aircraftType.includes('747') || aircraftType.includes('A380')) {
      // Older or very large aircraft
      emissionFactor *= 1.15;
    }
  }
  
  // Radiative forcing index to account for non-CO2 effects at altitude
  const rfi = 1.9;
  
  // Calculate total carbon footprint
  const carbonFootprint = distanceKm * emissionFactor * rfi;
  
  // Round to 2 decimal places
  return Math.round(carbonFootprint * 100) / 100;
}
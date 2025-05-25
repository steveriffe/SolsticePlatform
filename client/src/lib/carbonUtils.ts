/**
 * Carbon footprint calculation utilities for Solstice Navigator
 * 
 * Calculations based on a simplified model for educational purposes.
 * For more accurate calculations, consider using specialized APIs like:
 * - atmosfair API
 * - ICAO Carbon Emissions Calculator
 * - climatecare.org
 */

/**
 * Calculate carbon footprint in kilograms of CO2 for a flight
 * 
 * Uses a distance-based approach with different emissions factors for short, medium and long flights
 * 
 * @param distanceMiles Flight distance in miles
 * @param passengerCount Number of passengers (defaults to 1)
 * @param aircraftType Optional aircraft type for more accurate calculation
 * @returns Carbon footprint in kg of CO2
 */
export function calculateCarbonFootprint(
  distanceMiles: number,
  passengerCount: number = 1,
  aircraftType?: string
): number {
  if (!distanceMiles || distanceMiles <= 0) {
    return 0;
  }
  
  // Convert miles to kilometers for calculation
  const distanceKm = distanceMiles * 1.60934;
  
  // Base emission factors in kg CO2 per passenger per km
  // These are average values - real calculations are much more complex
  let emissionFactor: number;
  
  // Determine emission factor based on flight distance
  if (distanceKm < 500) {
    // Short-haul flights have higher emissions per km due to takeoff/landing
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
  // This multiplier accounts for the additional warming effects of emissions at cruising altitude
  const rfi = 1.9;
  
  // Calculate total carbon footprint
  const carbonFootprint = distanceKm * emissionFactor * rfi * passengerCount;
  
  // Round to 2 decimal places
  return Math.round(carbonFootprint * 100) / 100;
}

/**
 * Format carbon footprint with appropriate unit
 * 
 * @param carbonKg Carbon footprint in kg
 * @returns Formatted string with appropriate unit (kg or tonnes)
 */
export function formatCarbonFootprint(carbonKg: number): string {
  if (carbonKg >= 1000) {
    // Convert to tonnes for larger values
    return `${(carbonKg / 1000).toFixed(2)} tonnes CO₂e`;
  } else {
    return `${carbonKg.toFixed(2)} kg CO₂e`;
  }
}

/**
 * Estimate the cost to offset carbon emissions
 * 
 * @param carbonKg Carbon footprint in kg
 * @returns Estimated cost in USD to offset emissions
 */
export function estimateOffsetCost(carbonKg: number): number {
  // Average offset cost per tonne of CO2 (varies by provider)
  const costPerTonneCO2 = 15; // USD
  
  // Convert kg to tonnes and calculate cost
  const carbonTonnes = carbonKg / 1000;
  const cost = carbonTonnes * costPerTonneCO2;
  
  // Round to 2 decimal places
  return Math.max(Math.round(cost * 100) / 100, 0.5); // Minimum cost of $0.50
}

/**
 * Format offset cost with currency symbol
 * 
 * @param cost Cost in USD
 * @returns Formatted cost string
 */
export function formatOffsetCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}
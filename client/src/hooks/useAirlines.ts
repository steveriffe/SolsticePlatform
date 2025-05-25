import { useQuery } from "@tanstack/react-query";
import { Airline } from "@shared/schema";

/**
 * Hook to fetch and manage airline data
 * 
 * @returns Object containing airlines data, loading state, and error state
 */
export function useAirlines() {
  const { 
    data: airlines,
    isLoading,
    isError,
    error
  } = useQuery<Airline[]>({
    queryKey: ['/api/airlines'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    airlines: airlines || [],
    isLoading,
    isError,
    error
  };
}

/**
 * Get airline name from code
 * 
 * @param code IATA airline code (e.g., 'AA', 'DL')
 * @param airlines Array of airlines from useAirlines
 * @returns Airline name or the code if not found
 */
export function getAirlineName(code: string, airlines: Airline[]) {
  if (!code) return '';
  
  const airline = airlines.find(a => 
    a.airlineId.toUpperCase() === code.toUpperCase()
  );
  
  return airline ? airline.airlineName : code;
}

/**
 * Get airline color from code
 * 
 * @param code IATA airline code
 * @param airlines Array of airlines from useAirlines
 * @returns Primary brand color or a fallback color
 */
export function getAirlineColor(code: string, airlines: Airline[]) {
  // Medium warm grey for unknown airlines
  const warmGreyColor = '#A19889';
  
  if (!code) return warmGreyColor;
  
  const airline = airlines.find(a => 
    a.airlineId.toUpperCase() === code.toUpperCase()
  );
  
  return airline?.brandColorPrimary || warmGreyColor;
}
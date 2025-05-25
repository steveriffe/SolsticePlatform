import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// North American Airline data with proper colors
const northAmericanAirlines = [
  { code: 'AA', name: 'American Airlines', color: '#0078D2' },
  { code: 'DL', name: 'Delta Air Lines', color: '#E01933' },
  { code: 'UA', name: 'United Airlines', color: '#002244' },
  { code: 'AS', name: 'Alaska Airlines', color: '#0060AB' },
  { code: 'WN', name: 'Southwest Airlines', color: '#304CB2' },
  { code: 'B6', name: 'JetBlue Airways', color: '#003876' },
  { code: 'AC', name: 'Air Canada', color: '#D22630' },
  { code: 'WS', name: 'WestJet', color: '#0F3583' },
  { code: 'F9', name: 'Frontier Airlines', color: '#00A650' },
  { code: 'NK', name: 'Spirit Airlines', color: '#2D3092' },
  { code: 'G4', name: 'Allegiant Air', color: '#FFBF27' },
  { code: 'HA', name: 'Hawaiian Airlines', color: '#5A0478' }
];

export default function AirlineColorUpdater() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  
  // Get current airlines
  const { data: airlines } = useQuery({
    queryKey: ["/api/airlines"],
  });
  
  // Function to update a single airline
  const updateAirline = async (airline: { code: string, name: string, color: string }) => {
    try {
      await apiRequest('PUT', '/api/flights/airline', {
        airlineId: airline.code,
        airlineName: airline.name,
        brandColorPrimary: airline.color
      });
      return true;
    } catch (error) {
      console.error(`Error updating ${airline.code}:`, error);
      return false;
    }
  };
  
  // Update all North American airlines
  const updateAirlineColors = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    toast({
      title: "Updating airlines...",
      description: "Adding colors and names to airlines"
    });
    
    let successCount = 0;
    
    // Create a direct update through SQL for each airline
    for (const airline of northAmericanAirlines) {
      try {
        // Find existing airline
        const existingAirline = airlines?.find((a: any) => a.airlineId === airline.code);
        
        if (existingAirline) {
          // Update the existing entry in the DB with correct name and color
          const result = await apiRequest('POST', '/api/update-airline', {
            airlineId: airline.code,
            airlineName: airline.name,
            brandColorPrimary: airline.color
          });
          
          if (result) {
            successCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating ${airline.code}:`, error);
      }
    }
    
    // Invalidate the airlines query to refresh the data
    queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
    
    toast({
      title: "Airline colors updated",
      description: `Updated ${successCount} airline colors and names.`
    });
    
    setIsUpdating(false);
  };
  
  return (
    <div className="mt-4 p-4 border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-medium mb-2">North American Airlines</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Add proper airline names and brand colors for major North American carriers
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        {northAmericanAirlines.map(airline => (
          <div 
            key={airline.code}
            className="flex items-center p-2 rounded border"
            style={{ borderLeftColor: airline.color, borderLeftWidth: '4px' }}
          >
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: airline.color }} 
            />
            <span className="text-xs font-medium">{airline.code}</span>
            <span className="text-xs ml-2 text-muted-foreground">{airline.name}</span>
          </div>
        ))}
      </div>
      
      <Button
        onClick={updateAirlineColors} 
        disabled={isUpdating}
        className="w-full"
      >
        {isUpdating ? 'Updating...' : 'Update North American Airlines'}
      </Button>
    </div>
  );
}
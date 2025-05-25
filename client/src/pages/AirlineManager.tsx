import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Comprehensive airline data with names and colors
const airlineData = [
  // Star Alliance Members
  { code: 'AC', name: 'Air Canada', color: '#D82E28' },
  { code: 'NH', name: 'All Nippon Airways (ANA)', color: '#13448F' },
  { code: 'OS', name: 'Austrian Airlines', color: '#CC0000' },
  { code: 'AV', name: 'Avianca', color: '#D20000' },
  { code: 'SN', name: 'Brussels Airlines', color: '#00318B' },
  { code: 'CM', name: 'Copa Airlines', color: '#1A3668' },
  { code: 'MS', name: 'EgyptAir', color: '#005AA9' },
  { code: 'ET', name: 'Ethiopian Airlines', color: '#628C3D' },
  { code: 'BR', name: 'EVA Air', color: '#016A3A' },
  { code: 'LO', name: 'LOT Polish Airlines', color: '#11397D' },
  { code: 'LH', name: 'Lufthansa', color: '#0C2240' },
  { code: 'SK', name: 'SAS Scandinavian Airlines', color: '#003D87' },
  { code: 'SQ', name: 'Singapore Airlines', color: '#1D4489' },
  { code: 'SA', name: 'South African Airways', color: '#0B2742' },
  { code: 'LX', name: 'Swiss International Air Lines', color: '#E30614' },
  { code: 'TP', name: 'TAP Air Portugal', color: '#00A54F' },
  { code: 'TG', name: 'Thai Airways International', color: '#520F8A' },
  { code: 'TK', name: 'Turkish Airlines', color: '#E81932' },
  { code: 'UA', name: 'United Airlines', color: '#002244' },
  
  // Oneworld Alliance Members
  { code: 'AA', name: 'American Airlines', color: '#0078D2' },
  { code: 'BA', name: 'British Airways', color: '#075AAA' },
  { code: 'CX', name: 'Cathay Pacific', color: '#006564' },
  { code: 'FJ', name: 'Fiji Airways', color: '#00ADEF' },
  { code: 'AY', name: 'Finnair', color: '#0F1689' },
  { code: 'IB', name: 'Iberia', color: '#D40F14' },
  { code: 'JL', name: 'Japan Airlines', color: '#E60012' },
  { code: 'MH', name: 'Malaysia Airlines', color: '#006DB7' },
  { code: 'QF', name: 'Qantas Airways', color: '#EE0000' },
  { code: 'QR', name: 'Qatar Airways', color: '#5C0632' },
  { code: 'RJ', name: 'Royal Jordanian', color: '#5E3B28' },
  { code: 'LA', name: 'LATAM Airlines', color: '#0065A9' },
  
  // SkyTeam Alliance Members
  { code: 'AR', name: 'Aerolíneas Argentinas', color: '#74CCED' },
  { code: 'AM', name: 'Aeromexico', color: '#0F3A8B' },
  { code: 'AF', name: 'Air France', color: '#002157' },
  { code: 'AZ', name: 'Alitalia', color: '#00853F' },
  { code: 'CI', name: 'China Airlines', color: '#CC0001' },
  { code: 'MU', name: 'China Eastern Airlines', color: '#C94B32' },
  { code: 'CZ', name: 'China Southern Airlines', color: '#1C64B4' },
  { code: 'OK', name: 'Czech Airlines', color: '#00579C' },
  { code: 'DL', name: 'Delta Air Lines', color: '#E01933' },
  { code: 'GA', name: 'Garuda Indonesia', color: '#035AA6' },
  { code: 'KQ', name: 'Kenya Airways', color: '#C82927' },
  { code: 'KL', name: 'KLM Royal Dutch Airlines', color: '#00A1DE' },
  { code: 'KE', name: 'Korean Air', color: '#00256C' },
  { code: 'ME', name: 'Middle East Airlines', color: '#DA291C' },
  { code: 'SV', name: 'Saudia', color: '#006341' },
  { code: 'VN', name: 'Vietnam Airlines', color: '#00599F' },
  
  // North American Airlines (not in alliances)
  { code: 'AS', name: 'Alaska Airlines', color: '#0060AB' },
  { code: 'B6', name: 'JetBlue Airways', color: '#003876' },
  { code: 'WN', name: 'Southwest Airlines', color: '#304CB2' },
  { code: 'WS', name: 'WestJet', color: '#0F3583' },
  { code: 'F9', name: 'Frontier Airlines', color: '#00A650' },
  { code: 'NK', name: 'Spirit Airlines', color: '#2D3092' },
  { code: 'G4', name: 'Allegiant Air', color: '#003DA5' },
  { code: 'HA', name: 'Hawaiian Airlines', color: '#5A0478' },
  { code: 'Y4', name: 'Volaris', color: '#C5007C' },
  { code: 'SY', name: 'Sun Country Airlines', color: '#004B97' },
  
  // European Airlines (not in alliances)
  { code: 'EI', name: 'Aer Lingus', color: '#00A65A' },
  { code: 'FR', name: 'Ryanair', color: '#073590' },
  { code: 'U2', name: 'easyJet', color: '#FF6600' },
  { code: 'VS', name: 'Virgin Atlantic', color: '#E10D0D' },
  { code: 'DE', name: 'Condor', color: '#FFAD00' },
  { code: 'SU', name: 'Aeroflot', color: '#00256A' },
  { code: 'PS', name: 'Ukraine International Airlines', color: '#1860A9' },
  { code: 'A3', name: 'Aegean Airlines', color: '#00508F' },
  
  // Historical Airlines
  { code: 'NW', name: 'Northwest Airlines', color: '#D12630' },
  { code: 'TW', name: 'Trans World Airlines (TWA)', color: '#981E32' },
  { code: 'CO', name: 'Continental Airlines', color: '#072F6B' },
  { code: 'US', name: 'US Airways', color: '#005DAA' },
  { code: 'PA', name: 'Pan American World Airways (Pan Am)', color: '#0039A6' },
  { code: 'EA', name: 'Eastern Air Lines', color: '#004B85' },
  { code: 'VX', name: 'Virgin America', color: '#CE0058' },
];

const AirlineManager = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch existing airlines
  const { data: airlines, refetch: refetchAirlines } = useQuery({
    queryKey: ["/api/airlines"],
    enabled: isAuthenticated,
  });

  // Function to update an individual airline
  const updateAirline = async (airline: typeof airlineData[0]) => {
    try {
      await apiRequest('PUT', `/api/airlines/${airline.code}`, {
        airlineId: airline.code,
        airlineName: airline.name,
        brandColorPrimary: airline.color
      });
      return true;
    } catch (error) {
      console.error(`Error updating airline ${airline.code}:`, error);
      return false;
    }
  };

  // Function to update all airlines
  const updateAllAirlines = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    toast({
      title: "Updating airlines",
      description: "Starting to update airline data with names and colors..."
    });
    
    let successCount = 0;
    
    for (const airline of airlineData) {
      try {
        const result = await updateAirline(airline);
        if (result) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error updating airline ${airline.code}:`, error);
      }
    }
    
    await refetchAirlines();
    
    toast({
      title: "Airlines updated",
      description: `Successfully updated ${successCount} airlines with proper names and colors.`
    });
    
    setIsUpdating(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold mb-6">Airline Data Manager</h1>
          
          <div className="p-4 border rounded-lg bg-background shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-2">Update Airline Data</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Import comprehensive airline data including names and brand colors for {airlineData.length} major carriers
            </p>
            
            <Button 
              onClick={updateAllAirlines}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? 'Updating Airlines...' : 'Update All Airlines'}
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg bg-background shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-2">Current Airlines ({airlines?.length || 0})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {airlines?.map((airline: any) => (
                <div 
                  key={airline.airlineId} 
                  className="p-3 border rounded-lg flex items-center"
                  style={{ borderLeftColor: airline.brandColorPrimary, borderLeftWidth: '4px' }}
                >
                  <div 
                    className="w-6 h-6 rounded-full mr-3" 
                    style={{ backgroundColor: airline.brandColorPrimary || '#CCCCCC' }}
                  ></div>
                  <div>
                    <div className="font-medium">{airline.airlineName}</div>
                    <div className="text-xs text-muted-foreground">{airline.airlineId}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AirlineManager;
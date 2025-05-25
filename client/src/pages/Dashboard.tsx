import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KPISection from "@/components/KPISection";
import OpenLayersMap from "@/components/OpenLayersMap.fixed";
import FilterSection from "@/components/FilterSection";
import FlightTable from "@/components/FlightTable";
import AddFlightModal from "@/components/modals/AddFlightModal";
import FlightDataUploadModal from "@/components/modals/FlightDataUploadModal";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Flight, FlightKPIs } from "@shared/schema";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { aircraftMatchesFilter } from "@/lib/aircraftData";

const Dashboard = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [showFlightDataUploadModal, setShowFlightDataUploadModal] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isCapturingMap, setIsCapturingMap] = useState(false);
  const [filters, setFilters] = useState({
    airport: "",
    airline: "",
    aircraft: "", // Added aircraft filter
    dateFrom: "",
    dateTo: "",
    tags: "",
    search: "",
    editFlightId: "", // Added to track which flight is being edited
  });

  // Fetch flights
  const { data: flights, isLoading: flightsLoading, refetch: refetchFlights } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
    enabled: isAuthenticated,
  });

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery<FlightKPIs>({
    queryKey: ["/api/kpis"],
    enabled: isAuthenticated,
  });

  // Fetch airlines for dropdown
  const { data: airlines } = useQuery({
    queryKey: ["/api/airlines"],
    enabled: isAuthenticated,
  });
  
  // Fetch aircraft types for dropdown
  const { data: aircraftTypes } = useQuery({
    queryKey: ["/api/aircraft-types"],
    enabled: isAuthenticated,
  });

  // If not authenticated and not loading, redirect to home
  if (!authLoading && !isAuthenticated) {
    navigate("/");
    return null;
  }

  if (authLoading || flightsLoading || kpisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // If the editFlightId filter is set, open the modal for editing
    if (name === 'editFlightId' && value) {
      setShowAddFlightModal(true);
    }
  };

  const clearFilters = () => {
    setFilters({
      airport: "",
      airline: "",
      aircraft: "", // Add aircraft filter
      dateFrom: "",
      dateTo: "",
      tags: "",
      search: "",
      editFlightId: "",
    });
  };

  const handleFlightAdded = () => {
    refetchFlights();
    setShowAddFlightModal(false);
    toast({
      title: "Success",
      description: "Flight added successfully",
      variant: "default",
    });
  };

  const handleCSVUploaded = (count: number) => {
    refetchFlights();
    setShowFlightDataUploadModal(false);
    toast({
      title: "Success",
      description: `${count} flights imported successfully`,
      variant: "default",
    });
  };
  
  // Function to capture the map and redirect to Printify page
  const captureMapForPrintify = async () => {
    setIsCapturingMap(true);
    toast({
      title: "Capturing map",
      description: "Please wait while we capture your flight map...",
      variant: "default",
    });
    
    try {
      // Create a visualization based on actual flight data
      const createFlightMapImage = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Use transparent background
        // Clear the canvas to be fully transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Helper function to convert airport coordinates to canvas coordinates
        const coordToCanvas = (coord: [number, number]): [number, number] => {
          // Convert from [-180, 180] longitude and [-90, 90] latitude to canvas coordinates
          const x = ((coord[0] + 180) / 360) * canvas.width;
          // Flip Y axis because canvas has 0,0 at top-left
          const y = ((90 - coord[1]) / 180) * canvas.height;
          return [x, y];
        };
        
        // Get actual flight data from our flights
        const airportCoordinates: Record<string, [number, number]> = {};
        
        // Import the airport coordinates utility to get consistent coordinates
        // Use the proper airport coordinates from our existing database
        const getCoord = (iata: string): [number, number] => {
          // First try to get from the shared coordinates file
          try {
            // Import directly from our shared utility
            const { getAirportCoordinates } = require('@/lib/airportCoordinates');
            const coords = getAirportCoordinates(iata);
            
            // Make sure we're getting valid coordinates
            if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              airportCoordinates[iata] = coords;
              return coords;
            }
          } catch (err) {
            console.warn(`Error getting coordinates for ${iata} from shared library:`, err);
          }
          
          // If already cached, return it
          if (airportCoordinates[iata]) {
            return airportCoordinates[iata];
          }
          
          // Fallback to our standard airport coordinates
          // This matches the coordinates used in the map visualization
          const standardAirports: Record<string, [number, number]> = {
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

            // Canada
            'YYZ': [-79.6248, 43.6777], // Toronto
            'YVR': [-123.1814, 49.1967], // Vancouver
            'YUL': [-73.7444, 45.4669], // Montreal
            'YYC': [-114.0076, 51.1215], // Calgary
            
            // South America
            'GRU': [-46.4765, -23.4356], // São Paulo
            'EZE': [-58.5345, -34.8222], // Buenos Aires
            'BOG': [-74.1469, 4.7016], // Bogotá
            'LIM': [-77.1143, -12.0219], // Lima
            'SCL': [-70.7858, -33.3931], // Santiago
            
            // Other major international
            'MEX': [-99.0721, 19.4361], // Mexico City
            'CUN': [-86.8515, 21.0366], // Cancun
            'NRT': [140.3929, 35.7647], // Tokyo Narita
            'CPT': [18.6021, -33.9648], // Cape Town
            'CAI': [31.4056, 30.1219], // Cairo
            'IST': [28.8146, 40.9768], // Istanbul
            
            // Additional airports
            'BHX': [-1.7459, 52.4539], // Birmingham, UK
            'GLA': [-4.4351, 55.8687], // Glasgow, UK
          };
          
          if (standardAirports[iata]) {
            airportCoordinates[iata] = standardAirports[iata];
            return standardAirports[iata];
          }
          
          // If not found in our standard airports, generate a reasonable position
          // This is a fallback for airports not in our mapping
          const hashCode = (s: string) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
          const hash = hashCode(iata);
          
          // Use the hash to get a somewhat consistent position
          const lon = (hash % 360) - 180;
          const lat = ((hash >> 8) % 180) - 90;
          
          airportCoordinates[iata] = [lon, lat];
          return [lon, lat];
        };
        
        // Create a mapping for airline names and colors
        const airlineData: Record<string, { name: string, color: string }> = {};
        if (airlines && Array.isArray(airlines)) {
          airlines.forEach(airline => {
            if (airline && airline.airlineId) {
              airlineData[airline.airlineId] = {
                name: airline.airlineName || airline.airlineId,
                color: airline.brandColorPrimary || '#FFFFFF'
              };
            }
          });
        }
        
        // Complete airline information with full names and brand colors
        const defaultAirlineData: Record<string, { name: string, color: string }> = {
          // North American Airlines
          'AA': { name: 'American Airlines', color: '#0078D2' },
          'DL': { name: 'Delta Air Lines', color: '#E01933' },
          'UA': { name: 'United Airlines', color: '#002244' },
          'WN': { name: 'Southwest Airlines', color: '#304CB2' },
          'B6': { name: 'JetBlue Airways', color: '#0033A0' },
          'AS': { name: 'Alaska Airlines', color: '#0060AB' },
          'AC': { name: 'Air Canada', color: '#D22630' },
          'F9': { name: 'Frontier Airlines', color: '#008D32' },
          'NK': { name: 'Spirit Airlines', color: '#FFEC00' },
          'G4': { name: 'Allegiant Air', color: '#EC7300' },
          
          // European Airlines
          'LH': { name: 'Lufthansa', color: '#05164D' },
          'BA': { name: 'British Airways', color: '#075AAA' },
          'AF': { name: 'Air France', color: '#002157' },
          'KL': { name: 'KLM Royal Dutch Airlines', color: '#00A1DE' },
          'FR': { name: 'Ryanair', color: '#073590' },
          'IB': { name: 'Iberia', color: '#C61E45' },
          
          // Asian & Middle Eastern Airlines
          'EK': { name: 'Emirates', color: '#D71921' },
          'QR': { name: 'Qatar Airways', color: '#5C0632' },
          'SQ': { name: 'Singapore Airlines', color: '#F1A52C' },
          'CX': { name: 'Cathay Pacific', color: '#006564' },
          
          // Australia & Pacific
          'QF': { name: 'Qantas Airways', color: '#EE0000' },
          'NZ': { name: 'Air New Zealand', color: '#00205B' },
        };
        
        // Filter flights based on current filters (same logic as in OpenLayersMap)
        const filteredFlights = flights && Array.isArray(flights) ? flights.filter(flight => {
          if (filters.airport && 
              flight.departureAirportIata !== filters.airport && 
              flight.arrivalAirportIata !== filters.airport) {
            return false;
          }
          if (filters.airline && flight.airlineCode !== filters.airline) {
            return false;
          }
          if (filters.aircraft && !aircraftMatchesFilter(flight.aircraftType, filters.aircraft)) {
            return false;
          }
          if (filters.dateFrom && new Date(flight.flightDate) < new Date(filters.dateFrom)) {
            return false;
          }
          if (filters.dateTo && new Date(flight.flightDate) > new Date(filters.dateTo)) {
            return false;
          }
          // Add tag filtering if needed
          if (filters.tags && flight.tags) {
            const tagArray = typeof flight.tags === 'string' 
              ? flight.tags.split(',') 
              : Array.isArray(flight.tags) ? flight.tags : [];
            
            if (!tagArray.some(tag => tag.toLowerCase().includes(filters.tags.toLowerCase()))) {
              return false;
            }
          }
          return true;
        }) : [];
        
        console.log(`Drawing ${filteredFlights.length} filtered flights on Printify canvas`);
        
        // Combine all flight routes
        if (filteredFlights && filteredFlights.length > 0) {
          // Process filtered flight data
          filteredFlights.forEach(flight => {
            if (!flight) return;
            
            try {
              const fromIata = flight.departureAirportIata;
              const toIata = flight.arrivalAirportIata;
              const airline = flight.airlineCode;
              
              if (!fromIata || !toIata) return;
              
              const fromCoord = getCoord(fromIata);
              const toCoord = getCoord(toIata);
              
              const fromCanvasCoord = coordToCanvas(fromCoord);
              const toCanvasCoord = coordToCanvas(toCoord);
              
              // Get color and name based on airline code
              let color = '#FFFFFF'; // Default white
              let airlineName = airline || 'Unknown';
              
              // First check if we have the airline in our database
              if (airline && airlineData[airline]) {
                color = airlineData[airline].color;
                airlineName = airlineData[airline].name;
              } 
              // Then check our fallback data for common airlines
              else if (airline && defaultAirlineData[airline]) {
                color = defaultAirlineData[airline].color;
                airlineName = defaultAirlineData[airline].name;
              }
              
              // Draw flight route arc
              ctx.beginPath();
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.5;
              
              // Use a simpler approach with multiple line segments to approximate a great circle
              // This creates a more accurate and visually appealing flight path
              ctx.moveTo(fromCanvasCoord[0], fromCanvasCoord[1]);
              
              // Create a path with multiple segments for longer distances
              const dx = toCanvasCoord[0] - fromCanvasCoord[0];
              const dy = toCanvasCoord[1] - fromCanvasCoord[1];
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 50) {
                // For short distances, just draw a straight line
                ctx.lineTo(toCanvasCoord[0], toCanvasCoord[1]);
              } else {
                // For longer distances, create a curved path
                // Number of segments increases with distance
                const segments = Math.min(20, Math.max(10, Math.floor(distance / 30)));
                
                // Maximum height of the arc in pixels
                const maxHeight = Math.min(100, distance * 0.3);
                
                for (let i = 1; i <= segments; i++) {
                  // Position along the path (0 to 1)
                  const t = i / segments;
                  
                  // Linear interpolation of x position
                  const x = fromCanvasCoord[0] + t * dx;
                  
                  // Basic linear interpolation of y position
                  const baseY = fromCanvasCoord[1] + t * dy;
                  
                  // Add an arc using a sin curve
                  // Maximum at t=0.5, zero at t=0 and t=1
                  const arcY = Math.sin(t * Math.PI) * maxHeight;
                  
                  // Final y position
                  const y = baseY - arcY;
                  
                  // Add the point to the path
                  ctx.lineTo(x, y);
                }
              }
              
              ctx.stroke();
              
              // Draw endpoints as small dots
              ctx.beginPath();
              ctx.fillStyle = '#FFFFFF';
              ctx.arc(fromCanvasCoord[0], fromCanvasCoord[1], 2, 0, 2 * Math.PI);
              ctx.arc(toCanvasCoord[0], toCanvasCoord[1], 2, 0, 2 * Math.PI);
              ctx.fill();
            } catch (err) {
              console.error("Error drawing flight:", err);
            }
          });
        }
        
        return canvas.toDataURL('image/png');
      };
      
      // Generate the flight map image using filtered data
      const image = createFlightMapImage();
      
      // Store the image in localStorage
      localStorage.setItem('capturedMapImage', image);
      
      toast({
        title: "Success",
        description: "Map captured successfully! Redirecting to products page...",
        variant: "default",
      });
      
      // Redirect to Printify page
      setTimeout(() => {
        navigate("/printify");
      }, 1500);
    } catch (error) {
      console.error("Error capturing map:", error);
      toast({
        title: "Error",
        description: "Failed to capture map image. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsCapturingMap(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 content-container">
          {/* KPI Cards */}
          <KPISection kpis={kpis} />
          
          {/* Map Visualization */}
          <div className="relative">
            <OpenLayersMap 
              flights={flights || []} 
              showHeatmap={showHeatmap}
              filters={filters}
              airlines={airlines}
            />
            {/* Position button at the bottom right to be more visible */}
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                onClick={captureMapForPrintify}
                disabled={isCapturingMap}
                variant="secondary"
                className="bg-primary hover:bg-primary/90 text-white shadow-md"
              >
                {isCapturingMap ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture for Printify
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <FilterSection 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            airlines={airlines}
            aircraftTypes={aircraftTypes}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            onAddFlight={() => setShowAddFlightModal(true)}
            onUploadCSV={() => setShowFlightDataUploadModal(true)}
          />
          

          
          {/* Flight Table */}
          <FlightTable 
            flights={flights || []} 
            filters={filters}
            onFilterChange={handleFilterChange}
            onRefresh={refetchFlights}
          />
        </div>
      </main>
      
      <Footer />
      
      {/* Modals */}
      <AddFlightModal 
        isOpen={showAddFlightModal} 
        onClose={() => {
          setShowAddFlightModal(false);
          // Clear the editFlightId when closing the modal
          if (filters.editFlightId) {
            setFilters(prev => ({ ...prev, editFlightId: "" }));
          }
        }}
        onFlightAdded={handleFlightAdded}
        editFlightId={filters.editFlightId ? parseInt(filters.editFlightId) : undefined}
      />
      
      <FlightDataUploadModal 
        isOpen={showFlightDataUploadModal} 
        onClose={() => setShowFlightDataUploadModal(false)}
        onFlightsUploaded={handleCSVUploaded}
      />
    </div>
  );
};

export default Dashboard;

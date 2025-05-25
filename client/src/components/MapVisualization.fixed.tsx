import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flight } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from "mapbox-gl";
import { Deck } from "@deck.gl/core";
import { ArcLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import "mapbox-gl/dist/mapbox-gl.css";
import { getAirportCoordinates } from "@/lib/airportCoordinates";

// Set your Mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoiaWNlYnVybnIiLCJhIjoiY2xvcnM0ZjUxMDFtNzJscGJlMDh3dnJ5NSJ9.YdCw5_DtPU1c-b-YVn4lCg";

interface MapVisualizationProps {
  flights: Flight[];
  showHeatmap: boolean;
  filters: any;
  airlines?: any[];
}

interface FlightTooltip {
  flightId: number;
  departureAirport: string;
  arrivalAirport: string;
  airline: string;
  flightNumber: string;
  date: string;
  aircraft: string;
  tags: string[];
  x: number;
  y: number;
}

const MapVisualization = ({ flights, showHeatmap, filters, airlines }: MapVisualizationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const deck = useRef<Deck | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightTooltip | null>(null);
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current) return;

    console.log("Initializing map...");
    
    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Use a standard Mapbox style
        center: [-98.5, 39.5], // Center on US
        zoom: 2.5,
        attributionControl: true
      });

      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error("Mapbox error:", e);
      });

      // Initialize Deck.gl after map is loaded
      map.current.on('load', () => {
        console.log("Initializing deck.gl...");
        
        deck.current = new Deck({
          canvas: 'deck-canvas',
          width: '100%',
          height: '100%',
          initialViewState: {
            longitude: -98.5,
            latitude: 39.5,
            zoom: 2.5,
          },
          controller: true,
          onViewStateChange: ({ viewState }) => {
            const { longitude, latitude, zoom } = viewState;
            map.current?.jumpTo({
              center: [longitude, latitude],
              zoom: zoom,
            });
          },
          layers: [],
          getTooltip: ({ object }) => {
            if (!object) return null;
            
            if (object.properties) {
              const { departureAirport, arrivalAirport, airline, flightNumber, date, aircraft } = object.properties;
              return {
                html: `
                  <div style="background-color: white; padding: 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <div style="font-weight: bold;">${departureAirport} → ${arrivalAirport}</div>
                    <div>${airline} ${flightNumber}</div>
                    <div>${date}</div>
                    <div>${aircraft}</div>
                  </div>
                `,
              };
            }
            return null;
          },
        });
      });

      return () => {
        console.log("Cleaning up map...");
        map.current?.remove();
        deck.current?.finalize();
      };
    } catch (err) {
      console.error("Error initializing map:", err);
    }
  }, []);

  // Update layers when flights or filters change
  useEffect(() => {
    if (!deck.current || !map.current || !mapLoaded) return;

    console.log("Updating map with flights:", flights.length);
    
    try {
      // Filter flights based on current filters
      const filteredFlights = flights.filter(flight => {
        if (filters.airport && 
            flight.departureAirportIata !== filters.airport && 
            flight.arrivalAirportIata !== filters.airport) {
          return false;
        }
        if (filters.airline && flight.airlineCode !== filters.airline) {
          return false;
        }
        if (filters.dateFrom && new Date(flight.flightDate) < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && new Date(flight.flightDate) > new Date(filters.dateTo)) {
          return false;
        }
        return true;
      });
      
      console.log("Filtered flights:", filteredFlights.length);

      // Create flight route data for ArcLayer
      const routes = filteredFlights
        .filter(flight => flight.departureAirportIata && flight.arrivalAirportIata)
        .map(flight => {
          // Get airline color
          const airlineData = airlines?.find(a => a.airlineId === flight.airlineCode);
          const color = airlineData?.brandColorPrimary 
            ? hexToRgb(airlineData.brandColorPrimary) 
            : [255, 100, 100];
          
          // Log a few routes for debugging
          if (Math.random() < 0.1) {
            console.log(`Flight route: ${flight.departureAirportIata} -> ${flight.arrivalAirportIata}`);
            console.log("Coordinates:", 
              getAirportCoordinates(flight.departureAirportIata), 
              getAirportCoordinates(flight.arrivalAirportIata)
            );
          }
          
          return {
            from: getAirportCoordinates(flight.departureAirportIata),
            to: getAirportCoordinates(flight.arrivalAirportIata),
            properties: {
              flightId: flight.flightId,
              departureAirport: flight.departureAirportIata,
              arrivalAirport: flight.arrivalAirportIata,
              airline: airlineData?.airlineName || flight.airlineCode,
              flightNumber: flight.flightNumber || 'Unknown',
              date: new Date(flight.flightDate).toLocaleDateString(),
              aircraft: flight.aircraftType || 'Unknown',
              tags: flight.tags || []
            },
            color
          };
        });
      
      console.log("Created route data:", routes.length);

      // Create layers
      const layers = [
        new ArcLayer({
          id: 'flight-routes',
          data: routes,
          pickable: true,
          getWidth: 3,
          getSourcePosition: d => d.from,
          getTargetPosition: d => d.to,
          getSourceColor: d => d.color,
          getTargetColor: d => d.color,
          autoHighlight: true,
          highlightColor: [255, 255, 100, 255],
          parameters: {
            depthTest: false
          },
          onClick: (info) => {
            if (info.object) {
              setSelectedFlight({
                ...info.object.properties,
                x: info.x,
                y: info.y
              });
            }
          }
        })
      ];

      // Add heatmap if enabled
      if (showHeatmap) {
        const heatmapData = routes.flatMap(route => [
          {
            position: route.from,
            weight: 1
          },
          {
            position: route.to,
            weight: 1
          }
        ]);

        // Add heatmap layer
        const heatmapLayer = new HeatmapLayer({
          id: 'flight-heatmap',
          data: heatmapData,
          getPosition: d => d.position,
          getWeight: d => d.weight,
          radiusPixels: 60,
          intensity: 1,
          threshold: 0.05
        });
        
        layers.push(heatmapLayer);
      }

      deck.current.setProps({ layers });
      console.log("Updated deck.gl layers");
      
    } catch (err) {
      console.error("Error updating layers:", err);
    }
  }, [flights, filters, showHeatmap, airlines, mapLoaded]);

  const centerMap = () => {
    if (map.current) {
      map.current.flyTo({
        center: [-98.5, 39.5],
        zoom: 2.5,
        essential: true
      });
    }
  };

  const downloadMap = (minimalVersion = false) => {
    if (!map.current || !deck.current) {
      toast({
        title: "Error",
        description: "Map not available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a canvas for downloading
      const mapCanvas = map.current.getCanvas();
      const deckCanvas = document.getElementById('deck-canvas') as HTMLCanvasElement;
      
      const canvas = document.createElement('canvas');
      canvas.width = mapCanvas.width;
      canvas.height = mapCanvas.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      if (minimalVersion) {
        // Transparent background, only flight routes
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(deckCanvas, 0, 0);
      } else {
        // Full color version
        ctx.drawImage(mapCanvas, 0, 0);
        ctx.drawImage(deckCanvas, 0, 0);
      }
      
      // Download the image
      const link = document.createElement('a');
      link.download = minimalVersion ? 'flight-routes-minimal.png' : 'flight-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "Success",
        description: "Map downloaded successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to download map",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <h2 className="text-white font-semibold">Flight Map</h2>
        
        <div className="flex space-x-2">
          <Button
            onClick={centerMap}
            variant="secondary"
            className="bg-primary hover:bg-primary/90 text-white flex items-center"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
            <span>Center Map</span>
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => downloadMap(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  size="sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Full Color
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download full color map with background</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => downloadMap(true)}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  size="sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Minimal
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download routes only with transparent background</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        className="relative map-container h-[400px]"
      >
        <canvas id="deck-canvas" className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
        
        {/* Map Controls Overlay */}
        <div className="absolute right-4 top-4 bg-white shadow rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            className="p-2 hover:bg-gray-100 text-gray-600 rounded-none"
            onClick={() => map.current?.zoomIn()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </Button>
          <div className="border-t border-gray-200"></div>
          <Button
            variant="ghost"
            className="p-2 hover:bg-gray-100 text-gray-600 rounded-none"
            onClick={() => map.current?.zoomOut()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </Button>
        </div>

        {/* Map Legend */}
        {airlines && airlines.length > 0 && (
          <div className="absolute left-4 bottom-4 bg-white shadow rounded-lg p-3 max-w-xs">
            <h3 className="text-sm font-medium mb-2">Airlines</h3>
            <div className="space-y-1.5 text-xs">
              {airlines.slice(0, 5).map((airline) => (
                <div key={airline.airlineId} className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: airline.brandColorPrimary || '#FFFFFF' }}
                  ></span>
                  <span>{airline.airlineName}</span>
                </div>
              ))}
              {airlines.length > 5 && (
                <div className="text-gray-500 text-xs mt-1">
                  + {airlines.length - 5} more airlines
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flight tooltip */}
        {selectedFlight && (
          <div 
            className="absolute bg-white shadow-lg rounded p-3 text-sm z-10"
            style={{ 
              left: selectedFlight.x, 
              top: selectedFlight.y - 80, 
              transform: 'translate(-50%, -100%)' 
            }}
          >
            <div className="font-medium mb-1 text-primary">{selectedFlight.departureAirport} → {selectedFlight.arrivalAirport}</div>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="pr-2 text-gray-500">Airline:</td>
                  <td>{selectedFlight.airline}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-gray-500">Flight:</td>
                  <td>{selectedFlight.flightNumber}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-gray-500">Date:</td>
                  <td>{selectedFlight.date}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-gray-500">Aircraft:</td>
                  <td>{selectedFlight.aircraft}</td>
                </tr>
              </tbody>
            </table>
            {selectedFlight.tags && selectedFlight.tags.length > 0 && (
              <div className="mt-1 text-xs">
                {selectedFlight.tags.map((tag, i) => (
                  <span key={i} className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-gray-600 mr-1">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Button 
              variant="ghost" 
              className="absolute top-1 right-1 h-5 w-5 p-0 text-gray-400"
              onClick={() => setSelectedFlight(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}

export default MapVisualization;
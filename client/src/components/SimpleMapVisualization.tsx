import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flight } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getAirportCoordinates } from "@/lib/airportCoordinates";

// Set a working Mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoiaWNlYnVybnIiLCJhIjoiY2xvcnM0ZjUxMDFtNzJscGJlMDh3dnJ5NSJ9.YdCw5_DtPU1c-b-YVn4lCg";

interface SimpleMapVisualizationProps {
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
  x: number;
  y: number;
}

const SimpleMapVisualization = ({ flights, showHeatmap, filters, airlines }: SimpleMapVisualizationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current) return;

    console.log("Initializing map...");
    
    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Using dark style for better contrast
        center: [-98.5, 39.5], // Center on US
        zoom: 2.5,
      });

      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error("Mapbox error:", e);
      });

      return () => {
        console.log("Cleaning up map...");
        map.current?.remove();
      };
    } catch (err) {
      console.error("Error initializing map:", err);
    }
  }, []);

  // Update routes when flights or filters change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    try {
      console.log("Updating map with flights:", flights.length);
      
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

      // Remove existing layers if they exist
      if (map.current.getSource('routes')) {
        map.current.removeLayer('flight-routes');
        map.current.removeSource('routes');
      }
      
      if (map.current.getSource('airports')) {
        map.current.removeLayer('airport-points');
        map.current.removeSource('airports');
      }

      // Create a GeoJSON feature collection for flight routes
      const routeFeatures = filteredFlights
        .filter(flight => flight.departureAirportIata && flight.arrivalAirportIata)
        .map(flight => {
          // Get airline color
          const airlineData = airlines?.find(a => a.airlineId === flight.airlineCode);
          const color = airlineData?.brandColorPrimary || '#ff6464';
          
          const departureCoords = getAirportCoordinates(flight.departureAirportIata);
          const arrivalCoords = getAirportCoordinates(flight.arrivalAirportIata);
          
          // Create route as a LineString
          return {
            type: 'Feature',
            properties: {
              id: flight.flightId,
              color: color,
              departureAirport: flight.departureAirportIata,
              arrivalAirport: flight.arrivalAirportIata,
              airline: airlineData?.airlineName || flight.airlineCode,
              flightNumber: flight.flightNumber || 'Unknown',
              date: new Date(flight.flightDate).toLocaleDateString(),
              aircraft: flight.aircraftType || 'Unknown',
            },
            geometry: {
              type: 'LineString',
              coordinates: [departureCoords, arrivalCoords]
            }
          };
        });
      
      // Create a separate feature collection for airports
      const airportSet = new Set<string>();
      filteredFlights.forEach(flight => {
        if (flight.departureAirportIata) airportSet.add(flight.departureAirportIata);
        if (flight.arrivalAirportIata) airportSet.add(flight.arrivalAirportIata);
      });
      
      const airportFeatures = Array.from(airportSet).map(code => {
        const coords = getAirportCoordinates(code);
        return {
          type: 'Feature',
          properties: {
            code,
          },
          geometry: {
            type: 'Point',
            coordinates: coords
          }
        };
      });

      // Add sources and layers to the map
      map.current.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures
        }
      });
      
      map.current.addSource('airports', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: airportFeatures
        }
      });
      
      // Add route layer
      map.current.addLayer({
        id: 'flight-routes',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.7
        }
      });
      
      // Add airport points
      map.current.addLayer({
        id: 'airport-points',
        type: 'circle',
        source: 'airports',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000'
        }
      });
      
      // Add popup for routes
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });
      
      map.current.on('mouseenter', 'flight-routes', (e) => {
        if (!e.features || !e.features[0]) return;
        
        map.current!.getCanvas().style.cursor = 'pointer';
        
        const feature = e.features[0];
        const props = feature.properties;
        
        const html = `
          <div style="font-family: sans-serif; padding: 10px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${props.departureAirport} → ${props.arrivalAirport}</div>
            <div>${props.airline} ${props.flightNumber}</div>
            <div>${props.date}</div>
            <div>${props.aircraft}</div>
          </div>
        `;
        
        // Get coordinates from the line center
        const coordinates = feature.geometry.coordinates;
        const centerIndex = Math.floor(coordinates.length / 2);
        
        popup.setLngLat(coordinates[centerIndex])
          .setHTML(html)
          .addTo(map.current!);
      });
      
      map.current.on('mouseleave', 'flight-routes', () => {
        map.current!.getCanvas().style.cursor = '';
        popup.remove();
      });
      
      console.log("Added flight routes to map:", routeFeatures.length);
    } catch (err) {
      console.error("Error updating flight routes:", err);
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
    if (!map.current) {
      toast({
        title: "Error",
        description: "Map not available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const mapCanvas = map.current.getCanvas();
      
      // Create a new canvas for the download
      const canvas = document.createElement('canvas');
      canvas.width = mapCanvas.width;
      canvas.height = mapCanvas.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      if (minimalVersion) {
        // For minimal version, draw a transparent background with basic map features
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set a custom style for minimal map
        map.current.setStyle('mapbox://styles/mapbox/light-v10');
        setTimeout(() => {
          ctx.drawImage(mapCanvas, 0, 0);
          // Restore original style
          map.current!.setStyle('mapbox://styles/mapbox/dark-v11');
          
          // Download
          const link = document.createElement('a');
          link.download = 'flight-routes-minimal.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          toast({
            title: "Success",
            description: "Map downloaded successfully",
          });
        }, 1000);
      } else {
        // For full color, just use the current map
        ctx.drawImage(mapCanvas, 0, 0);
        
        // Download
        const link = document.createElement('a');
        link.download = 'flight-map.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        toast({
          title: "Success",
          description: "Map downloaded successfully",
        });
      }
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
        className="relative h-[400px]"
      />
      
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
    </div>
  );
};

export default SimpleMapVisualization;
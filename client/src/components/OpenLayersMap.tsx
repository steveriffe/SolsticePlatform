import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flight } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getAirportCoordinates } from "@/lib/airportCoordinates";
import html2canvas from "html2canvas";

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke, Circle, Fill, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import 'ol/ol.css';
import { createEmpty, extend } from 'ol/extent';
import Heatmap from 'ol/layer/Heatmap';
import { getVectorContext } from 'ol/render';

interface OpenLayersMapProps {
  flights: Flight[];
  showHeatmap: boolean;
  filters: any;
  airlines?: any[];
}

const OpenLayersMap = ({ flights, showHeatmap, filters, airlines }: OpenLayersMapProps) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const popupElement = useRef<HTMLDivElement>(null);
  const popupContentRef = useRef<HTMLDivElement>(null);
  const flightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const heatmapLayerRef = useRef<Heatmap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  // Initialize map on component mount
  useEffect(() => {
    if (!mapElement.current) return;

    console.log("Initializing OpenLayers map...");

    // Create vector sources for flights and airports
    const flightSource = new VectorSource();
    const airportSource = new VectorSource();
    const heatmapSource = new VectorSource();
    
    // Create the popup overlay
    const popupOverlay = new Overlay({
      element: popupElement.current!,
      autoPan: true,
      positioning: 'bottom-center',
      offset: [0, -15],
    });

    // Create styles
    const airportStyle = new Style({
      image: new Circle({
        radius: 5,
        fill: new Fill({ color: '#ffffff' }),
        stroke: new Stroke({ color: '#333333', width: 2 }),
      }),
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({ color: '#ffffff' }),
        stroke: new Stroke({
          color: '#000000', 
          width: 2
        }),
        offsetY: 15,
      })
    });

    // Create the flight routes layer
    const flightLayer = new VectorLayer({
      source: flightSource,
      style: (feature) => {
        const color = feature.get('color') || '#ff6464';
        return new Style({
          stroke: new Stroke({
            color: color,
            width: 2,
            lineDash: [1, 2]
          })
        });
      }
    });
    
    // Create airports layer
    const airportLayer = new VectorLayer({
      source: airportSource,
      style: (feature) => {
        const code = feature.get('code');
        airportStyle.getText().setText(code);
        return airportStyle;
      }
    });
    
    // Create heatmap layer
    const heatmapLayer = new Heatmap({
      source: heatmapSource,
      blur: 15,
      radius: 8,
      opacity: 0.8,
      gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
      weight: function(feature) {
        // Weight based on flight frequency
        return feature.get('weight') || 1;
      },
      visible: showHeatmap
    });

    // Save references to the layers for later access
    flightLayerRef.current = flightLayer;
    heatmapLayerRef.current = heatmapLayer;
    
    // Create the map
    const map = new Map({
      target: mapElement.current,
      layers: [
        // Base map layer
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          })
        }),
        // Flight routes layer
        flightLayer,
        // Heatmap layer
        heatmapLayer,
        // Airports layer
        airportLayer
      ],
      view: new View({
        center: fromLonLat([-98.5, 39.5]), // Center on US
        zoom: 3,
        maxZoom: 16
      }),
      controls: [],
    });

    // Add popup overlay
    map.addOverlay(popupOverlay);

    // Add click interaction to show flight details
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
      
      if (feature && feature.get('isRoute')) {
        const coords = map.getCoordinateFromPixel(evt.pixel);
        popupContentRef.current!.innerHTML = `
          <div style="font-size: 14px; padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${feature.get('departureAirport')} → ${feature.get('arrivalAirport')}</div>
            <div>${feature.get('airline')} ${feature.get('flightNumber')}</div>
            <div>${feature.get('date')}</div>
            <div>${feature.get('aircraft')}</div>
          </div>
        `;
        popupOverlay.setPosition(coords);
      } else {
        popupOverlay.setPosition(undefined);
      }
    });

    // Change mouse cursor when over feature
    map.on('pointermove', function(e) {
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    // Save the map instance for later use
    mapRef.current = map;
    setMapLoaded(true);

    console.log("OpenLayers map initialized");

    // Clean up on unmount
    return () => {
      console.log("Cleanup map...");
      map.setTarget(undefined);
    };
  }, []);

  // Update flight routes and airports when data changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !flightLayerRef.current || !heatmapLayerRef.current) return;

    try {
      const map = mapRef.current;
      
      console.log("Updating flight routes:", flights.length);
      
      // Get the layers and sources
      const flightLayer = flightLayerRef.current;
      const heatmapLayer = heatmapLayerRef.current;
      const airportLayer = map.getLayers().getArray()[3] as VectorLayer<VectorSource>;
      
      const flightSource = flightLayer.getSource()!;
      const heatmapSource = heatmapLayer.getSource()!;
      const airportSource = airportLayer.getSource()!;
      
      // Update heatmap visibility based on prop
      heatmapLayer.setVisible(showHeatmap);
      flightLayer.setVisible(!showHeatmap);
      
      // Clear existing features
      flightSource.clear();
      heatmapSource.clear();
      airportSource.clear();
      
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
        if (filters.aircraft && flight.aircraftType !== filters.aircraft) {
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
      
      // Create a set to track unique airports
      const airportSet = new Set<string>();
      
      // Create a map to track flight frequencies between airport pairs
      const routeFrequency = new Map();
      
      // Add flight routes
      filteredFlights.forEach(flight => {
        if (!flight.departureAirportIata || !flight.arrivalAirportIata) return;
        
        // Track airports
        airportSet.add(flight.departureAirportIata);
        airportSet.add(flight.arrivalAirportIata);
        
        // Get coordinates (OpenLayers uses [longitude, latitude])
        const depCoords = getAirportCoordinates(flight.departureAirportIata);
        const arrCoords = getAirportCoordinates(flight.arrivalAirportIata);
        
        // Convert to OpenLayers projection
        const fromCoord = fromLonLat(depCoords);
        const toCoord = fromLonLat(arrCoords);
        
        // Get airline color
        const airlineData = airlines?.find(a => a.airlineId === flight.airlineCode);
        const color = airlineData?.brandColorPrimary || '#ff6464';
        
        // Create the route feature
        const routeFeature = new Feature({
          geometry: new LineString([fromCoord, toCoord]),
          isRoute: true,
          departureAirport: flight.departureAirportIata,
          arrivalAirport: flight.arrivalAirportIata,
          airline: airlineData?.airlineName || flight.airlineCode,
          flightNumber: flight.flightNumber || 'Unknown',
          date: new Date(flight.flightDate).toLocaleDateString(),
          aircraft: flight.aircraftType || 'Unknown',
          color: color
        });
        
        flightSource.addFeature(routeFeature);
        
        // Track route frequency for heatmap
        const routeKey = `${flight.departureAirportIata}-${flight.arrivalAirportIata}`;
        routeFrequency.set(routeKey, (routeFrequency.get(routeKey) || 0) + 1);
        
        // Add midpoint for heatmap visualization (create points along the route)
        const numPoints = 5; // Number of points to add along the route
        const geom = routeFeature.getGeometry() as LineString;
        const length = geom.getLength();
        
        for (let i = 0; i <= numPoints; i++) {
          const fraction = i / numPoints;
          const pointCoord = geom.getCoordinateAt(fraction);
          
          const heatPoint = new Feature({
            geometry: new Point(pointCoord),
            weight: 1, // Base weight for each point
            route: routeKey
          });
          
          heatmapSource.addFeature(heatPoint);
        }
      });
      
      // Adjust heatmap weights based on route frequency
      const heatmapFeatures = heatmapSource.getFeatures();
      heatmapFeatures.forEach(feature => {
        const routeKey = feature.get('route');
        if (routeKey) {
          const frequency = routeFrequency.get(routeKey) || 1;
          feature.set('weight', frequency);
        }
      });
      
      // Add airport points
      Array.from(airportSet).forEach(code => {
        const coords = getAirportCoordinates(code);
        const feature = new Feature({
          geometry: new Point(fromLonLat(coords)),
          code: code
        });
        
        airportSource.addFeature(feature);
      });
      
      console.log(`Added ${flightSource.getFeatures().length} routes, ${heatmapSource.getFeatures().length} heatmap points, and ${airportSource.getFeatures().length} airports`);
      console.log(`Heatmap mode: ${showHeatmap ? 'ON' : 'OFF'}`);
      
    } catch (err) {
      console.error("Error updating flight data:", err);
    }
  }, [flights, filters, airlines, mapLoaded, showHeatmap]);

  const centerMap = () => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      view.animate({
        center: fromLonLat([-98.5, 39.5]),
        zoom: 3,
        duration: 1000
      });
    }
  };

  const downloadMap = (minimalVersion = false) => {
    if (!mapRef.current) {
      toast({
        title: "Error",
        description: "Map not available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const map = mapRef.current;
      
      // Use html2canvas to properly render the entire map
      // Get the map container element
      const mapElement = map.getTargetElement();
        
        if (minimalVersion) {
          // Store layers visibility
          const layers = map.getLayers().getArray();
          const baseLayer = layers[0];
          
          // Hide base map (temporarily)
          baseLayer.setVisible(false);
          
          // Force a re-render
          map.renderSync();
          
          // Allow the DOM to update
          setTimeout(() => {
            // Use html2canvas to capture the map
            html2canvas(mapElement, {
              backgroundColor: null, // Transparent background
              useCORS: true,
              scale: 2 // Better quality
            }).then(canvas => {
              // Create a new canvas for the final image
              const finalCanvas = document.createElement('canvas');
              finalCanvas.width = canvas.width;
              finalCanvas.height = canvas.height;
              const ctx = finalCanvas.getContext('2d')!;
              
              // Draw only the non-transparent pixels
              ctx.drawImage(canvas, 0, 0);
              
              // Create download link for minimal version
              const link = document.createElement('a');
              link.download = 'flight-routes-minimal.png';
              link.href = finalCanvas.toDataURL('image/png');
              link.click();
              
              // Restore the base layer
              baseLayer.setVisible(true);
              
              // Force a re-render to get back to normal view
              map.renderSync();
              
              toast({
                title: "Success",
                description: "Minimal map downloaded successfully",
              });
            });
          }, 100);
        } else {
          // For full color version
          html2canvas(mapElement, {
            useCORS: true,
            scale: 2 // Better quality
          }).then(canvas => {
            // Create download link for full version
            const link = document.createElement('a');
            link.download = 'flight-map.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            toast({
              title: "Success",
              description: "Map downloaded successfully",
            });
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
      
      <div className="relative h-[400px]">
        <div ref={mapElement} className="absolute inset-0" />
        <div 
          ref={popupElement} 
          className="ol-popup absolute z-10 bg-white rounded shadow-lg p-2 transform -translate-x-1/2"
          style={{ display: 'none' }}
        >
          <div ref={popupContentRef}></div>
        </div>
        
        {/* Map Legend */}
        {airlines && airlines.length > 0 && (
          <div className="absolute left-4 bottom-4 bg-white shadow rounded-lg p-3 max-w-xs z-10">
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
    </div>
  );
};

export default OpenLayersMap;
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Component for generating demo flights
export default function DemoFlightGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [flightCount, setFlightCount] = useState(100);
  const { toast } = useToast();

  interface AirlineRouteInfo {
    name: string;
    airports: string[];
    international: boolean;
    requiredCountry?: string;
    requiredAirport?: string;
  }
  
  // Airlines with their realistic route patterns
  const airlineRoutes: Record<string, AirlineRouteInfo> = {
    'AA': { // American Airlines
      name: 'American Airlines',
      airports: ['ATL', 'ORD', 'DFW', 'MIA', 'JFK', 'LAX', 'PHX', 'PHL', 'CLT', 'DCA', 'LGA'],
      international: true
    },
    'DL': { // Delta Air Lines
      name: 'Delta Air Lines',
      airports: ['ATL', 'DTW', 'MSP', 'SLC', 'JFK', 'LAX', 'SEA', 'BOS', 'LGA', 'CVG'],
      international: true
    },
    'UA': { // United Airlines
      name: 'United Airlines',
      airports: ['ORD', 'DEN', 'IAH', 'SFO', 'EWR', 'IAD', 'LAX', 'GUM'],
      international: true
    },
    'AS': { // Alaska Airlines
      name: 'Alaska Airlines',
      airports: ['SEA', 'PDX', 'ANC', 'SFO', 'LAX', 'SAN', 'SJC'],
      international: false
    },
    'WN': { // Southwest Airlines
      name: 'Southwest Airlines',
      airports: ['ATL', 'BWI', 'MDW', 'DEN', 'DAL', 'HOU', 'LAS', 'PHX', 'MCO', 'OAK'],
      international: false
    },
    'B6': { // JetBlue
      name: 'JetBlue Airways',
      airports: ['JFK', 'BOS', 'FLL', 'MCO', 'LAX', 'SFO', 'LGB'],
      international: true
    },
    'AC': { // Air Canada
      name: 'Air Canada',
      airports: ['YYZ', 'YVR', 'YUL', 'YYC', 'YOW', 'YHZ'],
      international: true
    },
    'WS': { // WestJet - Only flies to/from Canada
      name: 'WestJet',
      airports: ['YYZ', 'YYC', 'YVR', 'YEG', 'YUL'],
      international: true,
      requiredCountry: 'Canada'
    },
    'F9': { // Frontier
      name: 'Frontier Airlines',
      airports: ['DEN', 'MCO', 'LAS', 'PHX', 'PHL', 'ATL'],
      international: false
    },
    'NK': { // Spirit
      name: 'Spirit Airlines',
      airports: ['FLL', 'MCO', 'LAS', 'DFW', 'DTW', 'ATL', 'ORD'],
      international: true
    },
    'HA': { // Hawaiian
      name: 'Hawaiian Airlines',
      airports: ['HNL', 'OGG', 'KOA', 'LIH', 'LAX', 'SFO', 'SEA', 'PDX'],
      international: true,
      requiredAirport: 'HNL'
    },
    'G4': { // Allegiant
      name: 'Allegiant Air',
      airports: ['LAS', 'SFB', 'PIE', 'PGD', 'AZA', 'IWA', 'BLI'],
      international: false
    }
  };

  // All airports by region for realistic routing
  const airports = {
    US: [
      'ATL', 'ORD', 'DFW', 'DEN', 'LAX', 'LAS', 'PHX', 'MIA', 'SEA',
      'JFK', 'EWR', 'SFO', 'BOS', 'MSP', 'PHL', 'LGA', 'SLC', 'IAD', 
      'DCA', 'HNL', 'PDX', 'SAN', 'TPA', 'MCO', 'FLL', 'CLT', 'IAH',
      'DTW', 'BWI', 'MDW', 'DAL', 'HOU', 'OAK', 'SJC', 'ANC', 'OGG',
      'KOA', 'LIH', 'LGB', 'SFB', 'PIE', 'PGD', 'AZA', 'IWA', 'BLI'
    ],
    Canada: [
      'YYZ', 'YVR', 'YUL', 'YYC', 'YEG', 'YOW', 'YHZ'
    ],
    International: [
      'LHR', 'CDG', 'FRA', 'AMS', 'MEX', 'NRT', 'HND', 'ICN', 'HKG', 'SYD'
    ]
  };

  // Popular aircraft types for North American carriers
  const aircraftTypes = [
    'Boeing 737-800',
    'Airbus A320',
    'Boeing 737-700',
    'Airbus A321',
    'Embraer E175',
    'Bombardier CRJ700',
    'Boeing 737-900ER',
    'Airbus A319',
    'Boeing 757-200',
    'Boeing 737 MAX 8',
    'Bombardier CRJ900',
    'Airbus A320neo',
    'Boeing 787-9 Dreamliner',
    'Boeing 777-300ER',
    'Embraer E190',
    'Airbus A330-300'
  ];

  // Generate various flight tags
  const tagOptions = [
    'Business', 'Vacation', 'Family Visit', 'Conference', 'Weekend Trip',
    'Holiday', 'Wedding', 'Emergency', 'Relocation', 'Mileage Run',
    'Award Flight', 'First Class', 'Basic Economy', 'Delayed', 'Upgraded',
    'Work Trip', 'International Connection'
  ];

  // Helper functions
  const getRandomDate = () => {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const randomTimestamp = oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime());
    const randomDate = new Date(randomTimestamp);
    
    return randomDate.toISOString().split('T')[0];
  };

  const getRandomItem = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const calculateRandomDistance = () => {
    return Math.floor(500 + Math.random() * 1500);
  };

  const calculateRandomDuration = (distance: number) => {
    return ((distance / 500) + 0.3 + (Math.random() * 0.4)).toFixed(1);
  };

  const generateTags = () => {
    const numTags = Math.floor(Math.random() * 3) + 1;
    const selectedTags: string[] = [];
    
    for (let i = 0; i < numTags; i++) {
      const tag = getRandomItem(tagOptions);
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }
    
    return selectedTags.join(';');
  };

  const generateFlightNumber = (airline: string) => {
    return airline + Math.floor(100 + Math.random() * 4900);
  };

  interface AirportMap {
    US: string[];
    Canada: string[];
    International: string[];
  }
  
  // Helper to determine airport region
  const getAirportRegion = (airportCode: string, airportMap: AirportMap): string => {
    if (airportMap.US.includes(airportCode)) return 'US';
    if (airportMap.Canada.includes(airportCode)) return 'Canada';
    return 'International';
  };
  
  // Get array of all airports
  const getAllAirports = (airportMap: AirportMap): string[] => {
    return [...airportMap.US, ...airportMap.Canada, ...airportMap.International];
  };
  
  // Generate and submit a single flight with realistic routing
  const generateAndSubmitFlight = async () => {
    // First select an airline
    const airlineCode = getRandomItem(Object.keys(airlineRoutes));
    const airline = airlineRoutes[airlineCode as keyof typeof airlineRoutes];
    
    // Get departure and arrival airports based on airline's routes
    let depAirport: string = '';
    let arrAirport: string = '';
    
    // Handle special case for Hawaiian Airlines - must include HNL
    if (airline.requiredAirport) {
      depAirport = airline.requiredAirport;
      // Get a random destination from the airline's airports except the required airport
      const possibleDestinations = airline.airports.filter((ap: string) => ap !== airline.requiredAirport);
      arrAirport = getRandomItem(possibleDestinations);
      
      // 50% chance to flip origin and destination
      if (Math.random() > 0.5) {
        [depAirport, arrAirport] = [arrAirport, depAirport];
      }
    }
    // Handle WestJet case - must include a Canadian airport
    else if (airline.requiredCountry === 'Canada') {
      // At least one airport must be in Canada
      depAirport = getRandomItem(airports.Canada);
      
      // Destination can be in Canada, US, or international based on the airline's capability
      const possibleDestinations = airline.international ? 
        getAllAirports(airports).filter((ap: string) => ap !== depAirport) : 
        [...airports.Canada, ...airports.US].filter((ap: string) => ap !== depAirport);
      
      arrAirport = getRandomItem(possibleDestinations);
    }
    // Standard case for most airlines
    else {
      // Get a random airport from the airline's hub airports
      depAirport = getRandomItem(airline.airports);
      
      // Destination depends on whether airline flies internationally
      let possibleDestinations: string[];
      if (airline.international) {
        // Can fly domestically or internationally
        possibleDestinations = getAllAirports(airports).filter((ap: string) => ap !== depAirport);
      } else {
        // Domestic flights only (US airlines to US destinations)
        possibleDestinations = airports.US.filter((ap: string) => ap !== depAirport);
      }
      
      arrAirport = getRandomItem(possibleDestinations);
    }
    
    const flightDate = getRandomDate();
    const flightNumber = generateFlightNumber(airlineCode);
    const aircraft = getRandomItem(aircraftTypes);
    const tags = generateTags();
    
    // Calculate flight details
    const distance = calculateRandomDistance();
    const duration = calculateRandomDuration(distance);
    
    // Create flight object
    const flightData = {
      departureAirportIata: depAirport,
      arrivalAirportIata: arrAirport,
      airlineCode: airline,
      flightNumber: flightNumber,
      flightDate: flightDate,
      aircraftType: aircraft,
      flightDurationHours: duration,
      tags: tags
    };
    
    try {
      await apiRequest('POST', '/api/flights', flightData);
      return true;
    } catch (error) {
      console.error('Error creating demo flight:', error);
      return false;
    }
  };

  // Generate multiple flights
  const generateDemoFlights = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    toast({
      title: "Generating demo flights",
      description: `Creating ${flightCount} demo flights for your account...`
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    const updateProgress = (current: number) => {
      if (current % 10 === 0 || current === flightCount) {
        toast({
          title: "Progress update",
          description: `Generated ${current}/${flightCount} flights`
        });
      }
    };
    
    for (let i = 0; i < flightCount; i++) {
      const result = await generateAndSubmitFlight();
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
      
      updateProgress(successCount);
    }
    
    toast({
      title: "Demo flights created",
      description: `Successfully generated ${successCount} flights! Errors: ${errorCount}`
    });
    
    setIsGenerating(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-background shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Generate Demo Flights</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Create {flightCount} demo flights for North American carriers over the past year
      </p>
      
      <Button 
        onClick={generateDemoFlights}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? 'Generating Flights...' : 'Generate Demo Flights'}
      </Button>
    </div>
  );
}
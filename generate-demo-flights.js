/**
 * Script to generate demo flights for the project using the API
 */

// Configuration
const DEMO_USER_ID = 'demo-user-12345';
const API_BASE_URL = 'http://localhost:5000';
const NUM_FLIGHTS = 100;

// Libraries needed
const fetch = require('node-fetch');

// North American Airlines to use
const northAmericanAirlines = [
  'AA', // American Airlines
  'DL', // Delta Air Lines
  'UA', // United Airlines
  'AS', // Alaska Airlines
  'WN', // Southwest Airlines
  'B6', // JetBlue
  'AC', // Air Canada
  'WS', // WestJet
  'F9', // Frontier
  'NK', // Spirit
  'HA', // Hawaiian
  'G4'  // Allegiant
];

// Common US and Canadian airport codes
const airports = [
  // US Major Hubs
  'ATL', 'ORD', 'DFW', 'DEN', 'LAX', 'CLT', 'LAS', 'PHX', 'MIA', 'SEA', 
  'IAH', 'JFK', 'EWR', 'SFO', 'DTW', 'BOS', 'MSP', 'PHL', 'LGA', 'BWI',
  'SLC', 'IAD', 'DCA', 'MDW', 'HNL', 'PDX', 'AUS', 'SAN', 'STL', 'TPA',
  'MCO', 'BNA', 'RDU', 'MCI', 'SMF', 'SJC', 'SNA', 'DAL', 'HOU', 'OAK',
  // Canadian Airports
  'YYZ', 'YVR', 'YUL', 'YYC', 'YEG', 'YOW', 'YHZ', 'YWG', 'YXE'
];

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
  'Business',
  'Vacation',
  'Family Visit',
  'Conference',
  'Weekend Trip',
  'Holiday',
  'Wedding',
  'Emergency',
  'Relocation',
  'Mileage Run',
  'Award Flight',
  'First Class',
  'Basic Economy',
  'Delayed',
  'Upgraded',
  'Work Trip',
  'International Connection'
];

// Generate a random date between today and one year ago
function getRandomDate() {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  const randomTimestamp = oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime());
  const randomDate = new Date(randomTimestamp);
  
  return randomDate.toISOString().split('T')[0];
}

// Get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Calculate flight distance in miles between two airports
function calculateDistance() {
  // For demo data, return a reasonable distance based on typical flight lengths
  return Math.floor(500 + Math.random() * 1500);
}

// Generate random duration in hours based on distance
function calculateDuration(distance) {
  // Assume average speed of ~500 mph plus some time for taxiing, takeoff, landing
  return ((distance / 500) + 0.3 + (Math.random() * 0.4)).toFixed(1);
}

// Generate 1-3 random tags for a flight
function generateTags() {
  const numTags = Math.floor(Math.random() * 3) + 1;
  const selectedTags = [];
  
  for (let i = 0; i < numTags; i++) {
    const tag = getRandomItem(tagOptions);
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }
  
  return selectedTags.join(';');
}

// Generate a flight number for an airline
function generateFlightNumber(airline) {
  return airline + Math.floor(100 + Math.random() * 4900);
}

// Create and send a flight
async function createFlight() {
  // Select random values
  const airline = getRandomItem(northAmericanAirlines);
  
  // Get random departure and arrival airports (make sure they're different)
  let depAirport, arrAirport;
  do {
    depAirport = getRandomItem(airports);
    arrAirport = getRandomItem(airports);
  } while (depAirport === arrAirport);
  
  const flightDate = getRandomDate();
  const flightNumber = generateFlightNumber(airline);
  const aircraft = getRandomItem(aircraftTypes);
  const tags = generateTags();
  
  // Calculate flight details
  const distance = calculateDistance();
  const duration = calculateDuration(distance);
  
  // Create the flight data
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
    // Send the request to create the flight
    const response = await fetch(`${API_BASE_URL}/api/flights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If your API requires authentication, add necessary headers
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify(flightData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create flight: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating flight:', error);
    return null;
  }
}

// Main function to generate flights
async function generateDemoFlights() {
  console.log(`Starting to generate ${NUM_FLIGHTS} demo flights...`);
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < NUM_FLIGHTS; i++) {
    try {
      const result = await createFlight();
      if (result) {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`Created ${successCount} flights so far...`);
        }
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`Error creating flight ${i + 1}:`, error);
      failureCount++;
    }
  }
  
  console.log(`
Demo flight generation complete:
- Successfully created: ${successCount} flights
- Failed: ${failureCount} flights
`);
}

// Run the script
generateDemoFlights().catch(console.error);
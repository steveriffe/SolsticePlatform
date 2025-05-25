// Script to seed 100 demo flights for the demo user
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

// Connect to the database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
function calculateDistance(depAirport, arrAirport) {
  // This is a simplified version, we'd normally use actual coordinates
  // For demo data, we'll return a reasonable distance based on typical flight lengths
  return Math.floor(500 + Math.random() * 1500);
}

// Generate random duration in hours based on distance (approximate)
function calculateDuration(distance) {
  // Assume average speed of ~500 mph plus some time for taxiing, takeoff, landing
  return (distance / 500) + 0.3 + (Math.random() * 0.4);
}

// Generate random carbon footprint in kg based on distance
function calculateCarbonFootprint(distance) {
  // Simple estimation: ~0.12 kg CO2 per passenger mile for average flights
  const baseFootprint = distance * 0.12;
  
  // Add some randomness
  return Math.round(baseFootprint * (0.9 + Math.random() * 0.4));
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

// Function to randomly make a small percentage of flights carbon offset
function isCarbonOffset() {
  // 15% chance of a flight being carbon offset
  return Math.random() < 0.15;
}

// Main function to seed the flights
async function seedDemoFlights() {
  try {
    console.log('Starting to seed 100 demo flights...');
    
    // Create 100 demo flights
    for (let i = 0; i < 100; i++) {
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
      const distance = calculateDistance(depAirport, arrAirport);
      const duration = calculateDuration(distance).toFixed(1);
      const carbonFootprint = calculateCarbonFootprint(distance);
      const offset = isCarbonOffset();
      
      // Insert the flight
      const query = `
        INSERT INTO flights (
          user_id,
          departure_airport_iata,
          arrival_airport_iata,
          airline_code,
          flight_number,
          flight_date,
          aircraft_type,
          flight_duration_hours,
          tags,
          distance_miles,
          carbon_footprint_kg,
          is_carbon_offset,
          created_at
        ) VALUES (
          'demo-user-12345',
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
        )
      `;
      
      const values = [
        depAirport,
        arrAirport,
        airline,
        flightNumber,
        flightDate,
        aircraft,
        duration,
        tags,
        distance,
        carbonFootprint,
        offset
      ];
      
      await pool.query(query, values);
      
      if ((i + 1) % 10 === 0) {
        console.log(`Added ${i + 1} flights...`);
      }
    }
    
    console.log('Successfully added 100 demo flights!');
  } catch (error) {
    console.error('Error seeding demo flights:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the seeding function
seedDemoFlights();
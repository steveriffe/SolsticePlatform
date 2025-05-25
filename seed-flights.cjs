require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/pg-core');
const { DateTime } = require('luxon');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Example airlines
const airlines = [
  { id: 'AS', name: 'Alaska Airlines', color: '#0060AF' },
  { id: 'UA', name: 'United Airlines', color: '#0033A0' },
  { id: 'DL', name: 'Delta Air Lines', color: '#E01933' },
  { id: 'AA', name: 'American Airlines', color: '#0078D2' },
  { id: 'B6', name: 'JetBlue Airways', color: '#003876' },
  { id: 'WN', name: 'Southwest Airlines', color: '#304CB2' },
  { id: 'LH', name: 'Lufthansa', color: '#05164D' },
  { id: 'BA', name: 'British Airways', color: '#075AAA' },
  { id: 'AF', name: 'Air France', color: '#002157' },
  { id: 'EK', name: 'Emirates', color: '#D71A21' },
  { id: 'QF', name: 'Qantas', color: '#E40000' },
  { id: 'SQ', name: 'Singapore Airlines', color: '#F8B63F' },
];

// Major airports with their IATA codes
const majorAirports = {
  'SEA': 'Seattle-Tacoma International Airport',
  'IAH': 'George Bush Intercontinental Airport',
  'LAX': 'Los Angeles International Airport',
  'JFK': 'John F. Kennedy International Airport',
  'ORD': 'O\'Hare International Airport',
  'DFW': 'Dallas/Fort Worth International Airport',
  'ATL': 'Hartsfield-Jackson Atlanta International Airport',
  'DEN': 'Denver International Airport',
  'SFO': 'San Francisco International Airport',
  'MIA': 'Miami International Airport',
  'BOS': 'Boston Logan International Airport',
  'LAS': 'Harry Reid International Airport',
  'CLT': 'Charlotte Douglas International Airport',
  'PHX': 'Phoenix Sky Harbor International Airport',
};

// International airports
const internationalAirports = {
  'LHR': 'London Heathrow Airport',
  'CDG': 'Paris Charles de Gaulle Airport',
  'FRA': 'Frankfurt Airport',
  'AMS': 'Amsterdam Airport Schiphol',
  'HND': 'Tokyo Haneda Airport',
  'NRT': 'Tokyo Narita International Airport',
  'PEK': 'Beijing Capital International Airport',
  'PVG': 'Shanghai Pudong International Airport',
  'SYD': 'Sydney Airport',
  'MEL': 'Melbourne Airport',
  'YYZ': 'Toronto Pearson International Airport',
  'YVR': 'Vancouver International Airport',
  'MEX': 'Mexico City International Airport',
  'GRU': 'São Paulo/Guarulhos International Airport',
  'DXB': 'Dubai International Airport',
  'DOH': 'Hamad International Airport',
  'SIN': 'Singapore Changi Airport',
  'ICN': 'Seoul Incheon International Airport',
  'HKG': 'Hong Kong International Airport',
  'BOM': 'Chhatrapati Shivaji Maharaj International Airport',
};

// Aircraft types
const aircraftTypes = [
  'Boeing 737-800',
  'Boeing 737-900',
  'Boeing 737 MAX 9',
  'Boeing 757-200',
  'Boeing 757-300',
  'Boeing 767-300',
  'Boeing 777-200',
  'Boeing 777-300',
  'Boeing 787-8',
  'Boeing 787-9',
  'Boeing 787-10',
  'Airbus A320',
  'Airbus A321',
  'Airbus A330-200',
  'Airbus A330-300',
  'Airbus A350-900',
  'Airbus A350-1000',
  'Airbus A380',
  'Embraer E175',
  'Bombardier CRJ-700',
  'Bombardier CRJ-900',
  'Bombardier Q400',
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Random date in the last 2 years
function getRandomDate() {
  const today = DateTime.now();
  const daysAgo = Math.floor(Math.random() * 730); // 2 years = 730 days
  return today.minus({ days: daysAgo }).toISODate();
}

// Random flight duration based on route distance (roughly)
function getFlightDuration(departure, arrival) {
  // Check if it's a domestic or international flight
  const isDomestic = Object.keys(majorAirports).includes(arrival);
  
  if (isDomestic) {
    // Domestic flights: 1-6 hours
    return (1 + Math.random() * 5).toFixed(1);
  } else {
    // International flights: 6-14 hours
    return (6 + Math.random() * 8).toFixed(1);
  }
}

// Calculates a rough distance based on flight duration
function getFlightDistance(duration) {
  // Rough estimate: ~500 miles per hour
  const miles = duration * 500;
  return Math.round(miles);
}

// Generate flight number
function generateFlightNumber(airline) {
  return `${airline}${Math.floor(1000 + Math.random() * 9000)}`;
}

async function seedDatabase() {
  try {
    // First, ensure we have all airlines
    console.log("Adding airlines...");
    for (const airline of airlines) {
      await pool.query(
        'INSERT INTO airlines (airline_id, airline_name, brand_color_primary) VALUES ($1, $2, $3) ON CONFLICT (airline_id) DO UPDATE SET airline_name = $2, brand_color_primary = $3',
        [airline.id, airline.name, airline.color]
      );
    }
    
    // Then ensure we have all airports
    console.log("Adding airports...");
    const allAirports = { ...majorAirports, ...internationalAirports };
    for (const [code, name] of Object.entries(allAirports)) {
      await pool.query(
        'INSERT INTO airports (iata_code, name, city, country_id) VALUES ($1, $2, $3, $4) ON CONFLICT (iata_code) DO NOTHING',
        [code, name, 'Unknown', 'US'] // Default city and country if not provided
      );
    }
    
    // Get current user ID
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      throw new Error("No users found in the database");
    }
    const userId = userResult.rows[0].id;
    
    console.log(`Seeding flights for user ${userId}...`);
    
    // Generate about 1000 flights
    const flightsToGenerate = 1000;
    const flightData = [];
    
    // Batch 1: 400 Alaska Airlines flights from Seattle (40%)
    for (let i = 0; i < flightsToGenerate * 0.4; i++) {
      const arrival = getRandomElement(Object.keys(majorAirports));
      const date = getRandomDate();
      const duration = getFlightDuration('SEA', arrival);
      const distance = getFlightDistance(duration);
      
      flightData.push({
        userId,
        departureAirport: 'SEA',
        arrivalAirport: arrival,
        airline: 'AS',
        date,
        flightNumber: generateFlightNumber('AS'),
        aircraft: getRandomElement(aircraftTypes),
        duration,
        distance
      });
    }
    
    // Batch 2: 450 United Airlines flights from Houston (45%)
    for (let i = 0; i < flightsToGenerate * 0.45; i++) {
      const arrival = getRandomElement(Object.keys(majorAirports));
      const date = getRandomDate();
      const duration = getFlightDuration('IAH', arrival);
      const distance = getFlightDistance(duration);
      
      flightData.push({
        userId,
        departureAirport: 'IAH',
        arrivalAirport: arrival,
        airline: 'UA',
        date,
        flightNumber: generateFlightNumber('UA'),
        aircraft: getRandomElement(aircraftTypes),
        duration,
        distance
      });
    }
    
    // Batch 3: 150 International flights on various carriers (15%)
    for (let i = 0; i < flightsToGenerate * 0.15; i++) {
      // 50% chance of departure from Seattle, 50% from Houston
      const departure = Math.random() < 0.5 ? 'SEA' : 'IAH';
      const arrival = getRandomElement(Object.keys(internationalAirports));
      const airline = getRandomElement(airlines.filter(a => a.id !== 'AS' && a.id !== 'UA')).id;
      const date = getRandomDate();
      const duration = getFlightDuration(departure, arrival);
      const distance = getFlightDistance(duration);
      
      flightData.push({
        userId,
        departureAirport: departure,
        arrivalAirport: arrival,
        airline,
        date,
        flightNumber: generateFlightNumber(airline),
        aircraft: getRandomElement(aircraftTypes),
        duration,
        distance
      });
    }
    
    console.log(`Inserting ${flightData.length} flights...`);
    
    // Insert flights in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < flightData.length; i += batchSize) {
      const batch = flightData.slice(i, i + batchSize);
      await Promise.all(batch.map(flight => {
        return pool.query(
          `INSERT INTO flights (
            user_id, departure_airport_iata, arrival_airport_iata, airline_code, 
            flight_date, flight_number, aircraft_type, flight_duration_hours, distance_miles
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            flight.userId, 
            flight.departureAirport, 
            flight.arrivalAirport, 
            flight.airline,
            flight.date,
            flight.flightNumber,
            flight.aircraft,
            flight.duration,
            flight.distance
          ]
        );
      }));
      
      console.log(`Inserted ${i + batch.length} flights...`);
    }
    
    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

seedDatabase();
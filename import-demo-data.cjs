// Script to import demo data
const fs = require('fs');
const { parse } = require('date-fns');
const { pool } = require('./server/db');
const { db } = require('./server/db');
const { eq } = require('drizzle-orm');
const { 
  users, 
  airlines, 
  flights, 
  airports, 
  flightTags 
} = require('./shared/schema');

// Demo user ID - we'll use a fixed string for the demo account
const DEMO_USER_ID = 'demo-user-12345';

// Helper functions for processing flight data
function parseDate(dateStr) {
  // Handle multiple date formats
  let date;
  try {
    if (dateStr.includes('/')) {
      // Format: M/D/YY
      date = parse(dateStr, 'M/d/yy', new Date());
    } else {
      // ISO format
      date = new Date(dateStr);
    }
    return date.toISOString();
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    // Return today's date as fallback
    return new Date().toISOString();
  }
}

async function calculateDistance(depCode, arrCode) {
  try {
    // Get airport coordinates
    const [depAirport] = await db
      .select()
      .from(airports)
      .where(eq(airports.iataCode, depCode));
      
    const [arrAirport] = await db
      .select()
      .from(airports)
      .where(eq(airports.iataCode, arrCode));
    
    if (!depAirport || !arrAirport) {
      console.log(`Missing airport data for ${depCode} or ${arrCode}`);
      return 500; // Default distance if airports not found
    }
    
    // Basic distance calculation using Haversine formula
    const lat1 = parseFloat(depAirport.latitude);
    const lon1 = parseFloat(depAirport.longitude);
    const lat2 = parseFloat(arrAirport.latitude);
    const lon2 = parseFloat(arrAirport.longitude);
    
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  } catch (error) {
    console.error(`Error calculating distance: ${error}`);
    return 500; // Default if calculation fails
  }
}

function calculateCarbonFootprint(distanceMiles, aircraftType) {
  // Carbon calculation based on distance and aircraft
  let emissionFactor = 0.25; // Default kg CO2 per mile
  
  // Adjust based on aircraft type
  if (aircraftType) {
    const lowerAircraftType = aircraftType.toLowerCase();
    
    if (lowerAircraftType.includes('737') || lowerAircraftType.includes('a320')) {
      emissionFactor = 0.22; // Medium-sized aircraft
    } else if (lowerAircraftType.includes('777') || lowerAircraftType.includes('787') || 
               lowerAircraftType.includes('a330') || lowerAircraftType.includes('a350')) {
      emissionFactor = 0.33; // Wide-body aircraft
    } else if (lowerAircraftType.includes('dash') || lowerAircraftType.includes('embraer') || 
               lowerAircraftType.includes('crj')) {
      emissionFactor = 0.18; // Regional aircraft
    }
  }
  
  return Math.round(distanceMiles * emissionFactor * 10) / 10; // Round to 1 decimal place
}

// Function to calculate flight duration based on distance and aircraft type
function calculateFlightDuration(distanceMiles, aircraftType) {
  // Base speed in mph depending on aircraft type
  let speed = 500; // Default speed
  
  if (aircraftType) {
    const lowerAircraftType = aircraftType.toLowerCase();
    
    if (lowerAircraftType.includes('737') || lowerAircraftType.includes('a320')) {
      speed = 520; // Typical 737/A320 cruise speed
    } else if (lowerAircraftType.includes('777') || lowerAircraftType.includes('787') || 
               lowerAircraftType.includes('a330') || lowerAircraftType.includes('a350')) {
      speed = 560; // Wide-body jets
    } else if (lowerAircraftType.includes('dash') || lowerAircraftType.includes('embraer') || 
               lowerAircraftType.includes('crj')) {
      speed = 350; // Regional jets/turboprops
    }
  }
  
  // Calculate hours plus some time for takeoff, landing, taxiing
  const flightTime = (distanceMiles / speed) + 0.5;
  return parseFloat(flightTime.toFixed(1)); // Round to 1 decimal place
}

// Main import function
async function importDemoData() {
  try {
    console.log('Starting demo data import...');
    
    // Create demo user if it doesn't exist
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, DEMO_USER_ID));
      
    if (existingUser.length === 0) {
      console.log('Creating demo user...');
      await db.insert(users).values({
        id: DEMO_USER_ID,
        email: 'demo@solsticenavigator.com',
        firstName: 'Dave',
        lastName: 'Demo',
        profileImageUrl: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Read CSV file
    const csvData = fs.readFileSync('./attached_assets/demo dave data.csv', 'utf8');
    const lines = csvData.split('\n');
    const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
    
    // Map headers to column indices
    const airlineNameIdx = headers.findIndex(h => h.toLowerCase() === 'airline');
    const airlineCodeIdx = headers.findIndex(h => h.toLowerCase() === 'airline code');
    const flightNumberIdx = headers.findIndex(h => h.toLowerCase() === 'flight number');
    const depAirportIdx = headers.findIndex(h => h.toLowerCase() === 'departure airport code');
    const arrAirportIdx = headers.findIndex(h => h.toLowerCase() === 'arrival airport code');
    const depDateIdx = headers.findIndex(h => h.toLowerCase() === 'departure date');
    const aircraftIdx = headers.findIndex(h => h.toLowerCase() === 'airplane');
    
    // Process each flight
    const dataRows = lines.slice(1).filter(line => line.trim());
    let importedCount = 0;
    
    for (const row of dataRows) {
      const columns = row.split(',').map(c => c.trim());
      
      // Skip if missing required data
      if (columns.length < 5) continue;
      
      const airlineName = columns[airlineNameIdx] || '';
      const airlineCode = columns[airlineCodeIdx] || '';
      const flightNumber = columns[flightNumberIdx] || '';
      const depAirport = columns[depAirportIdx] || '';
      const arrAirport = columns[arrAirportIdx] || '';
      const depDate = columns[depDateIdx] ? parseDate(columns[depDateIdx]) : new Date().toISOString();
      const aircraft = columns[aircraftIdx] || '';
      
      if (!airlineCode || !depAirport || !arrAirport) {
        console.log(`Skipping row with missing data: ${row}`);
        continue;
      }
      
      // Check if airline exists, create if not
      const existingAirline = await db
        .select()
        .from(airlines)
        .where(eq(airlines.airlineId, airlineCode));
        
      if (existingAirline.length === 0) {
        console.log(`Adding airline: ${airlineName} (${airlineCode})`);
        await db.insert(airlines).values({
          airlineId: airlineCode,
          airlineName: airlineName,
          needsManualColorInput: true
        });
      }
      
      // Calculate distance and carbon footprint
      const distance = await calculateDistance(depAirport, arrAirport);
      const carbonFootprint = calculateCarbonFootprint(distance, aircraft);
      const flightDuration = calculateFlightDuration(distance, aircraft);
      
      // Insert flight
      console.log(`Adding flight: ${airlineCode} ${flightNumber} from ${depAirport} to ${arrAirport}`);
      await db.insert(flights).values({
        userId: DEMO_USER_ID,
        departureAirportIata: depAirport,
        arrivalAirportIata: arrAirport,
        airlineCode: airlineCode,
        flightDate: new Date(depDate),
        flightNumber: flightNumber,
        aircraftType: aircraft,
        flightDurationHours: flightDuration,
        distanceMiles: distance,
        carbonFootprintKg: carbonFootprint,
        carbonOffset: Math.random() > 0.7 // Randomly offset about 30% of flights
      });
      
      importedCount++;
    }
    
    console.log(`Successfully imported ${importedCount} flights for demo user!`);
  } catch (error) {
    console.error('Error importing demo data:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the import
importDemoData().then(() => {
  console.log('Demo data import completed');
  process.exit(0);
}).catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
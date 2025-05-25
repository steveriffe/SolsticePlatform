/**
 * This script converts the Alaska Airlines markdown table data to CSV format
 * and handles the database insertion directly using the correct schema fields
 * 
 * Uses .cjs extension to ensure it's treated as CommonJS
 */

const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');

// Read environment variables
require('dotenv').config();

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Read the markdown file
const markdownContent = fs.readFileSync('./attached_assets/alaska_airlines_flight_data.md', 'utf-8');

// Parse the table data
function parseMarkdownTable(content) {
  // Split by lines and remove the table header and separator rows
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const dataRows = lines.slice(2); // Skip header and separator rows
  
  const flights = [];
  
  dataRows.forEach(row => {
    // Parse the row data using regex to handle the pipe-separated format
    const match = row.match(/\|\s*(\d+)\s*\|\s*([A-Z0-9]+)\s*\|\s*([^|]+)\s*\|\s*([A-Z]+)\s*\|\s*([A-Z]+)\s*\|\s*([^|]+)\s*\|/);
    
    if (match) {
      // Extract fields from the regex match
      const [, rowNum, flightNumber, aircraft, departureAirport, arrivalAirport, departureDate] = match;
      
      // Calculate duration based on typical flight times between airports
      let durationHours = calculateDuration(departureAirport, arrivalAirport);
      
      flights.push({
        id: rowNum.trim(),
        departureAirportIata: departureAirport.trim(),
        arrivalAirportIata: arrivalAirport.trim(),
        airlineCode: 'AS', // Alaska Airlines
        flightDate: departureDate.trim(),
        flightNumber: flightNumber.trim(),
        aircraftType: aircraft.trim(),
        flightDurationHours: durationHours,
        tags: 'Alaska Airlines Demo'
      });
    }
  });
  
  return flights;
}

// Calculate estimated flight duration based on airports
function calculateDuration(departure, arrival) {
  // Map of airport pairs to durations (in hours)
  const knownDurations = {
    'SEA-LAX': 2.5,
    'LAX-SEA': 2.7,
    'SEA-SFO': 2.0,
    'SFO-SEA': 2.2,
    'SEA-ANC': 3.5,
    'ANC-SEA': 3.8,
    'JFK-LAX': 6.0,
    'LAX-JFK': 5.5,
    'SEA-HNL': 6.0,
    'HNL-SEA': 5.5
  };
  
  const route = `${departure}-${arrival}`;
  
  // Return known duration or calculate based on US domestic average
  return knownDurations[route] || 3.0;
}

// Calculate distance between airports
async function getAirportDistanceInMiles(departureCode, arrivalCode) {
  try {
    // Get coordinates for airports
    const result = await pool.query(
      'SELECT a1.latitude as dep_lat, a1.longitude as dep_lon, a2.latitude as arr_lat, a2.longitude as arr_lon ' +
      'FROM airports a1, airports a2 ' +
      'WHERE a1.iata_code = $1 AND a2.iata_code = $2',
      [departureCode, arrivalCode]
    );
    
    if (result.rows.length === 0 || !result.rows[0].dep_lat || !result.rows[0].arr_lat) {
      console.log(`Could not find coordinates for ${departureCode} and/or ${arrivalCode}. Using default distance.`);
      return 1500; // Average US domestic flight distance in miles
    }
    
    const { dep_lat, dep_lon, arr_lat, arr_lon } = result.rows[0];
    
    // Haversine formula to calculate distance
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRad(arr_lat - dep_lat);
    const dLon = toRad(arr_lon - dep_lon);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(dep_lat)) * Math.cos(toRad(arr_lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 1500; // Fallback to average
  }
}

function toRad(value) {
  return value * Math.PI / 180;
}

// Calculate carbon footprint based on distance and aircraft
function calculateCarbonFootprint(distanceMiles, aircraftType) {
  // Base emissions in kg CO2 per passenger per mile
  let emissionFactor = 0.2; // Default emission factor
  
  // Adjust based on aircraft type
  if (aircraftType.includes('Boeing 737-900')) {
    emissionFactor = 0.18;
  } else if (aircraftType.includes('Boeing 737-800')) {
    emissionFactor = 0.19;
  } else if (aircraftType.includes('Airbus A320')) {
    emissionFactor = 0.17;
  } else if (aircraftType.includes('Airbus A321')) {
    emissionFactor = 0.16;
  } else if (aircraftType.includes('Embraer 175')) {
    emissionFactor = 0.22;
  }
  
  return Math.round(distanceMiles * emissionFactor * 10) / 10; // kg CO2, rounded to 1 decimal place
}

// Insert flights into database
async function insertFlights(flights) {
  const client = await pool.connect();
  let insertedCount = 0;
  let errors = [];
  
  try {
    await client.query('BEGIN');

    // Get existing airports to verify they exist
    const airports = await client.query('SELECT iata_code FROM airports');
    const existingAirports = new Set(airports.rows.map(row => row.iata_code));
    
    // Check if airline exists, create if not
    const airlineResult = await client.query('SELECT * FROM airlines WHERE airline_id = $1', ['AS']);
    if (airlineResult.rows.length === 0) {
      console.log('Adding Alaska Airlines to the database...');
      await client.query(
        'INSERT INTO airlines (airline_id, airline_name, color_code) VALUES ($1, $2, $3)',
        ['AS', 'Alaska Airlines', '#0077C8']  // Alaska Airlines blue color
      );
    }
    
    for (const flight of flights) {
      try {
        // Verify airports exist
        if (!existingAirports.has(flight.departureAirportIata)) {
          errors.push(`Airport ${flight.departureAirportIata} not found in database. Skipping flight.`);
          continue;
        }
        
        if (!existingAirports.has(flight.arrivalAirportIata)) {
          errors.push(`Airport ${flight.arrivalAirportIata} not found in database. Skipping flight.`);
          continue;
        }
        
        // Calculate distance between airports
        const distanceMiles = await getAirportDistanceInMiles(
          flight.departureAirportIata, 
          flight.arrivalAirportIata
        );
        
        // Calculate carbon footprint
        const carbonFootprint = calculateCarbonFootprint(distanceMiles, flight.aircraftType);
        
        // Parse date to ensure proper format (YYYY-MM-DD)
        const dateParts = flight.flightDate.trim().split('-');
        const formattedDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
        
        // Insert flight
        const flightInsertResult = await client.query(
          `INSERT INTO flights (
            user_id, 
            departure_airport_iata, 
            arrival_airport_iata, 
            airline_code, 
            flight_date, 
            flight_number, 
            aircraft_type, 
            distance_miles, 
            flight_duration_hours,
            carbon_footprint_kg,
            carbon_offset,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING flight_id`,
          [
            'demo-user-12345', // Using demo user
            flight.departureAirportIata,
            flight.arrivalAirportIata,
            flight.airlineCode,
            formattedDate,
            flight.flightNumber,
            flight.aircraftType,
            distanceMiles,
            flight.flightDurationHours,
            carbonFootprint,
            false, // Not carbon offset by default
            new Date()
          ]
        );
        
        const flightId = flightInsertResult.rows[0].flight_id;
        
        // Add tags if any
        if (flight.tags) {
          const tags = flight.tags.split(';');
          for (const tag of tags) {
            if (tag.trim()) {
              await client.query(
                'INSERT INTO flight_tags (flight_id, tag_name) VALUES ($1, $2)',
                [flightId, tag.trim()]
              );
            }
          }
        }
        
        insertedCount++;
        console.log(`Inserted flight ${flightId}: ${flight.airlineCode}${flight.flightNumber}`);
      } catch (error) {
        errors.push(`Error inserting flight ${flight.flightNumber}: ${error.message}`);
        console.error(`Error inserting flight ${flight.flightNumber}:`, error);
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    errors.push(`Transaction error: ${error.message}`);
    console.error('Transaction error:', error);
  } finally {
    client.release();
  }
  
  return { insertedCount, errors };
}

// Main execution
async function main() {
  try {
    console.log('Parsing markdown flight data...');
    const flights = parseMarkdownTable(markdownContent);
    console.log(`Found ${flights.length} flights in markdown table`);
    
    console.log('Inserting flights into database...');
    const result = await insertFlights(flights);
    
    console.log('=== IMPORT SUMMARY ===');
    console.log(`Successfully inserted: ${result.insertedCount} flights`);
    
    if (result.errors.length > 0) {
      console.log(`Encountered ${result.errors.length} errors:`);
      result.errors.forEach((err, i) => console.log(`${i+1}. ${err}`));
    }
    
    console.log('=== IMPORT COMPLETE ===');
  } catch (error) {
    console.error('Script execution failed:', error);
  } finally {
    pool.end();
  }
}

main();
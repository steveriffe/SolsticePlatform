const fs = require('fs');
const https = require('https');
const { Pool } = require('@neondatabase/serverless');

// Fallback common airports data in case GitHub fetch fails
const fallbackAirports = [
  { iata_code: 'ANC', name: 'Ted Stevens Anchorage International Airport', city: 'Anchorage', country_id: 'US', latitude: 61.1741, longitude: -149.9961 },
  { iata_code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country_id: 'US', latitude: 33.6407, longitude: -84.4277 },
  { iata_code: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country_id: 'GB', latitude: 52.4539, longitude: -1.7459 },
  { iata_code: 'BNA', name: 'Nashville International Airport', city: 'Nashville', country_id: 'US', latitude: 36.1245, longitude: -86.6782 },
  { iata_code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country_id: 'US', latitude: 42.3656, longitude: -71.0096 },
  { iata_code: 'CLE', name: 'Cleveland Hopkins International Airport', city: 'Cleveland', country_id: 'US', latitude: 41.4117, longitude: -81.8495 },
  { iata_code: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', country_id: 'US', latitude: 35.2139, longitude: -80.9431 },
  { iata_code: 'DEN', name: 'Denver International Airport', city: 'Denver', country_id: 'US', latitude: 39.8561, longitude: -104.6737 },
  { iata_code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country_id: 'US', latitude: 32.8968, longitude: -97.0380 },
  { iata_code: 'DTW', name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', country_id: 'US', latitude: 42.2124, longitude: -83.3534 },
  { iata_code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country_id: 'US', latitude: 40.6895, longitude: -74.1745 },
  { iata_code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country_id: 'DE', latitude: 50.0379, longitude: 8.5622 },
  { iata_code: 'HNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', country_id: 'US', latitude: 21.3245, longitude: -157.9251 },
  { iata_code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington', country_id: 'US', latitude: 38.9445, longitude: -77.4558 },
  { iata_code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country_id: 'US', latitude: 40.6413, longitude: -73.7781 },
  { iata_code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country_id: 'US', latitude: 36.0840, longitude: -115.1537 },
  { iata_code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country_id: 'US', latitude: 33.9416, longitude: -118.4085 },
  { iata_code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country_id: 'US', latitude: 40.7772, longitude: -73.8726 },
  { iata_code: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country_id: 'US', latitude: 28.4312, longitude: -81.3085 },
  { iata_code: 'MDW', name: 'Chicago Midway International Airport', city: 'Chicago', country_id: 'US', latitude: 41.7868, longitude: -87.7522 },
  { iata_code: 'MIA', name: 'Miami International Airport', city: 'Miami', country_id: 'US', latitude: 25.7932, longitude: -80.2906 },
  { iata_code: 'MSP', name: 'Minneapolis–Saint Paul International Airport', city: 'Minneapolis', country_id: 'US', latitude: 44.8820, longitude: -93.2218 },
  { iata_code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country_id: 'US', latitude: 41.9742, longitude: -87.9073 },
  { iata_code: 'PDX', name: 'Portland International Airport', city: 'Portland', country_id: 'US', latitude: 45.5887, longitude: -122.5969 },
  { iata_code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country_id: 'US', latitude: 39.8729, longitude: -75.2437 },
  { iata_code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country_id: 'US', latitude: 33.4352, longitude: -112.0101 },
  { iata_code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country_id: 'US', latitude: 32.7336, longitude: -117.1897 },
  { iata_code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country_id: 'US', latitude: 47.4502, longitude: -122.3088 },
  { iata_code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country_id: 'US', latitude: 37.6213, longitude: -122.3790 },
  { iata_code: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country_id: 'US', latitude: 40.7884, longitude: -111.9779 },
  { iata_code: 'TPA', name: 'Tampa International Airport', city: 'Tampa', country_id: 'US', latitude: 27.9756, longitude: -82.5332 },
  { iata_code: 'LHR', name: 'Heathrow Airport', city: 'London', country_id: 'GB', latitude: 51.4700, longitude: -0.4543 },
];

// Function to fetch airports from GitHub repository
async function fetchAirportsFromGithub() {
  return new Promise((resolve, reject) => {
    console.log('Fetching airports data from GitHub...');
    
    const url = 'https://raw.githubusercontent.com/lxndrblz/Airports/main/airports.csv';
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log('Received airports data, processing...');
          
          // Parse the CSV data
          const lines = data.split('\n');
          const headers = lines[0].split(',');
          
          // Find the index of important columns
          const iataIndex = headers.findIndex(header => header.includes('iata_code') || header.includes('iata'));
          const nameIndex = headers.findIndex(header => header.includes('name'));
          const cityIndex = headers.findIndex(header => header.includes('city') || header.includes('municipality'));
          const countryIndex = headers.findIndex(header => header.includes('country') || header.includes('iso_country'));
          const latIndex = headers.findIndex(header => header.includes('latitude') || header.includes('lat'));
          const lonIndex = headers.findIndex(header => header.includes('longitude') || header.includes('lon'));
          
          // Skip the header row and parse the rest of the CSV
          const airports = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Handle commas within quoted fields
            let row = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let j = 0; j < lines[i].length; j++) {
              const char = lines[i][j];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                row.push(currentValue);
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            
            // Push the last value
            row.push(currentValue);
            
            // Extract the IATA code (assume it's in the format "ABC")
            const iataCode = row[iataIndex]?.replace(/"/g, '').trim();
            
            // Only include rows with valid IATA codes (3 uppercase letters)
            if (iataCode && /^[A-Z]{3}$/.test(iataCode)) {
              const airport = {
                iata_code: iataCode,
                name: row[nameIndex]?.replace(/"/g, '').trim() || 'Unknown Airport',
                city: row[cityIndex]?.replace(/"/g, '').trim() || 'Unknown City',
                country_id: row[countryIndex]?.replace(/"/g, '').trim().substring(0, 2) || 'UN',
                latitude: parseFloat(row[latIndex]) || 0,
                longitude: parseFloat(row[lonIndex]) || 0
              };
              
              airports.push(airport);
            }
          }
          
          console.log(`Successfully parsed ${airports.length} airports from GitHub data`);
          resolve(airports);
        } catch (error) {
          console.error('Error parsing airports data:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching airports data:', error);
      reject(error);
    });
  });
}

async function importAirports() {
  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // First try to fetch data from GitHub
    let airports;
    try {
      airports = await fetchAirportsFromGithub();
      console.log(`Successfully fetched ${airports.length} airports from GitHub`);
    } catch (fetchError) {
      console.warn(`Failed to fetch airports from GitHub: ${fetchError.message}`);
      console.log('Using fallback airports data instead');
      airports = fallbackAirports;
    }

    if (airports.length === 0) {
      console.warn('No airports data to import, using fallback data');
      airports = fallbackAirports;
    }
    
    // Process the airport data in chunks to avoid query size limits
    const CHUNK_SIZE = 100;
    let totalImported = 0;
    
    for (let i = 0; i < airports.length; i += CHUNK_SIZE) {
      const chunk = airports.slice(i, i + CHUNK_SIZE);
      
      const values = chunk.map(airport => {
        // Properly escape string fields to prevent SQL injection
        const escapedName = airport.name.replace(/'/g, "''");
        const escapedCity = airport.city.replace(/'/g, "''");
        
        return `('${airport.iata_code}', '${escapedName}', '${escapedCity}', '${airport.country_id}', ${airport.latitude}, ${airport.longitude})`;
      }).join(',');
      
      const query = `
        INSERT INTO airports (iata_code, name, city, country_id, latitude, longitude) 
        VALUES ${values}
        ON CONFLICT (iata_code) DO UPDATE 
        SET name = EXCLUDED.name, 
            city = EXCLUDED.city, 
            country_id = EXCLUDED.country_id, 
            latitude = EXCLUDED.latitude, 
            longitude = EXCLUDED.longitude
      `;
      
      const result = await pool.query(query);
      totalImported += chunk.length;
      console.log(`Imported chunk of ${chunk.length} airports (${i+1}-${Math.min(i+CHUNK_SIZE, airports.length)} of ${airports.length})`);
    }
    
    console.log(`Total imported: ${totalImported} airports`);
    
    // Now update the airportCoordinates.ts file with the new data
    await updateAirportCoordinatesFile(airports);
    
    return { success: true, message: `Imported ${totalImported} airports` };
  } catch (error) {
    console.error('Error importing airports:', error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Function to update the airportCoordinates.ts file with the latest data
async function updateAirportCoordinatesFile(airports) {
  try {
    console.log('Updating airportCoordinates.ts file...');
    
    // Generate the file content
    let fileContent = `// This file is auto-generated from import-airports.js
// Contains coordinates for ${airports.length} airports

// Airport coordinates map: IATA code -> [longitude, latitude]
export const airportCoordinates: Record<string, [number, number]> = {
`;
    
    // Sort airports by IATA code for easier navigation
    const sortedAirports = [...airports].sort((a, b) => a.iata_code.localeCompare(b.iata_code));
    
    // Group airports by region (using first letter of country code as a simple grouping)
    const regions = {};
    sortedAirports.forEach(airport => {
      const region = airport.country_id.charAt(0);
      if (!regions[region]) {
        regions[region] = [];
      }
      regions[region].push(airport);
    });
    
    // Add airports by region
    Object.entries(regions).forEach(([region, regionAirports]) => {
      fileContent += `\n  // Region: ${region}\n`;
      
      regionAirports.forEach(airport => {
        fileContent += `  '${airport.iata_code}': [${airport.longitude}, ${airport.latitude}], // ${airport.name}, ${airport.city}\n`;
      });
    });
    
    fileContent += `};

/**
 * Get airport coordinates by IATA code
 * @param iataCode The IATA airport code
 * @returns [longitude, latitude] or a default if not found
 */
export function getAirportCoordinates(iataCode: string): [number, number] {
  // Ensure uppercase for airport code
  const uppercaseIata = iataCode.toUpperCase();
  const coordinates = airportCoordinates[uppercaseIata];
  
  if (coordinates) {
    return coordinates;
  } else {
    // Default to a location in the middle of the US if coordinates not found
    console.warn(\`No coordinates found for airport: \${iataCode}\`);
    return [-98.5, 39.5]; 
  }
}

/**
 * Check if coordinates are available for an airport
 * @param iataCode The IATA airport code
 * @returns true if coordinates exist
 */
export function hasAirportCoordinates(iataCode: string): boolean {
  // Ensure uppercase for airport code
  const uppercaseIata = iataCode.toUpperCase();
  return !!airportCoordinates[uppercaseIata];
}
`;
    
    // Write to file
    try {
      fs.writeFileSync('client/src/lib/airportCoordinates.ts', fileContent);
      console.log('Successfully updated airportCoordinates.ts file with data for', airports.length, 'airports');
    } catch (writeError) {
      console.error('Error writing to airportCoordinates.ts:', writeError);
      console.log('Would have updated client/src/lib/airportCoordinates.ts with data for', airports.length, 'airports');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating airportCoordinates.ts file:', error);
    return false;
  }
}

// Run the import
importAirports()
  .then(result => console.log(result))
  .catch(err => console.error('Import failed:', err));
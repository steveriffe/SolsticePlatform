/**
 * This script adds missing airports from the Alaska Airlines data
 * to the database, so the flights can be properly imported
 */

const { Pool } = require('pg');

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Missing airports data with coordinates
const missingAirports = [
  { 
    iataCode: 'SNA', 
    name: 'John Wayne Airport', 
    city: 'Santa Ana', 
    country: 'US', 
    latitude: 33.6762, 
    longitude: -117.8675 
  },
  { 
    iataCode: 'SJC', 
    name: 'San Jose International Airport', 
    city: 'San Jose', 
    country: 'US', 
    latitude: 37.3639, 
    longitude: -121.9289 
  },
  { 
    iataCode: 'ONT', 
    name: 'Ontario International Airport', 
    city: 'Ontario', 
    country: 'US', 
    latitude: 34.0558, 
    longitude: -117.6011 
  },
  { 
    iataCode: 'DCA', 
    name: 'Ronald Reagan Washington National Airport', 
    city: 'Washington', 
    country: 'US', 
    latitude: 38.8512, 
    longitude: -77.0402 
  },
  { 
    iataCode: 'OGG', 
    name: 'Kahului Airport', 
    city: 'Kahului', 
    country: 'US', 
    latitude: 20.8986, 
    longitude: -156.4305 
  },
  { 
    iataCode: 'KOA', 
    name: 'Ellison Onizuka Kona International Airport', 
    city: 'Kona', 
    country: 'US', 
    latitude: 19.7388, 
    longitude: -156.0456 
  },
  { 
    iataCode: 'LIH', 
    name: 'Lihue Airport', 
    city: 'Lihue', 
    country: 'US', 
    latitude: 21.9761, 
    longitude: -159.3389 
  },
  { 
    iataCode: 'JNU', 
    name: 'Juneau International Airport', 
    city: 'Juneau', 
    country: 'US', 
    latitude: 58.3548, 
    longitude: -134.5630 
  },
  { 
    iataCode: 'FAI', 
    name: 'Fairbanks International Airport', 
    city: 'Fairbanks', 
    country: 'US', 
    latitude: 64.8168, 
    longitude: -147.8669 
  },
  { 
    iataCode: 'BET', 
    name: 'Bethel Airport', 
    city: 'Bethel', 
    country: 'US', 
    latitude: 60.7798, 
    longitude: -161.8384 
  },
  { 
    iataCode: 'OTZ', 
    name: 'Ralph Wien Memorial Airport', 
    city: 'Kotzebue', 
    country: 'US', 
    latitude: 66.8847, 
    longitude: -162.5983 
  },
  { 
    iataCode: 'ADK', 
    name: 'Adak Airport', 
    city: 'Adak', 
    country: 'US', 
    latitude: 51.8781, 
    longitude: -176.6460 
  },
  { 
    iataCode: 'DLG', 
    name: 'Dillingham Airport', 
    city: 'Dillingham', 
    country: 'US', 
    latitude: 59.0454, 
    longitude: -158.5053 
  },
  { 
    iataCode: 'OME', 
    name: 'Nome Airport', 
    city: 'Nome', 
    country: 'US', 
    latitude: 64.5123, 
    longitude: -165.4456 
  },
  { 
    iataCode: 'BRW', 
    name: 'Wiley Post-Will Rogers Memorial Airport', 
    city: 'Barrow', 
    country: 'US', 
    latitude: 71.2854, 
    longitude: -156.7662 
  },
  { 
    iataCode: 'SCC', 
    name: 'Deadhorse Airport', 
    city: 'Prudhoe Bay', 
    country: 'US', 
    latitude: 70.1947, 
    longitude: -148.4650 
  },
  { 
    iataCode: 'YVR', 
    name: 'Vancouver International Airport', 
    city: 'Vancouver', 
    country: 'CA', 
    latitude: 49.1967, 
    longitude: -123.1815 
  },
  { 
    iataCode: 'IAH', 
    name: 'George Bush Intercontinental Airport', 
    city: 'Houston', 
    country: 'US', 
    latitude: 29.9902, 
    longitude: -95.3368 
  },
  {
    iataCode: 'BLI',
    name: 'Bellingham International Airport',
    city: 'Bellingham',
    country: 'US',
    latitude: 48.7928,
    longitude: -122.5376
  },
  {
    iataCode: 'MZT',
    name: 'General Rafael Buelna International Airport',
    city: 'Mazatlán',
    country: 'MX',
    latitude: 23.1614,
    longitude: -106.2659
  },
  {
    iataCode: 'ZIH',
    name: 'Ixtapa-Zihuatanejo International Airport',
    city: 'Ixtapa',
    country: 'MX',
    latitude: 17.6016,
    longitude: -101.4610
  },
  {
    iataCode: 'SJO',
    name: 'Juan Santamaría International Airport',
    city: 'San José',
    country: 'CR',
    latitude: 9.9981,
    longitude: -84.2041
  },
  {
    iataCode: 'CUN',
    name: 'Cancún International Airport',
    city: 'Cancún',
    country: 'MX',
    latitude: 21.0365,
    longitude: -86.8771
  },
  {
    iataCode: 'LTO',
    name: 'Loreto International Airport',
    city: 'Loreto',
    country: 'MX',
    latitude: 25.9892,
    longitude: -111.3481
  },
  {
    iataCode: 'LGB',
    name: 'Long Beach Airport',
    city: 'Long Beach',
    country: 'US',
    latitude: 33.8177,
    longitude: -118.1515
  },
  {
    iataCode: 'SBA',
    name: 'Santa Barbara Municipal Airport',
    city: 'Santa Barbara',
    country: 'US',
    latitude: 34.4262,
    longitude: -119.8415
  },
  {
    iataCode: 'PVR',
    name: 'Licenciado Gustavo Díaz Ordaz International Airport',
    city: 'Puerto Vallarta',
    country: 'MX',
    latitude: 20.6801,
    longitude: -105.2548
  },
  {
    iataCode: 'SJD',
    name: 'Los Cabos International Airport',
    city: 'San José del Cabo',
    country: 'MX',
    latitude: 23.1515,
    longitude: -109.7211
  },
  {
    iataCode: 'PSP',
    name: 'Palm Springs International Airport',
    city: 'Palm Springs',
    country: 'US',
    latitude: 33.8303,
    longitude: -116.5070
  },
  {
    iataCode: 'SMF',
    name: 'Sacramento International Airport',
    city: 'Sacramento',
    country: 'US',
    latitude: 38.6955,
    longitude: -121.5863
  },
  {
    iataCode: 'GEG',
    name: 'Spokane International Airport',
    city: 'Spokane',
    country: 'US',
    latitude: 47.6199,
    longitude: -117.5344
  },
  {
    iataCode: 'BZN',
    name: 'Bozeman Yellowstone International Airport',
    city: 'Bozeman',
    country: 'US',
    latitude: 45.7772,
    longitude: -111.1529
  },
  {
    iataCode: 'BOI',
    name: 'Boise Airport',
    city: 'Boise',
    country: 'US',
    latitude: 43.5644,
    longitude: -116.2228
  },
  {
    iataCode: 'MKE',
    name: 'Milwaukee Mitchell International Airport',
    city: 'Milwaukee',
    country: 'US',
    latitude: 42.9471,
    longitude: -87.8966
  },
  {
    iataCode: 'CVG',
    name: 'Cincinnati/Northern Kentucky International Airport',
    city: 'Cincinnati',
    country: 'US',
    latitude: 39.0488,
    longitude: -84.6678
  },
  {
    iataCode: 'STL',
    name: 'St. Louis Lambert International Airport',
    city: 'St. Louis',
    country: 'US',
    latitude: 38.7487,
    longitude: -90.3700
  },
  {
    iataCode: 'MSY',
    name: 'Louis Armstrong New Orleans International Airport',
    city: 'New Orleans',
    country: 'US',
    latitude: 29.9934,
    longitude: -90.2581
  },
  {
    iataCode: 'SAT',
    name: 'San Antonio International Airport',
    city: 'San Antonio',
    country: 'US',
    latitude: 29.5337,
    longitude: -98.4698
  },
  {
    iataCode: 'RNO',
    name: 'Reno-Tahoe International Airport',
    city: 'Reno',
    country: 'US',
    latitude: 39.5042,
    longitude: -119.7681
  },
  {
    iataCode: 'TUS',
    name: 'Tucson International Airport',
    city: 'Tucson',
    country: 'US',
    latitude: 32.1161,
    longitude: -110.9410
  },
  {
    iataCode: 'ABQ',
    name: 'Albuquerque International Sunport',
    city: 'Albuquerque',
    country: 'US',
    latitude: 35.0402,
    longitude: -106.6091
  },
  {
    iataCode: 'AUS',
    name: 'Austin–Bergstrom International Airport',
    city: 'Austin',
    country: 'US',
    latitude: 30.1945,
    longitude: -97.6699
  },
  {
    iataCode: 'DTW',
    name: 'Detroit Metropolitan Wayne County Airport',
    city: 'Detroit',
    country: 'US',
    latitude: 42.2124,
    longitude: -83.3534
  },
  {
    iataCode: 'PHL',
    name: 'Philadelphia International Airport',
    city: 'Philadelphia',
    country: 'US',
    latitude: 39.8729,
    longitude: -75.2437
  },
  {
    iataCode: 'RDU',
    name: 'Raleigh–Durham International Airport',
    city: 'Raleigh',
    country: 'US',
    latitude: 35.8801,
    longitude: -78.7880
  }
];

// Insert airports into database
async function insertMissingAirports() {
  const client = await pool.connect();
  const results = { success: 0, errors: [] };
  
  try {
    await client.query('BEGIN');
    
    // Check which airports already exist
    const existingAirports = await client.query('SELECT iata_code FROM airports');
    const existingCodes = new Set(existingAirports.rows.map(row => row.iata_code));
    
    console.log(`Found ${existingCodes.size} existing airports in database`);
    
    for (const airport of missingAirports) {
      // Skip if airport already exists
      if (existingCodes.has(airport.iataCode)) {
        console.log(`Airport ${airport.iataCode} already exists, skipping`);
        continue;
      }
      
      try {
        // Insert the airport
        await client.query(
          `INSERT INTO airports (
            iata_code, 
            name, 
            city, 
            country_id, 
            latitude, 
            longitude
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            airport.iataCode,
            airport.name,
            airport.city, 
            airport.country,
            airport.latitude,
            airport.longitude
          ]
        );
        
        console.log(`Added airport: ${airport.iataCode} - ${airport.name}`);
        results.success++;
      } catch (error) {
        console.error(`Error adding airport ${airport.iataCode}:`, error.message);
        results.errors.push(`Airport ${airport.iataCode}: ${error.message}`);
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    results.errors.push(`Transaction error: ${error.message}`);
  } finally {
    client.release();
  }
  
  return results;
}

// Main execution
async function main() {
  try {
    console.log('Adding missing airports to database...');
    const results = await insertMissingAirports();
    
    console.log('=== AIRPORT IMPORT SUMMARY ===');
    console.log(`Successfully added: ${results.success} airports`);
    
    if (results.errors.length > 0) {
      console.log(`Encountered ${results.errors.length} errors:`);
      results.errors.forEach((err, i) => console.log(`${i+1}. ${err}`));
    }
    
    console.log('=== AIRPORT IMPORT COMPLETE ===');
  } catch (error) {
    console.error('Script execution failed:', error);
  } finally {
    pool.end();
  }
}

main();
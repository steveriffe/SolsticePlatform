const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

// Create common airports data
const airports = [
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

async function importAirports() {
  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Insert all the airports at once
    const values = airports.map(airport => 
      `('${airport.iata_code}', '${airport.name}', '${airport.city}', '${airport.country_id}', ${airport.latitude}, ${airport.longitude})`
    ).join(',');
    
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
    console.log(`Inserted ${result.rowCount} airports`);
    
    return { success: true, message: `Imported ${airports.length} airports` };
  } catch (error) {
    console.error('Error importing airports:', error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Run the import
importAirports()
  .then(result => console.log(result))
  .catch(err => console.error('Import failed:', err));
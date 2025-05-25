// Script to import airline data with names and colors to the database
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Connect to the database
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true 
});

// Comprehensive airline data with names and colors
const airlineData = [
  // Star Alliance Members
  { code: 'AC', name: 'Air Canada', color: '#D82E28' },
  { code: 'NH', name: 'All Nippon Airways (ANA)', color: '#13448F' },
  { code: 'OS', name: 'Austrian Airlines', color: '#CC0000' },
  { code: 'AV', name: 'Avianca', color: '#D20000' },
  { code: 'SN', name: 'Brussels Airlines', color: '#00318B' },
  { code: 'CM', name: 'Copa Airlines', color: '#1A3668' },
  { code: 'OU', name: 'Croatia Airlines', color: '#C80C1C' },
  { code: 'MS', name: 'EgyptAir', color: '#005AA9' },
  { code: 'ET', name: 'Ethiopian Airlines', color: '#628C3D' },
  { code: 'BR', name: 'EVA Air', color: '#016A3A' },
  { code: 'LO', name: 'LOT Polish Airlines', color: '#11397D' },
  { code: 'LH', name: 'Lufthansa', color: '#0C2240' },
  { code: 'SK', name: 'SAS Scandinavian Airlines', color: '#003D87' },
  { code: 'ZH', name: 'Shenzhen Airlines', color: '#D11F2F' },
  { code: 'SQ', name: 'Singapore Airlines', color: '#1D4489' },
  { code: 'SA', name: 'South African Airways', color: '#0B2742' },
  { code: 'LX', name: 'Swiss International Air Lines', color: '#E30614' },
  { code: 'TP', name: 'TAP Air Portugal', color: '#00A54F' },
  { code: 'TG', name: 'Thai Airways International', color: '#520F8A' },
  { code: 'TK', name: 'Turkish Airlines', color: '#E81932' },
  { code: 'UA', name: 'United Airlines', color: '#002244' },
  
  // Oneworld Alliance Members
  { code: 'AA', name: 'American Airlines', color: '#0078D2' },
  { code: 'BA', name: 'British Airways', color: '#075AAA' },
  { code: 'CX', name: 'Cathay Pacific', color: '#006564' },
  { code: 'FJ', name: 'Fiji Airways', color: '#00ADEF' },
  { code: 'AY', name: 'Finnair', color: '#0F1689' },
  { code: 'IB', name: 'Iberia', color: '#D40F14' },
  { code: 'JL', name: 'Japan Airlines', color: '#E60012' },
  { code: 'MH', name: 'Malaysia Airlines', color: '#006DB7' },
  { code: 'QF', name: 'Qantas Airways', color: '#EE0000' },
  { code: 'QR', name: 'Qatar Airways', color: '#5C0632' },
  { code: 'RJ', name: 'Royal Jordanian', color: '#5E3B28' },
  { code: 'UL', name: 'SriLankan Airlines', color: '#AD1920' },
  { code: 'LA', name: 'LATAM Airlines', color: '#0065A9' },
  
  // SkyTeam Alliance Members
  { code: 'AR', name: 'Aerolíneas Argentinas', color: '#74CCED' },
  { code: 'AM', name: 'Aeromexico', color: '#0F3A8B' },
  { code: 'AF', name: 'Air France', color: '#002157' },
  { code: 'AZ', name: 'Alitalia', color: '#00853F' },
  { code: 'CI', name: 'China Airlines', color: '#CC0001' },
  { code: 'MU', name: 'China Eastern Airlines', color: '#C94B32' },
  { code: 'CZ', name: 'China Southern Airlines', color: '#1C64B4' },
  { code: 'OK', name: 'Czech Airlines', color: '#00579C' },
  { code: 'DL', name: 'Delta Air Lines', color: '#E01933' },
  { code: 'GA', name: 'Garuda Indonesia', color: '#035AA6' },
  { code: 'KQ', name: 'Kenya Airways', color: '#C82927' },
  { code: 'KL', name: 'KLM Royal Dutch Airlines', color: '#00A1DE' },
  { code: 'KE', name: 'Korean Air', color: '#00256C' },
  { code: 'ME', name: 'Middle East Airlines', color: '#DA291C' },
  { code: 'SV', name: 'Saudia', color: '#006341' },
  { code: 'RO', name: 'TAROM', color: '#00438C' },
  { code: 'VN', name: 'Vietnam Airlines', color: '#00599F' },
  { code: 'MF', name: 'Xiamen Airlines', color: '#0066B3' },
  
  // North American Airlines (not in alliances)
  { code: 'AS', name: 'Alaska Airlines', color: '#0060AB' },
  { code: 'B6', name: 'JetBlue Airways', color: '#003876' },
  { code: 'WN', name: 'Southwest Airlines', color: '#304CB2' },
  { code: 'WS', name: 'WestJet', color: '#0F3583' },
  { code: 'F9', name: 'Frontier Airlines', color: '#00A650' },
  { code: 'NK', name: 'Spirit Airlines', color: '#FFFF00' },
  { code: 'G4', name: 'Allegiant Air', color: '#003DA5' },
  { code: 'HA', name: 'Hawaiian Airlines', color: '#5A0478' },
  { code: 'Y4', name: 'Volaris', color: '#C5007C' },
  { code: 'SY', name: 'Sun Country Airlines', color: '#004B97' },
  
  // European Airlines (not in alliances)
  { code: 'EI', name: 'Aer Lingus', color: '#00A65A' },
  { code: 'FR', name: 'Ryanair', color: '#073590' },
  { code: 'U2', name: 'easyJet', color: '#FF6600' },
  { code: 'VS', name: 'Virgin Atlantic', color: '#E10D0D' },
  { code: 'DE', name: 'Condor', color: '#FFAD00' },
  { code: 'SU', name: 'Aeroflot', color: '#00256A' },
  { code: 'PS', name: 'Ukraine International Airlines', color: '#1860A9' },
  { code: 'A3', name: 'Aegean Airlines', color: '#00508F' },
  { code: 'W6', name: 'Wizz Air', color: '#C31574' },
  { code: 'VY', name: 'Vueling Airlines', color: '#FFB805' },
  { code: 'EW', name: 'Eurowings', color: '#05164D' },
  
  // Asian & Middle Eastern Airlines (not in alliances)
  { code: 'EK', name: 'Emirates', color: '#D71921' },
  { code: 'EY', name: 'Etihad Airways', color: '#BD8B13' },
  { code: 'OZ', name: 'Asiana Airlines', color: '#00689D' },
  { code: 'CA', name: 'Air China', color: '#E10600' },
  { code: 'AI', name: 'Air India', color: '#FF0000' },
  { code: 'HX', name: 'Hong Kong Airlines', color: '#D9001E' },
  { code: 'HU', name: 'Hainan Airlines', color: '#B81C22' },
  { code: 'JQ', name: 'Jetstar Airways', color: '#FF5000' },
  { code: 'AK', name: 'AirAsia', color: '#FF0000' },
  { code: 'GF', name: 'Gulf Air', color: '#B51F25' },
  { code: 'LY', name: 'El Al Israel Airlines', color: '#003399' },
  
  // Oceania Airlines (not in alliances)
  { code: 'NZ', name: 'Air New Zealand', color: '#00247D' },
  { code: 'VA', name: 'Virgin Australia', color: '#CC0001' },
  
  // Historical Airlines
  { code: 'NW', name: 'Northwest Airlines', color: '#D12630' },
  { code: 'TW', name: 'Trans World Airlines (TWA)', color: '#981E32' },
  { code: 'CO', name: 'Continental Airlines', color: '#072F6B' },
  { code: 'US', name: 'US Airways', color: '#005DAA' },
  { code: 'PA', name: 'Pan American World Airways (Pan Am)', color: '#0039A6' },
  { code: 'EA', name: 'Eastern Air Lines', color: '#004B85' },
  { code: 'VX', name: 'Virgin America', color: '#CE0058' },
];

// Import the airline data
async function importAirlineData() {
  console.log('Starting to import airline data...');
  
  for (const airline of airlineData) {
    try {
      // Update or insert airlines
      const query = `
        INSERT INTO airlines (airline_id, airline_name, brand_color_primary) 
        VALUES ($1, $2, $3)
        ON CONFLICT (airline_id) 
        DO UPDATE SET 
          airline_name = $2,
          brand_color_primary = $3
      `;
      
      await pool.query(query, [airline.code, airline.name, airline.color]);
      console.log(`Updated airline: ${airline.code} - ${airline.name}`);
    } catch (error) {
      console.error(`Error updating airline ${airline.code}:`, error);
    }
  }
  
  console.log('Airline data import completed');
}

// Run the import function
importAirlineData()
  .then(() => console.log('Finished updating airline data'))
  .catch(err => console.error('Error in import process:', err))
  .finally(() => pool.end());
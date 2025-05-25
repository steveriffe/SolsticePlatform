const fs = require('fs');
const https = require('https');
const { Pool } = require('@neondatabase/serverless');

// Comprehensive airline data with current and historical airlines
const fallbackAirlines = [
  // Star Alliance Members
  { iata_code: 'AC', airline_name: 'Air Canada' },
  { iata_code: 'NH', airline_name: 'All Nippon Airways (ANA)' },
  { iata_code: 'OS', airline_name: 'Austrian Airlines' },
  { iata_code: 'AV', airline_name: 'Avianca' },
  { iata_code: 'SN', airline_name: 'Brussels Airlines' },
  { iata_code: 'CM', airline_name: 'Copa Airlines' },
  { iata_code: 'OU', airline_name: 'Croatia Airlines' },
  { iata_code: 'MS', airline_name: 'EgyptAir' },
  { iata_code: 'ET', airline_name: 'Ethiopian Airlines' },
  { iata_code: 'BR', airline_name: 'EVA Air' },
  { iata_code: 'LO', airline_name: 'LOT Polish Airlines' },
  { iata_code: 'LH', airline_name: 'Lufthansa' },
  { iata_code: 'SK', airline_name: 'SAS Scandinavian Airlines' },
  { iata_code: 'ZH', airline_name: 'Shenzhen Airlines' },
  { iata_code: 'SQ', airline_name: 'Singapore Airlines' },
  { iata_code: 'SA', airline_name: 'South African Airways' },
  { iata_code: 'LX', airline_name: 'Swiss International Air Lines' },
  { iata_code: 'TP', airline_name: 'TAP Air Portugal' },
  { iata_code: 'TG', airline_name: 'Thai Airways International' },
  { iata_code: 'TK', airline_name: 'Turkish Airlines' },
  { iata_code: 'UA', airline_name: 'United Airlines' },
  
  // Oneworld Alliance Members
  { iata_code: 'AA', airline_name: 'American Airlines' },
  { iata_code: 'BA', airline_name: 'British Airways' },
  { iata_code: 'CX', airline_name: 'Cathay Pacific' },
  { iata_code: 'FJ', airline_name: 'Fiji Airways' },
  { iata_code: 'AY', airline_name: 'Finnair' },
  { iata_code: 'IB', airline_name: 'Iberia' },
  { iata_code: 'JL', airline_name: 'Japan Airlines' },
  { iata_code: 'MH', airline_name: 'Malaysia Airlines' },
  { iata_code: 'QF', airline_name: 'Qantas Airways' },
  { iata_code: 'QR', airline_name: 'Qatar Airways' },
  { iata_code: 'RJ', airline_name: 'Royal Jordanian' },
  { iata_code: 'UL', airline_name: 'SriLankan Airlines' },
  { iata_code: 'LA', airline_name: 'LATAM Airlines' },
  
  // SkyTeam Alliance Members
  { iata_code: 'AR', airline_name: 'Aerolíneas Argentinas' },
  { iata_code: 'AM', airline_name: 'Aeromexico' },
  { iata_code: 'AF', airline_name: 'Air France' },
  { iata_code: 'AZ', airline_name: 'Alitalia' },
  { iata_code: 'CI', airline_name: 'China Airlines' },
  { iata_code: 'MU', airline_name: 'China Eastern Airlines' },
  { iata_code: 'CZ', airline_name: 'China Southern Airlines' },
  { iata_code: 'OK', airline_name: 'Czech Airlines' },
  { iata_code: 'DL', airline_name: 'Delta Air Lines' },
  { iata_code: 'GA', airline_name: 'Garuda Indonesia' },
  { iata_code: 'KQ', airline_name: 'Kenya Airways' },
  { iata_code: 'KL', airline_name: 'KLM Royal Dutch Airlines' },
  { iata_code: 'KE', airline_name: 'Korean Air' },
  { iata_code: 'ME', airline_name: 'Middle East Airlines' },
  { iata_code: 'SV', airline_name: 'Saudia' },
  { iata_code: 'RO', airline_name: 'TAROM' },
  { iata_code: 'VN', airline_name: 'Vietnam Airlines' },
  { iata_code: 'MF', airline_name: 'Xiamen Airlines' },
  
  // North American Airlines (not in alliances)
  { iata_code: 'AS', airline_name: 'Alaska Airlines' },
  { iata_code: 'B6', airline_name: 'JetBlue Airways' },
  { iata_code: 'WN', airline_name: 'Southwest Airlines' },
  { iata_code: 'WS', airline_name: 'WestJet' },
  { iata_code: 'F9', airline_name: 'Frontier Airlines' },
  { iata_code: 'NK', airline_name: 'Spirit Airlines' },
  { iata_code: 'G4', airline_name: 'Allegiant Air' },
  { iata_code: 'HA', airline_name: 'Hawaiian Airlines' },
  { iata_code: 'Y4', airline_name: 'Volaris' },
  { iata_code: 'SY', airline_name: 'Sun Country Airlines' },
  { iata_code: 'MX', airline_name: 'Mexicana' },
  { iata_code: 'YV', airline_name: 'Mesa Airlines' },
  { iata_code: '9E', airline_name: 'Endeavor Air' },
  { iata_code: 'YX', airline_name: 'Republic Airways' },
  
  // European Airlines (not in alliances)
  { iata_code: 'EI', airline_name: 'Aer Lingus' },
  { iata_code: 'FR', airline_name: 'Ryanair' },
  { iata_code: 'U2', airline_name: 'easyJet' },
  { iata_code: 'VS', airline_name: 'Virgin Atlantic' },
  { iata_code: 'DE', airline_name: 'Condor' },
  { iata_code: 'SU', airline_name: 'Aeroflot' },
  { iata_code: 'PS', airline_name: 'Ukraine International Airlines' },
  { iata_code: 'A3', airline_name: 'Aegean Airlines' },
  { iata_code: 'W6', airline_name: 'Wizz Air' },
  { iata_code: 'VY', airline_name: 'Vueling Airlines' },
  { iata_code: 'AB', airline_name: 'Air Berlin' },
  { iata_code: 'BE', airline_name: 'Flybe' },
  { iata_code: 'AZ', airline_name: 'ITA Airways (formerly Alitalia)' },
  { iata_code: 'HV', airline_name: 'Transavia' },
  { iata_code: 'LG', airline_name: 'Luxair' },
  { iata_code: 'LS', airline_name: 'Jet2' },
  { iata_code: 'TO', airline_name: 'Transavia France' },
  { iata_code: 'HG', airline_name: 'Niki' },
  { iata_code: 'EW', airline_name: 'Eurowings' },
  
  // Asian & Middle Eastern Airlines (not in alliances)
  { iata_code: 'EK', airline_name: 'Emirates' },
  { iata_code: 'EY', airline_name: 'Etihad Airways' },
  { iata_code: 'OZ', airline_name: 'Asiana Airlines' },
  { iata_code: 'CA', airline_name: 'Air China' },
  { iata_code: 'AI', airline_name: 'Air India' },
  { iata_code: '9W', airline_name: 'Jet Airways' },
  { iata_code: 'HX', airline_name: 'Hong Kong Airlines' },
  { iata_code: 'HU', airline_name: 'Hainan Airlines' },
  { iata_code: 'JQ', airline_name: 'Jetstar Airways' },
  { iata_code: 'AK', airline_name: 'AirAsia' },
  { iata_code: 'GF', airline_name: 'Gulf Air' },
  { iata_code: 'LY', airline_name: 'El Al Israel Airlines' },
  { iata_code: 'SG', airline_name: 'SpiceJet' },
  { iata_code: 'G9', airline_name: 'Air Arabia' },
  { iata_code: 'FZ', airline_name: 'Flydubai' },
  { iata_code: 'WY', airline_name: 'Oman Air' },
  { iata_code: 'PG', airline_name: 'Bangkok Airways' },
  { iata_code: 'BX', airline_name: 'Air Busan' },
  { iata_code: 'ZE', airline_name: 'Eastar Jet' },
  { iata_code: 'QZ', airline_name: 'Indonesia AirAsia' },
  { iata_code: 'TR', airline_name: 'Scoot' },
  { iata_code: 'MJ', airline_name: 'Mihin Lanka' },
  { iata_code: 'FD', airline_name: 'Thai AirAsia' },
  
  // African Airlines (not in alliances)
  { iata_code: 'AT', airline_name: 'Royal Air Maroc' },
  { iata_code: 'TU', airline_name: 'Tunisair' },
  { iata_code: 'W3', airline_name: 'Arik Air' },
  { iata_code: 'DN', airline_name: 'Air Senegal' },
  { iata_code: 'WB', airline_name: 'Rwandair' },
  { iata_code: 'KM', airline_name: 'Air Malta' },
  { iata_code: 'J2', airline_name: 'Azerbaijan Airlines' },
  
  // Oceania Airlines (not in alliances)
  { iata_code: 'NZ', airline_name: 'Air New Zealand' },
  { iata_code: 'VA', airline_name: 'Virgin Australia' },
  { iata_code: 'TN', airline_name: 'Air Tahiti Nui' },
  { iata_code: 'JQ', airline_name: 'Jetstar Airways' },
  { iata_code: 'GK', airline_name: 'Jetstar Japan' },
  
  // South American Airlines (not in alliances)
  { iata_code: 'H2', airline_name: 'Sky Airline' },
  { iata_code: 'G3', airline_name: 'Gol Transportes Aéreos' },
  { iata_code: 'JJ', airline_name: 'LATAM Brasil' },
  { iata_code: 'LP', airline_name: 'LATAM Peru' },
  { iata_code: 'PZ', airline_name: 'Paranair' },
  { iata_code: 'PU', airline_name: 'Plus Ultra Líneas Aéreas' },
  { iata_code: 'EQ', airline_name: 'TAME' },
  
  // Notable Historical Airlines (no longer operating)
  { iata_code: 'NW', airline_name: 'Northwest Airlines' },
  { iata_code: 'TW', airline_name: 'Trans World Airlines (TWA)' },
  { iata_code: 'CO', airline_name: 'Continental Airlines' },
  { iata_code: 'US', airline_name: 'US Airways' },
  { iata_code: 'PA', airline_name: 'Pan American World Airways (Pan Am)' },
  { iata_code: 'EA', airline_name: 'Eastern Air Lines' },
  { iata_code: 'BN', airline_name: 'Braniff International Airways' },
  { iata_code: 'WA', airline_name: 'Western Airlines' },
  { iata_code: 'OZ', airline_name: 'Ozark Air Lines' },
  { iata_code: 'MG', airline_name: 'Midwest Express' },
  { iata_code: 'RC', airline_name: 'Republic Airlines' },
  { iata_code: 'PE', airline_name: 'People Express Airlines' },
  { iata_code: 'PI', airline_name: 'Piedmont Airlines' },
  { iata_code: 'SR', airline_name: 'Swissair' },
  { iata_code: 'RG', airline_name: 'VARIG' },
  { iata_code: 'AN', airline_name: 'Ansett Australia' },
  { iata_code: 'BD', airline_name: 'British Midland International (BMI)' },
  { iata_code: 'FL', airline_name: 'AirTran Airways' },
  { iata_code: 'VX', airline_name: 'Virgin America' }
];

// Function to fetch airline data from GitHub gist
async function fetchAirlinesFromGithub() {
  return new Promise((resolve, reject) => {
    console.log('Fetching airline data from GitHub...');
    
    const url = 'https://gist.githubusercontent.com/wfaulk/f5d42bfe5c629dbb87c6474e0254ea4f/raw/66c10adcf5d1fbd6bf507d3d6a28e283dd29aa1c/iata_codes.csv';
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log('Received airline data, processing...');
          
          // Parse the CSV data
          const lines = data.split('\\n');
          const header = lines[0].split(',');
          
          // Find the index of important columns
          const codeIndex = header.findIndex(h => h.trim() === 'Code');
          const nameIndex = header.findIndex(h => h.trim() === 'Name');
          
          if (codeIndex === -1 || nameIndex === -1) {
            throw new Error('Could not find required columns in CSV');
          }
          
          const airlines = [];
          
          // Skip the header row
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Split the line on commas, handling quoted fields
            const row = lines[i].split(',');
            
            // Extract the IATA code and airline name
            const iataCode = row[codeIndex]?.trim();
            const airlineName = row[nameIndex]?.trim();
            
            if (iataCode && airlineName) {
              airlines.push({
                iata_code: iataCode,
                airline_name: airlineName
              });
            }
          }
          
          console.log(`Successfully parsed ${airlines.length} airlines from GitHub data`);
          resolve(airlines);
        } catch (error) {
          console.error('Error parsing airline data:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching airline data:', error);
      reject(error);
    });
  });
}

async function importAirlines() {
  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Skip the GitHub fetch and use our comprehensive airline list directly
    console.log('Using comprehensive airline database...');
    let airlines = fallbackAirlines;
    
    // Process the airline data in chunks to avoid query size limits
    const CHUNK_SIZE = 50;
    let totalImported = 0;
    
    for (let i = 0; i < airlines.length; i += CHUNK_SIZE) {
      const chunk = airlines.slice(i, i + CHUNK_SIZE);
      
      const values = chunk.map(airline => {
        // Properly escape string fields to prevent SQL injection
        const escapedName = airline.airline_name.replace(/'/g, "''");
        
        return `('${airline.iata_code}', '${escapedName}')`;
      }).join(',');
      
      const query = `
        INSERT INTO airlines (airline_id, airline_name) 
        VALUES ${values}
        ON CONFLICT (airline_id) DO UPDATE 
        SET airline_name = EXCLUDED.airline_name
      `;
      
      try {
        const result = await pool.query(query);
        totalImported += chunk.length;
        console.log(`Imported chunk of ${chunk.length} airlines (${i+1}-${Math.min(i+CHUNK_SIZE, airlines.length)} of ${airlines.length})`);
      } catch (chunkError) {
        console.error(`Error importing chunk: ${chunkError.message}`);
      }
    }
    
    console.log(`Total imported: ${totalImported} airlines`);
    
    // Generate airline color mappings
    await generateAirlineColors(pool, airlines);
    
    return { success: true, message: `Imported ${totalImported} airlines` };
  } catch (error) {
    console.error('Error importing airlines:', error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Generate colors for airlines based on airline codes
async function generateAirlineColors(pool, airlines) {
  // Common airline brand colors (actual brand colors where available)
  const brandColors = {
    // North American Airlines
    'AA': ['#0078D2', '#C4D8E7'], // American Airlines
    'DL': ['#E01933', '#003A70'], // Delta
    'UA': ['#002244', '#3399CC'], // United
    'WN': ['#F9B612', '#304CB2'], // Southwest
    'AS': ['#0060AB', '#41B6E6'], // Alaska
    'B6': ['#003876', '#00A1DE'], // JetBlue
    'AC': ['#D22630', '#000000'], // Air Canada
    'WS': ['#0F3583', '#C8102E'], // WestJet
    'F9': ['#00A650', '#104536'], // Frontier
    'NK': ['#FFFF00', '#000000'], // Spirit
    'G4': ['#FFBF27', '#003DA5'], // Allegiant
    'HA': ['#5A0478', '#E94344'], // Hawaiian
    'AM': ['#01529B', '#FA4616'], // Aeromexico
    'Y4': ['#C5007C', '#5C068C'], // Volaris
    'SY': ['#004B97', '#FAC739'], // Sun Country
    'MX': ['#006341', '#FBBA0A'], // Mexicana
    'FL': ['#173B80', '#C62026'], // AirTran
    'VX': ['#CE0058', '#76787A'], // Virgin America
    
    // European Airlines
    'BA': ['#075AAA', '#EB2226'], // British Airways
    'LH': ['#05164D', '#FFAD1D'], // Lufthansa
    'AF': ['#002157', '#FF0000'], // Air France
    'KL': ['#00A1DE', '#FFFFFF'], // KLM
    'IB': ['#FF0000', '#FFFF00'], // Iberia
    'AZ': ['#00843D', '#003580'], // Alitalia
    'LX': ['#FF0000', '#FFFFFF'], // Swiss
    'SK': ['#006AA7', '#FFFFFF'], // SAS
    'OS': ['#FF0000', '#FFFFFF'], // Austrian
    'SN': ['#003580', '#FF0000'], // Brussels
    'TP': ['#00995D', '#EE3124'], // TAP Portugal
    'AY': ['#0F1689', '#FFFFFF'], // Finnair
    'LO': ['#FF0000', '#FFFFFF'], // LOT Polish
    'OK': ['#003A70', '#FF0000'], // Czech Airlines
    'EI': ['#00A65A', '#FFFFFF'], // Aer Lingus
    'FR': ['#073590', '#F9DD16'], // Ryanair
    'U2': ['#FF6600', '#000000'], // easyJet
    'BE': ['#672A85', '#D8E965'], // Flybe
    'AB': ['#F31454', '#FFFFFF'], // Air Berlin
    'VS': ['#E10D0D', '#FFFFFF'], // Virgin Atlantic
    'DE': ['#FFAD00', '#003B70'], // Condor
    'TK': ['#C70A0C', '#FFFFFF'], // Turkish
    'SU': ['#00256A', '#FF0000'], // Aeroflot
    'PS': ['#1860A9', '#FFD500'], // Ukraine Intl
    'A3': ['#00508F', '#FFFFFF'], // Aegean
    
    // Asian Airlines
    'NH': ['#00256C', '#D01C50'], // ANA
    'JL': ['#E60012', '#FFFFFF'], // Japan Airlines
    'KE': ['#00256C', '#DC1431'], // Korean Air
    'OZ': ['#00689D', '#94D1E5'], // Asiana
    'CX': ['#006564', '#767171'], // Cathay Pacific
    'CZ': ['#0066B2', '#FF0000'], // China Southern
    'MU': ['#1A1F71', '#FF0000'], // China Eastern
    'CA': ['#E10600', '#FFFFFF'], // Air China
    'BR': ['#006940', '#FFFFFF'], // EVA Air
    'CI': ['#00518C', '#FFFFFF'], // China Airlines
    'SQ': ['#F1A52C', '#011E41'], // Singapore Airlines
    'MH': ['#006DB7', '#B30838'], // Malaysia Airlines
    'TG': ['#69027E', '#FF9E1B'], // Thai Airways
    'PR': ['#003876', '#FFDF00'], // Philippine Airlines
    'GA': ['#035AA6', '#FFA70B'], // Garuda Indonesia
    'VN': ['#00599F', '#CF0909'], // Vietnam Airlines
    'AI': ['#FF0000', '#FFFFFF'], // Air India
    
    // Middle Eastern & African Airlines
    'EK': ['#D71921', '#FFFFFF'], // Emirates
    'EY': ['#BD8B13', '#D3A029'], // Etihad
    'QR': ['#5C0632', '#FFFFFF'], // Qatar
    'SV': ['#006341', '#FFFFFF'], // Saudia
    'GF': ['#B51F25', '#FFFFFF'], // Gulf Air
    'MS': ['#003580', '#FFFFFF'], // EgyptAir
    'RJ': ['#5E3B28', '#FFFFFF'], // Royal Jordanian
    'LY': ['#003399', '#FFFFFF'], // El Al
    'ET': ['#009B3A', '#FFCC29'], // Ethiopian
    'SA': ['#306EB5', '#00953A'], // South African
    'KQ': ['#C82927', '#FFFFFF'], // Kenya Airways
    
    // Oceania Airlines
    'QF': ['#EE0000', '#FFFFFF'], // Qantas
    'NZ': ['#00247D', '#FFFFFF'], // Air New Zealand
    'VA': ['#CC0001', '#FFFFFF'], // Virgin Australia
    
    // South American Airlines
    'LA': ['#0065A9', '#EB0000'], // LATAM
    'CM': ['#1A3871', '#CC0A2F'], // Copa
    'AV': ['#0057B8', '#D41217'], // Avianca
    'AR': ['#72CDEF', '#1B1464'], // Aerolineas Argentinas
    
    // Historical Airlines
    'NW': ['#D12630', '#0C1C47'], // Northwest Airlines
    'TW': ['#981E32', '#FFFFFF'], // TWA
    'CO': ['#072F6B', '#C4A15A'], // Continental
    'US': ['#005DAA', '#D82A20'], // US Airways
    'PA': ['#0039A6', '#D41E26'], // Pan Am
    'EA': ['#004B85', '#AED5E7'], // Eastern
    'BN': ['#FF5000', '#0077B6'], // Braniff
    'SR': ['#FF0000', '#FFFFFF'], // Swissair
    'BD': ['#CC0000', '#000000']  // BMI
  };
  
  // Function to generate a pseudo-random but consistent color based on airline code
  function generateColor(code) {
    // Simple hash of the code
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a vibrant primary color
    const h = Math.abs(hash) % 360; // Hue (0-360)
    const s = 70 + (Math.abs(hash) % 20); // Saturation (70-90%)
    const l = 40 + (Math.abs(hash) % 15); // Lightness (40-55%)
    
    // Generate a complementary color for secondary
    const h2 = (h + 180) % 360;
    const s2 = 60 + (Math.abs(hash) % 20);
    const l2 = 75 + (Math.abs(hash) % 15);
    
    return [
      `hsl(${h}, ${s}%, ${l}%)`,
      `hsl(${h2}, ${s2}%, ${l2}%)`
    ];
  }
  
  try {
    // For each airline, update with colors if needed
    for (const airline of airlines) {
      const code = airline.iata_code;
      if (!code) continue;
      
      // Use predefined colors or generate ones
      const colors = brandColors[code] || generateColor(code);
      
      const updateQuery = `
        UPDATE airlines 
        SET 
          brand_color_primary = $1,
          brand_color_secondary = $2,
          needs_manual_color_input = false
        WHERE 
          airline_id = $3 AND
          (needs_manual_color_input = true OR brand_color_primary = '#FFFFFF')
      `;
      
      try {
        await pool.query(updateQuery, [colors[0], colors[1], code]);
      } catch (colorError) {
        console.error(`Error updating colors for ${code}:`, colorError.message);
      }
    }
    
    console.log('Updated airline colors');
    return true;
  } catch (error) {
    console.error('Error generating airline colors:', error);
    return false;
  }
}

// Run the import
importAirlines()
  .then(result => console.log(result))
  .catch(err => console.error('Import failed:', err));
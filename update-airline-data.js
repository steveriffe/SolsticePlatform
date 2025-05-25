// Script to update airline names and colors in the database
require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');

async function updateAirlineData() {
  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Starting airline data update...');
    
    // List of airlines with proper names and colors
    const airlineData = [
      // North American Airlines
      { airlineId: 'G4', airlineName: 'Allegiant Air', brandColorPrimary: '#EC7300', brandColorSecondary: '#003A79' },
      { airlineId: 'NK', airlineName: 'Spirit Airlines', brandColorPrimary: '#FFEC00', brandColorSecondary: '#231F20' },
      { airlineId: 'F9', airlineName: 'Frontier Airlines', brandColorPrimary: '#008D32', brandColorSecondary: '#343A40' },
      { airlineId: 'B6', airlineName: 'JetBlue Airways', brandColorPrimary: '#0033A0', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'AC', airlineName: 'Air Canada', brandColorPrimary: '#D22630', brandColorSecondary: '#000000' },
      { airlineId: 'WN', airlineName: 'Southwest Airlines', brandColorPrimary: '#304CB2', brandColorSecondary: '#F9B612' },
      { airlineId: 'WS', airlineName: 'WestJet', brandColorPrimary: '#0F72AC', brandColorSecondary: '#2CA5DF' },
      { airlineId: 'AS', airlineName: 'Alaska Airlines', brandColorPrimary: '#0060AB', brandColorSecondary: '#8CC63F' },
      { airlineId: 'SY', airlineName: 'Sun Country Airlines', brandColorPrimary: '#004B8D', brandColorSecondary: '#FFC423' },
      { airlineId: 'HA', airlineName: 'Hawaiian Airlines', brandColorPrimary: '#522398', brandColorSecondary: '#E93A8F' },
      
      // European Airlines
      { airlineId: 'LH', airlineName: 'Lufthansa', brandColorPrimary: '#05164D', brandColorSecondary: '#FFAD00' },
      { airlineId: 'BA', airlineName: 'British Airways', brandColorPrimary: '#075AAA', brandColorSecondary: '#EB2226' },
      { airlineId: 'AF', airlineName: 'Air France', brandColorPrimary: '#002157', brandColorSecondary: '#FF0000' },
      { airlineId: 'KL', airlineName: 'KLM Royal Dutch Airlines', brandColorPrimary: '#00A1DE', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'IB', airlineName: 'Iberia', brandColorPrimary: '#C61E45', brandColorSecondary: '#FABE48' },
      { airlineId: 'AZ', airlineName: 'Alitalia', brandColorPrimary: '#006DB7', brandColorSecondary: '#35853B' },
      { airlineId: 'LX', airlineName: 'Swiss International Air Lines', brandColorPrimary: '#E0000E', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'SK', airlineName: 'SAS Scandinavian Airlines', brandColorPrimary: '#000F9F', brandColorSecondary: '#E50012' },
      { airlineId: 'OS', airlineName: 'Austrian Airlines', brandColorPrimary: '#E10919', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'TP', airlineName: 'TAP Air Portugal', brandColorPrimary: '#008A95', brandColorSecondary: '#D1141D' },
      { airlineId: 'FR', airlineName: 'Ryanair', brandColorPrimary: '#073590', brandColorSecondary: '#FFDD00' },
      { airlineId: 'U2', airlineName: 'easyJet', brandColorPrimary: '#FF6600', brandColorSecondary: '#000000' },
      { airlineId: 'W6', airlineName: 'Wizz Air', brandColorPrimary: '#C71C87', brandColorSecondary: '#00136C' },
      { airlineId: 'VS', airlineName: 'Virgin Atlantic', brandColorPrimary: '#E3001B', brandColorSecondary: '#4C005B' },
      
      // Asian & Middle Eastern Airlines
      { airlineId: 'EK', airlineName: 'Emirates', brandColorPrimary: '#D71921', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'EY', airlineName: 'Etihad Airways', brandColorPrimary: '#BD8B13', brandColorSecondary: '#6C0026' },
      { airlineId: 'QR', airlineName: 'Qatar Airways', brandColorPrimary: '#5C0632', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'SQ', airlineName: 'Singapore Airlines', brandColorPrimary: '#F1A52C', brandColorSecondary: '#011E41' },
      { airlineId: 'CX', airlineName: 'Cathay Pacific', brandColorPrimary: '#006564', brandColorSecondary: '#767171' },
      { airlineId: 'MH', airlineName: 'Malaysia Airlines', brandColorPrimary: '#006DB7', brandColorSecondary: '#B30838' },
      { airlineId: 'TG', airlineName: 'Thai Airways', brandColorPrimary: '#A31D36', brandColorSecondary: '#4F1AA1' },
      { airlineId: 'JL', airlineName: 'Japan Airlines', brandColorPrimary: '#BE0018', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'NH', airlineName: 'All Nippon Airways (ANA)', brandColorPrimary: '#13448F', brandColorSecondary: '#041E42' },
      { airlineId: 'KE', airlineName: 'Korean Air', brandColorPrimary: '#00256C', brandColorSecondary: '#E70012' },
      { airlineId: 'OZ', airlineName: 'Asiana Airlines', brandColorPrimary: '#C81432', brandColorSecondary: '#08326B' },
      
      // Other Major Airlines
      { airlineId: 'QF', airlineName: 'Qantas Airways', brandColorPrimary: '#EE0000', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'NZ', airlineName: 'Air New Zealand', brandColorPrimary: '#00205B', brandColorSecondary: '#FFFFFF' },
      { airlineId: 'LA', airlineName: 'LATAM Airlines', brandColorPrimary: '#00A0DE', brandColorSecondary: '#E5154D' },
      { airlineId: 'ET', airlineName: 'Ethiopian Airlines', brandColorPrimary: '#FFC822', brandColorSecondary: '#008651' },
      { airlineId: 'SA', airlineName: 'South African Airways', brandColorPrimary: '#0A2240', brandColorSecondary: '#FF2E12' }
    ];
    
    // Process airlines in batches to avoid query size limits
    const BATCH_SIZE = 5;
    let updatedCount = 0;
    
    for (let i = 0; i < airlineData.length; i += BATCH_SIZE) {
      const batch = airlineData.slice(i, i + BATCH_SIZE);
      
      for (const airline of batch) {
        try {
          // Update each airline individually for better error tracking
          const result = await pool.query(`
            UPDATE airlines 
            SET airline_name = $1, 
                brand_color_primary = $2, 
                brand_color_secondary = $3,
                needs_manual_color_input = false
            WHERE airline_id = $4
          `, [
            airline.airlineName,
            airline.brandColorPrimary,
            airline.brandColorSecondary, 
            airline.airlineId
          ]);
          
          if (result.rowCount > 0) {
            updatedCount++;
            console.log(`Updated airline: ${airline.airlineId} - ${airline.airlineName}`);
          }
        } catch (err) {
          console.error(`Error updating airline ${airline.airlineId}:`, err.message);
        }
      }
    }
    
    console.log(`Airline data update complete. Updated ${updatedCount} airlines.`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error updating airline data:', error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  updateAirlineData()
    .then(result => {
      if (result.success) {
        console.log('Successfully updated airline data.');
      } else {
        console.error('Failed to update airline data:', result.error);
      }
    })
    .catch(err => {
      console.error('Unhandled error:', err);
    });
}

module.exports = { updateAirlineData };
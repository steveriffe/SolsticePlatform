const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load the workbook
const workbook = XLSX.readFile(path.join('attached_assets', 'demo dave data.xlsx'));

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(sheet);

// Check the data structure and adapt field names for our app
const reformattedData = jsonData.map(row => {
  // Map Excel columns to our CSV format
  return {
    departure_airport_iata: row.DepartureAirport || '',
    arrival_airport_iata: row.ArrivalAirport || '',
    airline_code: row.Airline || '',
    flight_date: formatDate(row.Date),
    flight_number: row.FlightNumber || '',
    aircraft_type: row.Aircraft || '',
    flight_duration_hours: row.Duration || null,
    tags: row.Tags || ''
  };
});

// Format date to YYYY-MM-DD
function formatDate(dateValue) {
  if (!dateValue) return '';
  
  // Handle Excel serial date if needed
  let date;
  if (typeof dateValue === 'number') {
    // Excel dates are stored as days since 1900-01-01
    date = new Date((dateValue - 25569) * 86400 * 1000);
  } else if (typeof dateValue === 'string') {
    // Try to parse the string date
    date = new Date(dateValue);
  } else {
    return '';
  }
  
  if (isNaN(date.getTime())) return '';
  
  return date.toISOString().split('T')[0];
}

// Create CSV header
const header = ['departure_airport_iata', 'arrival_airport_iata', 'airline_code', 'flight_date', 
                'flight_number', 'aircraft_type', 'flight_duration_hours', 'tags'];

// Convert to CSV string
let csvContent = header.join(',') + '\n';
reformattedData.forEach(row => {
  const values = header.map(field => {
    const value = row[field] !== null && row[field] !== undefined ? row[field] : '';
    // Quote values containing commas
    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
  });
  csvContent += values.join(',') + '\n';
});

// Write to file
fs.writeFileSync('flight-data.csv', csvContent);

console.log('CSV file has been created: flight-data.csv');
console.log(`Converted ${reformattedData.length} flight records.`);

// Display a preview of the data
console.log('\nPreview of the first 3 records:');
console.log(header.join(','));
reformattedData.slice(0, 3).forEach(row => {
  const values = header.map(field => row[field] !== null ? row[field] : '');
  console.log(values.join(','));
});
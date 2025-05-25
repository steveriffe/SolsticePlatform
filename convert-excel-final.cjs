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

// Map Excel columns to our CSV format
const reformattedData = jsonData.map(row => {
  return {
    departure_airport_iata: row['Departure Airport Code'] || '',
    arrival_airport_iata: row['Arrival Airport Code'] || '',
    airline_code: row['Airline Code'] || '',
    flight_date: formatDate(row['Departure Date']),
    flight_number: row['Flight Number'] ? String(row['Flight Number']) : '',
    aircraft_type: row['Airplane'] || '',
    flight_duration_hours: calculateDuration(row),
    tags: generateTags(row)
  };
});

// Format date to YYYY-MM-DD
function formatDate(excelDate) {
  if (!excelDate && excelDate !== 0) return '';
  
  // Convert Excel serial date number to JavaScript date
  // Excel stores dates as days since 1900-01-01
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  
  if (isNaN(date.getTime())) return '';
  
  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate some duration data since it's not in the original Excel
function calculateDuration(row) {
  // Simple logic to estimate flight duration based on airports
  // This is just a placeholder - in real data you'd want actual durations
  if (!row['Departure Airport Code'] || !row['Arrival Airport Code']) return '';
  
  // Some common routes with approximate durations
  const routes = {
    'ANCSEA': 3.5, // Anchorage to Seattle
    'SEAANC': 3.7, // Seattle to Anchorage
    'SEAPDX': 0.8, // Seattle to Portland
    'PDXSEA': 0.8, // Portland to Seattle
    'SEAORD': 4.2, // Seattle to Chicago
    'ORDSEA': 4.5, // Chicago to Seattle
    'SEAATL': 5.0, // Seattle to Atlanta
    'ATLSEA': 5.3, // Atlanta to Seattle
    'SEAFRA': 10.5, // Seattle to Frankfurt
    'FRASEA': 11.0, // Frankfurt to Seattle
    'SEABHX': 9.5,  // Seattle to Dubai
    'BHXSEA': 10.0  // Dubai to Seattle
  };
  
  const route = `${row['Departure Airport Code']}${row['Arrival Airport Code']}`;
  return routes[route] || (Math.random() * 5 + 1).toFixed(1); // Random 1-6 hour flight if no match
}

// Generate some sample tags based on aircraft and airline
function generateTags(row) {
  const tags = [];
  
  // Add airline as a tag
  if (row['Airline']) {
    tags.push(row['Airline'].replace(/\s+/g, '-').toLowerCase());
  }
  
  // Add aircraft family as a tag
  if (row['Airplane']) {
    const aircraft = row['Airplane'].toLowerCase();
    if (aircraft.includes('boeing')) tags.push('boeing');
    if (aircraft.includes('airbus')) tags.push('airbus');
    if (aircraft.includes('embraer')) tags.push('embraer');
    if (aircraft.includes('787')) tags.push('dreamliner');
    if (aircraft.includes('737')) tags.push('737');
    if (aircraft.includes('a320')) tags.push('a320');
    if (aircraft.includes('a350')) tags.push('a350');
  }
  
  return tags.join(';');
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
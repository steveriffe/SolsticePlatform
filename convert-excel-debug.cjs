const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load the workbook
const workbook = XLSX.readFile(path.join('attached_assets', 'demo dave data.xlsx'));

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Log the first few rows to see column structure
console.log("Excel structure - first 2 rows:");
console.log(JSON.stringify(jsonData.slice(0, 2), null, 2));

// Another approach using the raw headers
const rawData = XLSX.utils.sheet_to_json(sheet);
console.log("\nRaw data structure - first record:");
console.log(JSON.stringify(rawData[0], null, 2));

// This will help us understand the exact column names in the Excel file
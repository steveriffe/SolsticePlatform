/**
 * Spreadsheet processor utility (handles both Excel and CSV)
 * Integrates with Gemini AI for intelligent field mapping
 */

import * as XLSX from 'xlsx';
import { db } from '../db';
import { flights, insertFlightSchema, flightTags } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { processCSVUpload } from './csv';
import { processSpreadsheetData } from './geminiProcessor';
import { calculateDistance } from './haversine';
import { calculateCarbonFootprint } from './carbonCalculator';

/**
 * Process an uploaded file buffer (Excel or CSV)
 * 
 * @param fileBuffer The file buffer from multer
 * @param fileName Original filename for determining type
 * @param userId User ID for associating flights
 * @returns Result of import operation
 */
export async function processSpreadsheetUpload(
  fileBuffer: Buffer,
  fileName: string,
  userId: string
) {
  try {
    console.log(`Processing ${fileName} for user ${userId}`);
    
    // Determine file type
    const isCSV = fileName.toLowerCase().endsWith('.csv');
    const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
    }
    
    let parsedData: any[] = [];
    
    // Parse the file based on type
    if (isCSV) {
      // For CSV, convert Buffer to string and use existing CSV processor
      const csvString = fileBuffer.toString('utf-8');
      
      // Handle CSV files using our new approach
      const csvRows = csvString.split(/\r?\n/).filter(row => row.trim().length > 0);
      
      if (csvRows.length < 2) {
        throw new Error('The CSV file must contain at least a header row and one data row.');
      }
      
      // Parse CSV to array of objects
      const headers = csvRows[0].split(',').map(h => h.trim());
      parsedData = csvRows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim());
        const rowData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        
        return rowData;
      });
    } else {
      // For Excel, use xlsx library
      const workbook = XLSX.read(fileBuffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert sheet to array of objects
      parsedData = XLSX.utils.sheet_to_json(sheet);
    }
    
    if (parsedData.length === 0) {
      throw new Error('No data found in the uploaded file.');
    }
    
    console.log(`Parsed ${parsedData.length} rows from the ${isCSV ? 'CSV' : 'Excel'} file`);
    
    // Process the data with Gemini AI to map columns
    const processedData = await processSpreadsheetData(parsedData);
    console.log(`Processed ${processedData.length} rows with AI field mapping`);
    
    // Save processed data to database
    const result = await saveFlightsToDatabase(processedData, userId);
    return result;
  } catch (error) {
    console.error('Error processing spreadsheet:', error);
    throw error;
  }
}

/**
 * Save processed flight data to database
 * 
 * @param flightData Processed and mapped flight data
 * @param userId User ID to associate with flights
 * @returns Result of database operation
 */
async function saveFlightsToDatabase(
  flightData: any[],
  userId: string
) {
  const results = {
    count: 0,
    errors: [] as string[]
  };
  
  // Fetch airports to validate IATA codes
  const airports = await db.query.airports.findMany();
  const airportMap = new Map(airports.map(a => [a.iataCode, a]));
  
  // Fetch airlines to validate airline codes
  const airlines = await db.query.airlines.findMany();
  const airlineMap = new Map(airlines.map(a => [a.airlineId, a]));
  
  // Prepare validated flights for insertion
  const validatedFlights = [];
  
  for (let index = 0; index < flightData.length; index++) {
    const flight = flightData[index];
    try {
      // Check for required fields
      if (!flight.departure_airport_iata || !flight.arrival_airport_iata || !flight.airline_code || !flight.flight_date) {
        results.errors.push(`Row ${index + 1}: Missing required fields. Make sure departure airport, arrival airport, airline code, and flight date are provided.`);
        continue;
      }
      
      // Validate airports exist in database
      const depAirport = airportMap.get(flight.departure_airport_iata.toUpperCase());
      const arrAirport = airportMap.get(flight.arrival_airport_iata.toUpperCase());
      
      if (!depAirport) {
        results.errors.push(`Row ${index + 1}: Departure airport "${flight.departure_airport_iata}" not found in database.`);
        continue;
      }
      
      if (!arrAirport) {
        results.errors.push(`Row ${index + 1}: Arrival airport "${flight.arrival_airport_iata}" not found in database.`);
        continue;
      }
      
      // Validate airline exists in database
      const airline = airlineMap.get(flight.airline_code.toUpperCase());
      if (!airline) {
        results.errors.push(`Row ${index + 1}: Airline "${flight.airline_code}" not found in database.`);
        continue;
      }
      
      // Calculate distance
      const distance = calculateDistance(
        Number(depAirport.latitude), 
        Number(depAirport.longitude), 
        Number(arrAirport.latitude), 
        Number(arrAirport.longitude)
      );
      
      // Calculate duration if not provided
      let durationHours = flight.flight_duration_hours;
      if (!durationHours) {
        // Rough estimate: 500 miles per hour average speed
        durationHours = distance / 500;
      }
      
      // Calculate carbon footprint
      const carbonFootprint = calculateCarbonFootprint(
        distance,
        flight.aircraft_type
      );
      
      // Prepare validated flight data for insertion
      // Store the tags separately for later use
      const tags = flight.tags || [];
      
      // Create flight object according to the schema (without tags as they're stored separately)
      const validatedFlight = {
        userId,
        departureAirportIata: flight.departure_airport_iata.toUpperCase(),
        arrivalAirportIata: flight.arrival_airport_iata.toUpperCase(),
        airlineCode: flight.airline_code.toUpperCase(),
        flightNumber: flight.flight_number || null,
        flightDate: flight.flight_date,
        flightDurationHours: durationHours,
        distanceMiles: Math.round(distance),
        aircraftType: flight.aircraft_type || null,
        carbonFootprintKg: String(Math.round(carbonFootprint)),
        carbonOffset: false,
        createdAt: new Date()
      };
      
      // Validate with Zod schema
      const validationResult = insertFlightSchema.safeParse(validatedFlight);
      if (!validationResult.success) {
        results.errors.push(`Row ${index + 1}: Validation failed: ${validationResult.error.message}`);
        continue;
      }
      
      // Add the flight with its tags to our validated flights array
      validatedFlights.push({ ...validatedFlight, tags });
    } catch (error) {
      console.error(`Error processing row ${index + 1}:`, error);
      results.errors.push(`Row ${index + 1}: Failed to process due to an error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Insert valid flights into database
  if (validatedFlights.length > 0) {
    try {
      // Create a clean array of flights without the tags property for insertion
      const flightsToInsert = validatedFlights.map(({ tags, ...flight }) => flight);
      
      // Insert flights into database
      const insertedFlights = await db.insert(flights).values(flightsToInsert).returning();
      results.count = insertedFlights.length;
      
      // Insert tags for each flight
      for (const flight of insertedFlights) {
        // Get the tags from our original validated flight data since they're not returned from the DB
        const originalFlightData = validatedFlights.find(f => 
          f.departureAirportIata === flight.departureAirportIata &&
          f.arrivalAirportIata === flight.arrivalAirportIata &&
          f.flightDate === flight.flightDate
        );
        
        // Type assertion to access the tags property
        const flightWithTags = originalFlightData as (typeof originalFlightData & { tags: string[] });
        const tags = flightWithTags?.tags || [];
        
        if (tags.length > 0) {
          await Promise.all(tags.map((tagName: string) => 
            db.insert(flightTags).values({
              flightId: flight.flightId,
              tagName: tagName
            }).onConflictDoNothing()
          ));
        }
      }
    } catch (error) {
      console.error('Database insertion error:', error);
      throw new Error('Failed to save flight data to database.');
    }
  }
  
  return results;
}
import { parseISO, isValid } from "date-fns";
import { z } from "zod";
import { csvFlightSchema } from "@shared/schema";
import { calculateDistance } from "./haversine";
import { calculateCarbonFootprint } from "./carbonCalculator";
import { 
  airports, 
  airlines, 
  flights, 
  flightTags
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Common header variations for easier mapping
const HEADER_MAPPINGS: Record<string, string[]> = {
  'departure_airport_iata': [
    'departure_airport_iata', 'departure_airport', 'origin', 'origin_airport', 
    'from', 'from_airport', 'depart', 'departure', 'dep_iata', 'origin_iata'
  ],
  'arrival_airport_iata': [
    'arrival_airport_iata', 'arrival_airport', 'destination', 'destination_airport', 
    'to', 'to_airport', 'arrive', 'arrival', 'arr_iata', 'destination_iata'
  ],
  'airline_code': [
    'airline_code', 'airline', 'carrier', 'airline_iata', 'operator', 
    'marketing_airline', 'airline_id', 'carrier_code'
  ],
  'flight_date': [
    'flight_date', 'date', 'departure_date', 'dep_date', 'travel_date', 
    'date_of_flight', 'flight_day'
  ],
  'flight_duration_hours': [
    'flight_duration_hours', 'duration', 'flight_time', 'duration_hours', 
    'time', 'hours', 'flight_hours', 'flight_duration'
  ],
  'flight_number': [
    'flight_number', 'flight_no', 'flight', 'flight_num', 'flightno', 'flight#', 
    'flight_id', 'number'
  ],
  'aircraft_type': [
    'aircraft_type', 'aircraft', 'plane', 'equipment', 'aircraft_model', 
    'plane_type', 'equipment_type'
  ],
  'tags': [
    'tags', 'category', 'categories', 'trip_type', 'trip_purpose', 
    'purpose', 'labels', 'tag'
  ]
};

/**
 * Find best matching standard header from our known mappings
 * 
 * @param header The header from the uploaded CSV file
 * @returns The standard header name or null if no match
 */
function mapHeaderToStandard(header: string): string | null {
  const normalizedHeader = header.trim().toLowerCase();
  
  for (const [standardHeader, variations] of Object.entries(HEADER_MAPPINGS)) {
    if (variations.includes(normalizedHeader)) {
      return standardHeader;
    }
  }
  
  return null;
}

/**
 * Process a CSV file for flight data import
 * 
 * @param csvString The content of the CSV file as a string
 * @param userId The user ID to associate the flights with
 * @param db Database instance
 * @returns Result of the import operation
 */
export async function processCSVUpload(
  csvString: string, 
  userId: string,
  db: any
): Promise<{ importedCount: number; errors: string[] }> {
  // Parse CSV
  const lines = csvString.split('\n');
  
  // Remove BOM if present at the beginning of the file
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  lines[0] = firstLine;
  
  // Map uploaded headers to our standard headers
  const uploadedHeaders = firstLine.split(',').map(h => h.trim());
  const headerMap: Record<string, number> = {};
  const unmappedHeaders: string[] = [];
  
  // Map required headers
  const requiredStandardHeaders = [
    'departure_airport_iata',
    'arrival_airport_iata',
    'airline_code',
    'flight_date'
  ];
  
  // Try to map each uploaded header to our standard format
  uploadedHeaders.forEach((header, index) => {
    const standardHeader = mapHeaderToStandard(header);
    if (standardHeader) {
      headerMap[standardHeader] = index;
    } else {
      unmappedHeaders.push(header);
    }
  });
  
  // Check if all required headers are mapped
  const missingRequiredHeaders = requiredStandardHeaders.filter(h => !(h in headerMap));
  
  if (missingRequiredHeaders.length > 0) {
    throw new Error(`Could not map required headers: ${missingRequiredHeaders.join(', ')}. 
      Available headers: ${uploadedHeaders.join(', ')}`);
  }
  
  // Process data rows
  const dataRows = lines.slice(1).filter(line => line.trim());
  const errors: string[] = [];
  let importedCount = 0;
  
  // Get all the standard headers we care about
  const allStandardHeaders = Object.keys(HEADER_MAPPINGS);
  
  for (let i = 0; i < dataRows.length; i++) {
    try {
      const rowNumber = i + 2; // +2 for 1-indexing and header row
      const row = dataRows[i].trim();
      const columns = parseCSVRow(row);
      
      // Skip empty rows
      if (columns.length === 0 || (columns.length === 1 && columns[0] === '')) {
        continue;
      }
      
      // Create flight data object using our header mapping
      const flightData: Record<string, any> = {};
      
      // Add all mapped fields to the flight data
      for (const standardHeader of allStandardHeaders) {
        if (standardHeader in headerMap) {
          const columnIndex = headerMap[standardHeader];
          
          if (columnIndex >= 0 && columnIndex < columns.length) {
            const value = columns[columnIndex].trim();
            
            // Special handling for numeric fields
            if (standardHeader === 'flight_duration_hours' && value) {
              flightData[standardHeader] = parseFloat(value);
            } else {
              flightData[standardHeader] = value;
            }
          }
        }
      }
      
      // Validate the flight data
      const validationResult = csvFlightSchema.safeParse(flightData);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => `${err.path}: ${err.message}`);
        throw new Error(`Row ${rowNumber}: ${errors.join(', ')}`);
      }
      
      const validatedData = validationResult.data;
      
      // Check if airports exist
      const departureAirport = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, validatedData.departure_airport_iata))
        .limit(1);
        
      const arrivalAirport = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, validatedData.arrival_airport_iata))
        .limit(1);
        
      if (departureAirport.length === 0) {
        throw new Error(`Row ${rowNumber}: Departure airport ${validatedData.departure_airport_iata} not found`);
      }
      
      if (arrivalAirport.length === 0) {
        throw new Error(`Row ${rowNumber}: Arrival airport ${validatedData.arrival_airport_iata} not found`);
      }
      
      // Check and insert airline if needed
      if (validatedData.airline_code) {
        const existingAirline = await db
          .select()
          .from(airlines)
          .where(eq(airlines.airlineId, validatedData.airline_code))
          .limit(1);
          
        if (existingAirline.length === 0) {
          // Insert new airline
          await db.insert(airlines).values({
            airlineId: validatedData.airline_code,
            airlineName: validatedData.airline_code, // Use code as name initially
            needsManualColorInput: true
          });
        }
      }
      
      // Calculate distance
      const distance = calculateDistance(
        Number(departureAirport[0].latitude),
        Number(departureAirport[0].longitude),
        Number(arrivalAirport[0].latitude),
        Number(arrivalAirport[0].longitude)
      );
      
      // Parse date
      const parsedDate = parseISO(validatedData.flight_date);
      if (!isValid(parsedDate)) {
        throw new Error(`Row ${rowNumber}: Invalid date format. Use YYYY-MM-DD`);
      }
      
      // Calculate carbon footprint
      const carbonFootprint = calculateCarbonFootprint(distance, validatedData.aircraft_type);
      
      // Insert flight
      const [insertedFlight] = await db.insert(flights).values({
        userId,
        departureAirportIata: validatedData.departure_airport_iata,
        arrivalAirportIata: validatedData.arrival_airport_iata,
        airlineCode: validatedData.airline_code,
        flightDate: parsedDate,
        flightNumber: validatedData.flight_number,
        aircraftType: validatedData.aircraft_type,
        flightDurationHours: validatedData.flight_duration_hours,
        distanceMiles: distance,
        carbonFootprintKg: carbonFootprint,
        carbonOffset: false
      }).returning();
      
      // Process tags if present
      if (validatedData.tags) {
        const tagsList = validatedData.tags.split(';').map(tag => tag.trim()).filter(Boolean);
        
        for (const tagName of tagsList) {
          await db.insert(flightTags).values({
            flightId: insertedFlight.flightId,
            tagName
          });
        }
      }
      
      importedCount++;
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      } else {
        errors.push(`Row ${i + 2}: Unknown error`);
      }
    }
  }
  
  return { importedCount, errors };
}

/**
 * Parses a CSV row, handling quotes properly
 * 
 * @param row The CSV row string
 * @returns Array of values
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
        // Handle escaped quotes (two double quotes in a row)
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      // Add character to current field
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}
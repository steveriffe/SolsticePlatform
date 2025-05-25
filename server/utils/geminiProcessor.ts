/**
 * Google Gemini AI integration for processing spreadsheet data
 * This utility identifies flight data fields from various spreadsheet formats
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

/**
 * Initialize the Google Generative AI client
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables");
  }
  
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Process header row with Gemini to identify and map columns to our standard fields
 * 
 * @param headers Array of column headers from uploaded file
 * @param previewData Array of preview data rows (first few rows for context)
 * @returns Mapping of standard field names to column indices
 */
export async function identifyFieldsWithGemini(
  headers: string[],
  previewData: string[][]
): Promise<Record<string, number>> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = generatePrompt(headers, previewData);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini response:", text);
    
    return parseGeminiResponse(text, headers);
  } catch (error) {
    console.error("Error processing with Gemini:", error);
    throw new Error("Failed to analyze spreadsheet format with AI. Please check your data format or try using the template.");
  }
}

/**
 * Generate a prompt for Gemini to identify fields in uploaded data
 */
function generatePrompt(headers: string[], previewData: string[][]): string {
  // Create a preview of the data to give Gemini context
  const previewRows = previewData.map(row => {
    return headers.map((header, i) => `${header}: ${row[i] || 'N/A'}`).join(', ');
  }).join('\n');
  
  return `
You are an AI tasked with identifying flight data columns in various spreadsheet formats.

I need to map the following column headers to standardized flight data fields:
${headers.join(', ')}

Here are a few sample rows to help you understand the data format:
${previewRows}

I need you to identify which columns correspond to these standard fields:
1. departure_airport_iata (required) - 3-letter IATA code of departure airport, e.g., LAX, JFK
2. arrival_airport_iata (required) - 3-letter IATA code of arrival airport, e.g., SFO, LHR
3. airline_code (required) - 2-letter airline code, e.g., AA, UA, DL
4. flight_date (required) - date of flight in YYYY-MM-DD format
5. flight_number (optional) - flight number, e.g., 123, UA456
6. aircraft_type (optional) - aircraft type, e.g., B738, A320
7. flight_duration_hours (optional) - duration in decimal hours, e.g., 3.5
8. tags (optional) - tags or categories for the flight, e.g., vacation, business

Respond with a JSON mapping of standard field names to their corresponding column index (0-based):
{
  "departure_airport_iata": 2,
  "arrival_airport_iata": 3,
  ...
}

If you can't confidently identify a required field, don't include it in the output. 
For optional fields, only include them if you're confident of the mapping.
`;
}

/**
 * Parse Gemini's response to extract field mappings
 */
function parseGeminiResponse(
  response: string,
  headers: string[]
): Record<string, number> {
  try {
    // Extract JSON from response (Gemini might include explanatory text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response");
    }
    
    const jsonStr = jsonMatch[0];
    const mapping = JSON.parse(jsonStr);
    
    // Validate the mapping
    const requiredFields = ['departure_airport_iata', 'arrival_airport_iata', 'airline_code', 'flight_date'];
    const missingRequired = requiredFields.filter(field => !(field in mapping));
    
    if (missingRequired.length > 0) {
      throw new Error(`Could not identify these required fields: ${missingRequired.join(', ')}`);
    }
    
    // Ensure all indices are within bounds
    for (const [field, index] of Object.entries(mapping)) {
      if (typeof index !== 'number' || index < 0 || index >= headers.length) {
        throw new Error(`Invalid column index ${index} for field ${field}`);
      }
    }
    
    return mapping;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    
    if (error instanceof SyntaxError) {
      throw new Error("Could not parse AI response. Please try again or use the template format.");
    }
    
    throw error;
  }
}

/**
 * Process spreadsheet data (XLSX or CSV) using Gemini
 * 
 * @param data Parsed data from spreadsheet (array of objects)
 * @returns Processed data mapped to our standard format
 */
export async function processSpreadsheetData(data: any[]): Promise<any[]> {
  if (!data || data.length === 0) {
    throw new Error("No data found in the spreadsheet");
  }
  
  // Extract headers and sample data for Gemini
  const headers = Object.keys(data[0]);
  const previewRows = data.slice(0, Math.min(3, data.length)).map(row => 
    headers.map(header => row[header] !== undefined ? String(row[header]) : '')
  );
  
  // Use Gemini to identify fields
  const fieldMapping = await identifyFieldsWithGemini(headers, previewRows);
  console.log("Field mapping identified:", fieldMapping);
  
  // Map the data to our standard format
  return data.map((row, rowIndex) => {
    const processedRow: Record<string, any> = {};
    
    for (const [standardField, headerIndex] of Object.entries(fieldMapping)) {
      const headerName = headers[headerIndex];
      let value = row[headerName];
      
      // Process specific field types
      if (standardField === 'flight_date' && value) {
        // Attempt to standardize date format
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString().split('T')[0]; // YYYY-MM-DD
          }
        } catch (e) {
          console.warn(`Row ${rowIndex + 1}: Could not parse date "${value}"`);
        }
      } else if (standardField === 'flight_duration_hours' && value) {
        // Ensure duration is a number
        const duration = parseFloat(value);
        if (!isNaN(duration)) {
          value = duration;
        }
      } else if (standardField === 'tags' && value) {
        // Convert to array if not already
        if (typeof value === 'string') {
          value = value.split(/[;,]/).map((tag: string) => tag.trim()).filter(Boolean);
        }
      }
      
      processedRow[standardField] = value;
    }
    
    return processedRow;
  });
}
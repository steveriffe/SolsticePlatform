import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerPrintifyRoutes } from "./printifyRoutes";
import multer from "multer";
import { processCSVUpload } from "./utils/csv";
import { processSpreadsheetUpload } from "./utils/spreadsheetProcessor";
import { calculateDistance } from "./utils/haversine";
import { calculateCarbonFootprint } from "./utils/carbonCalculator";
import { db, pool } from "./db";
import { eq, and, gte, lte, or, inArray, desc, asc, isNull, not, SQL, sql } from "drizzle-orm";
import { 
  users, 
  airlines, 
  airports, 
  flights, 
  flightTags,
  type InsertFlight,
  type Flight
} from "@shared/schema";
import { parse, format, addMonths } from "date-fns";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// Printify API utility functions
async function printifyRequest(endpoint: string, method = 'GET', body?: any) {
  const apiToken = process.env.PRINTIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error('Printify API token not found');
  }

  const url = `https://api.printify.com/v1${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Printify API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Printify API request failed:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Register Printify routes
  registerPrintifyRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // KPIs
  app.get('/api/kpis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get current date for calculating this month and this year
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Get all unique airlines for this user
      const airlineQuery = await db
        .select({ airlineCode: flights.airlineCode })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          sql`${flights.airlineCode} IS NOT NULL`
        ))
        .groupBy(flights.airlineCode);
      
      const totalAirlines = airlineQuery.length;

      // New airlines this year
      const newAirlinesThisYear = await db
        .select({ airlineCode: flights.airlineCode })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          sql`${flights.airlineCode} IS NOT NULL`,
          sql`${flights.flightDate} >= ${startOfYear.toISOString()}`
        ))
        .groupBy(flights.airlineCode);

      // Total miles
      const milesQuery = await db
        .select({ totalMiles: sql`SUM(${flights.distanceMiles})`.as('totalMiles') })
        .from(flights)
        .where(eq(flights.userId, userId));
      const totalMiles = milesQuery[0]?.totalMiles || 0;

      // Miles this month
      const milesThisMonthQuery = await db
        .select({ totalMiles: sql`SUM(${flights.distanceMiles})`.as('totalMiles') })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          sql`${flights.flightDate} >= ${startOfMonth.toISOString()}`
        ));
      const milesThisMonth = milesThisMonthQuery[0]?.totalMiles || 0;

      // Total hours
      const hoursQuery = await db
        .select({ totalHours: sql`SUM(${flights.flightDurationHours})`.as('totalHours') })
        .from(flights)
        .where(eq(flights.userId, userId));
      const totalHours = hoursQuery[0]?.totalHours || 0;

      // Hours this month
      const hoursThisMonthQuery = await db
        .select({ totalHours: sql`SUM(${flights.flightDurationHours})`.as('totalHours') })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          sql`${flights.flightDate} >= ${startOfMonth.toISOString()}`
        ));
      const hoursThisMonth = hoursThisMonthQuery[0]?.totalHours || 0;
      
      // Get carbon footprint information
      const totalCarbonResult = await db
        .select({ 
          totalCarbonKg: sql`COALESCE(SUM(${flights.carbonFootprintKg}), 0)`.as('totalCarbonKg')
        })
        .from(flights)
        .where(eq(flights.userId, userId));
      
      const offsetCarbonResult = await db
        .select({ 
          offsetCarbonKg: sql`COALESCE(SUM(${flights.carbonFootprintKg}), 0)`.as('offsetCarbonKg')
        })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          eq(flights.carbonOffset, true)
        ));
      
      // Calculate carbon stats
      const totalCarbonKg = Number(totalCarbonResult[0]?.totalCarbonKg || 0);
      const offsetCarbonKg = Number(offsetCarbonResult[0]?.offsetCarbonKg || 0);
      const unOffsetCarbonKg = totalCarbonKg - offsetCarbonKg;
      const offsetPercentage = totalCarbonKg > 0 ? Math.round((offsetCarbonKg / totalCarbonKg) * 100) : 0;
      
      // Get trip cost information
      const totalTripCostResult = await db
        .select({ 
          totalCost: sql`COALESCE(SUM(${flights.tripCost}), 0)`.as('totalCost')
        })
        .from(flights)
        .where(eq(flights.userId, userId));
      
      const tripCostThisMonthResult = await db
        .select({ 
          totalCost: sql`COALESCE(SUM(${flights.tripCost}), 0)`.as('totalCost')
        })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          sql`${flights.flightDate} >= ${startOfMonth.toISOString()}`
        ));
      
      // Calculate cost stats
      const totalTripCost = Number(totalTripCostResult[0]?.totalCost || 0);
      const tripCostThisMonth = Number(tripCostThisMonthResult[0]?.totalCost || 0);
      
      // Determine primary currency (use most common currency or default to USD)
      const primaryCurrencyResult = await db
        .select({
          currency: flights.tripCostCurrency,
          count: sql`COUNT(*)`.as('count')
        })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          sql`${flights.tripCostCurrency} IS NOT NULL`,
          sql`${flights.tripCost} > 0`
        ))
        .groupBy(flights.tripCostCurrency)
        .orderBy(sql`count DESC`)
        .limit(1);
      
      const primaryCurrency = primaryCurrencyResult.length > 0 ? primaryCurrencyResult[0].currency : 'USD';

      res.json({
        totalAirlines,
        newAirlinesThisYear: newAirlinesThisYear.length,
        totalMiles: Number(totalMiles),
        milesThisMonth: Number(milesThisMonth),
        totalHours: Number(totalHours),
        hoursThisMonth: Number(hoursThisMonth),
        totalCarbonKg,
        offsetCarbonKg,
        unOffsetCarbonKg,
        offsetPercentage,
        totalTripCost,
        tripCostThisMonth,
        primaryCurrency
      });
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  // Carbon statistics endpoint
  app.get('/api/flights/carbon-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get total carbon footprint
      const totalCarbonResult = await db
        .select({ 
          totalCarbonKg: sql`COALESCE(SUM(${flights.carbonFootprintKg}), 0)`.as('totalCarbonKg')
        })
        .from(flights)
        .where(eq(flights.userId, userId));
      
      // Get offset carbon footprint
      const offsetCarbonResult = await db
        .select({ 
          offsetCarbonKg: sql`COALESCE(SUM(${flights.carbonFootprintKg}), 0)`.as('offsetCarbonKg')
        })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          eq(flights.carbonOffset, true)
        ));
      
      // Calculate unoffset carbon
      const totalCarbonKg = Number(totalCarbonResult[0]?.totalCarbonKg || 0);
      const offsetCarbonKg = Number(offsetCarbonResult[0]?.offsetCarbonKg || 0);
      const unOffsetCarbonKg = totalCarbonKg - offsetCarbonKg;
      
      // Estimate offset cost
      const averageCostPerTonne = 15; // USD per tonne of CO2
      const estimatedOffsetCost = (unOffsetCarbonKg / 1000) * averageCostPerTonne;
      
      res.json({
        totalCarbonKg,
        offsetCarbonKg,
        unOffsetCarbonKg,
        estimatedOffsetCost: Math.max(estimatedOffsetCost, 0.5) // Minimum $0.50
      });
    } catch (error) {
      console.error("Error retrieving carbon stats:", error);
      res.status(500).json({ message: "Failed to retrieve carbon statistics" });
    }
  });

  // Flights routes
  app.get('/api/flights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get query parameters for filtering
      const { 
        airport, 
        airline, 
        aircraft, // Add aircraft filter
        dateFrom, 
        dateTo, 
        tag, 
        search,
        sort,
        order
      } = req.query;

      try {
        // Start with basic filtering
        let baseQuery = db
          .select()
          .from(flights);
          
        // Build an array of conditions
        const conditions = [eq(flights.userId, userId)];
          
        if (airport) {
          conditions.push(
            or(
              eq(flights.departureAirportIata, airport as string),
              eq(flights.arrivalAirportIata, airport as string)
            )
          );
        }
          
        if (airline) {
          conditions.push(eq(flights.airlineCode, airline as string));
        }
        
        if (aircraft) {
          conditions.push(eq(flights.aircraftType, aircraft as string));
        }
          
        if (dateFrom) {
          conditions.push(sql`${flights.flightDate} >= ${dateFrom}`);
        }
          
        if (dateTo) {
          conditions.push(sql`${flights.flightDate} <= ${dateTo}`);
        }
        
        // Apply all conditions with AND
        const flightResults = await baseQuery
          .where(and(...conditions))
          .orderBy(desc(flights.flightDate));
          
        // Convert the result to a typed array
        const typedFlightResults = flightResults as unknown as Flight[];
      
        // If tag filter is applied, filter in-memory since we need to join with tags
        let filteredResults = typedFlightResults;
      
        if (tag) {
          // Get all flights with the specific tag
          const flightIds = await db
            .select({ flightId: flightTags.flightId })
            .from(flightTags)
            .where(eq(flightTags.tagName, tag as string));
          
          // Filter flights by the IDs that have the tag
          const flightIdSet = new Set(flightIds.map(f => f.flightId));
          filteredResults = typedFlightResults.filter(flight => flightIdSet.has(flight.flightId));
        }

        // Get tags for each flight if we have any results
        const flightIds = filteredResults.length > 0 
          ? filteredResults.map(flight => flight.flightId) 
          : [];
        
        const tagsQuery = await db
          .select()
          .from(flightTags)
          .where(inArray(flightTags.flightId, flightIds));

        // Group tags by flight ID
        const tagsByFlight: Record<number, string[]> = {};
        tagsQuery.forEach(tag => {
          if (!tagsByFlight[tag.flightId]) {
            tagsByFlight[tag.flightId] = [];
          }
          tagsByFlight[tag.flightId].push(tag.tagName);
        });

        // Add tags to flight objects
        const flightsWithTags = filteredResults.map(flight => ({
          ...flight,
          tags: tagsByFlight[flight.flightId] || []
        }));

        res.json(flightsWithTags);
      } catch (error) {
        console.error("Error fetching flights:", error);
        res.status(500).json({ message: "Failed to fetch flights" });
      }
    } catch (outer_error) {
      console.error("Outer error in flights route:", outer_error);
      res.status(500).json({ message: "Failed to process flight request" });
    }
  });

  app.post('/api/flights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flightData = req.body;
      
      // Validate departure and arrival airports exist
      const departureAirport = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, flightData.departureAirportIata))
        .limit(1);
        
      const arrivalAirport = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, flightData.arrivalAirportIata))
        .limit(1);
        
      if (departureAirport.length === 0) {
        return res.status(400).json({ message: `Departure airport ${flightData.departureAirportIata} not found` });
      }
      
      if (arrivalAirport.length === 0) {
        return res.status(400).json({ message: `Arrival airport ${flightData.arrivalAirportIata} not found` });
      }
      
      // Calculate distance between airports
      let distance = null;
      if (departureAirport[0].latitude && departureAirport[0].longitude && 
          arrivalAirport[0].latitude && arrivalAirport[0].longitude) {
        distance = calculateDistance(
          Number(departureAirport[0].latitude),
          Number(departureAirport[0].longitude),
          Number(arrivalAirport[0].latitude),
          Number(arrivalAirport[0].longitude)
        );
      }
      
      // Handle airline lookup/creation if provided
      if (flightData.airlineCode) {
        const existingAirline = await db
          .select()
          .from(airlines)
          .where(eq(airlines.airlineId, flightData.airlineCode))
          .limit(1);
          
        if (existingAirline.length === 0) {
          // Create new airline entry
          await db.insert(airlines).values({
            airlineId: flightData.airlineCode,
            airlineName: flightData.airlineCode, // Use code as name until updated
            needsManualColorInput: true
          });
        }
      }
      
      // Prepare flight data for insertion
      // Calculate carbon footprint - make sure distance is not null
      const carbonFootprint = calculateCarbonFootprint(distance || 0, flightData.aircraftType || undefined);
      
      const insertData: InsertFlight = {
        userId,
        departureAirportIata: flightData.departureAirportIata,
        arrivalAirportIata: flightData.arrivalAirportIata,
        airlineCode: flightData.airlineCode || null,
        flightDate: flightData.flightDate, // Use the string date directly
        flightNumber: flightData.flightNumber || null,
        aircraftType: flightData.aircraftType || null,
        flightDurationHours: flightData.flightDurationHours || null,
        distanceMiles: distance,
        carbonFootprintKg: carbonFootprint,
        carbonOffset: false,
        journalEntry: flightData.journalEntry || null
      };
      
      // Insert flight
      const [insertedFlight] = await db.insert(flights).values(insertData).returning();
      
      // Process tags if provided
      if (flightData.tags) {
        const tags = flightData.tags.split(';').map((tag: string) => tag.trim()).filter(Boolean);
        
        for (const tagName of tags) {
          await db.insert(flightTags).values({
            flightId: insertedFlight.flightId,
            tagName
          });
        }
      }
      
      res.status(201).json(insertedFlight);
    } catch (error) {
      console.error("Error creating flight:", error);
      res.status(500).json({ message: "Failed to create flight" });
    }
  });
  
  // Endpoint for updating just the journal entry of a flight
  app.patch('/api/flights/:id/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flightId = parseInt(req.params.id);
      const { journalEntry } = req.body;
      
      // Check if flight exists and belongs to user
      const existingFlight = await db
        .select()
        .from(flights)
        .where(and(
          eq(flights.flightId, flightId),
          eq(flights.userId, userId)
        ))
        .limit(1);
        
      if (existingFlight.length === 0) {
        return res.status(404).json({ message: "Flight not found" });
      }
      
      // Update only the journal entry
      const [updatedFlight] = await db
        .update(flights)
        .set({ journalEntry })
        .where(and(
          eq(flights.flightId, flightId),
          eq(flights.userId, userId)
        ))
        .returning();
      
      res.json(updatedFlight);
    } catch (error) {
      console.error("Error updating flight journal:", error);
      res.status(500).json({ message: "Failed to update flight journal" });
    }
  });

  app.put('/api/flights/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flightId = parseInt(req.params.id);
      const flightData = req.body;
      
      // Check if flight exists and belongs to user
      const existingFlight = await db
        .select()
        .from(flights)
        .where(and(
          eq(flights.flightId, flightId),
          eq(flights.userId, userId)
        ))
        .limit(1);
        
      if (existingFlight.length === 0) {
        return res.status(404).json({ message: "Flight not found" });
      }
      
      // Validate airports if changing
      let distance = existingFlight[0].distanceMiles;
      
      if (flightData.departureAirportIata !== existingFlight[0].departureAirportIata ||
          flightData.arrivalAirportIata !== existingFlight[0].arrivalAirportIata) {
        
        const departureAirport = await db
          .select()
          .from(airports)
          .where(eq(airports.iataCode, flightData.departureAirportIata))
          .limit(1);
          
        const arrivalAirport = await db
          .select()
          .from(airports)
          .where(eq(airports.iataCode, flightData.arrivalAirportIata))
          .limit(1);
          
        if (departureAirport.length === 0) {
          return res.status(400).json({ message: `Departure airport ${flightData.departureAirportIata} not found` });
        }
        
        if (arrivalAirport.length === 0) {
          return res.status(400).json({ message: `Arrival airport ${flightData.arrivalAirportIata} not found` });
        }
        
        // Calculate new distance
        distance = calculateDistance(
          Number(departureAirport[0].latitude),
          Number(departureAirport[0].longitude),
          Number(arrivalAirport[0].latitude),
          Number(arrivalAirport[0].longitude)
        );
      }
      
      // Update flight data
      const updateData = {
        departureAirportIata: flightData.departureAirportIata,
        arrivalAirportIata: flightData.arrivalAirportIata,
        airlineCode: flightData.airlineCode || null,
        flightDate: flightData.flightDate, // Use string format directly
        flightNumber: flightData.flightNumber || null,
        aircraftType: flightData.aircraftType || null,
        flightDurationHours: flightData.flightDurationHours || null,
        distanceMiles: distance
      };
      
      const [updatedFlight] = await db
        .update(flights)
        .set(updateData)
        .where(eq(flights.flightId, flightId))
        .returning();
      
      // Update tags if provided
      if (flightData.tags !== undefined) {
        // Delete existing tags
        await db
          .delete(flightTags)
          .where(eq(flightTags.flightId, flightId));
          
        // Add new tags
        const tags = flightData.tags.split(';').map((tag: string) => tag.trim()).filter(Boolean);
        
        for (const tagName of tags) {
          await db.insert(flightTags).values({
            flightId,
            tagName
          });
        }
      }
      
      res.json(updatedFlight);
    } catch (error) {
      console.error("Error updating flight:", error);
      res.status(500).json({ message: "Failed to update flight" });
    }
  });
  
  // Mark a flight as carbon offset (detailed endpoint with provider info)
  app.patch('/api/flights/:id/offset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flightId = parseInt(req.params.id);
      const { carbonOffset, carbonOffsetProvider, carbonOffsetReference } = req.body;

      if (isNaN(flightId)) {
        return res.status(400).json({ message: "Invalid flight ID" });
      }
      
      // Verify the flight belongs to the user
      const existingFlight = await db
        .select()
        .from(flights)
        .where(and(
          eq(flights.flightId, flightId),
          eq(flights.userId, userId)
        ));
        
      if (existingFlight.length === 0) {
        return res.status(404).json({ message: "Flight not found" });
      }
      
      // Update the flight's carbon offset information
      const [updatedFlight] = await db
        .update(flights)
        .set({
          carbonOffset: carbonOffset === true,
          carbonOffsetProvider: carbonOffsetProvider || null,
          carbonOffsetReference: carbonOffsetReference || null,
          carbonOffsetDate: carbonOffset === true ? new Date().toISOString() : null
        })
        .where(eq(flights.flightId, flightId))
        .returning();
        
      res.json(updatedFlight);
    } catch (error) {
      console.error("Error updating carbon offset:", error);
      res.status(500).json({ message: "Failed to update carbon offset information" });
    }
  });
  
  // Simple toggle endpoint for carbon offset status
  app.patch('/api/flights/:id/carbon-offset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flightId = parseInt(req.params.id);
      const { carbonOffset } = req.body;

      if (isNaN(flightId)) {
        return res.status(400).json({ message: "Invalid flight ID" });
      }
      
      // Verify the flight belongs to the user
      const existingFlight = await db
        .select()
        .from(flights)
        .where(and(
          eq(flights.flightId, flightId),
          eq(flights.userId, userId)
        ));
        
      if (existingFlight.length === 0) {
        return res.status(404).json({ message: "Flight not found" });
      }
      
      // Update the flight's carbon offset status
      const [updatedFlight] = await db
        .update(flights)
        .set({
          carbonOffset: carbonOffset === true,
          carbonOffsetDate: carbonOffset === true ? new Date().toISOString() : null
        })
        .where(eq(flights.flightId, flightId))
        .returning();
        
      res.json(updatedFlight);
    } catch (error) {
      console.error("Error updating carbon offset status:", error);
      res.status(500).json({ message: "Failed to update carbon offset status" });
    }
  });
  
  app.delete('/api/flights/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flightId = parseInt(req.params.id);
      
      // Check if flight exists and belongs to user
      const existingFlight = await db
        .select()
        .from(flights)
        .where(and(
          eq(flights.flightId, flightId),
          eq(flights.userId, userId)
        ))
        .limit(1);
        
      if (existingFlight.length === 0) {
        return res.status(404).json({ message: "Flight not found" });
      }
      
      // Delete associated tags first
      await db
        .delete(flightTags)
        .where(eq(flightTags.flightId, flightId));
        
      // Delete the flight
      await db
        .delete(flights)
        .where(eq(flights.flightId, flightId));
        
      res.json({ message: "Flight deleted successfully" });
    } catch (error) {
      console.error("Error deleting flight:", error);
      res.status(500).json({ message: "Failed to delete flight" });
    }
  });
  
  // Airlines API
  app.get('/api/airlines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all airlines used by this user
      const userAirlinesQuery = await db
        .select({ airlineCode: flights.airlineCode })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          not(isNull(flights.airlineCode))
        ))
        .groupBy(flights.airlineCode);
        
      // Get the full airline info
      const airlineCodes = userAirlinesQuery.map(a => a.airlineCode);
      
      if (airlineCodes.length === 0) {
        return res.json([]);
      }
      
      const airlineDetails = await db
        .select()
        .from(airlines)
        .where(inArray(airlines.airlineId, airlineCodes));
        
      res.json(airlineDetails);
    } catch (error) {
      console.error("Error fetching airlines:", error);
      res.status(500).json({ message: "Failed to fetch airlines" });
    }
  });
  
  // Get aircraft types
  app.get('/api/aircraft-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get distinct aircraft types used by this user
      const userAircraftTypes = await db
        .selectDistinct({ type: flights.aircraftType })
        .from(flights)
        .where(and(
          eq(flights.userId, userId),
          not(isNull(flights.aircraftType))
        ))
        .orderBy(flights.aircraftType);
        
      // Extract the type values from the result objects
      const types = userAircraftTypes.map(item => item.type);
      
      res.json(types);
    } catch (error) {
      console.error("Error fetching aircraft types:", error);
      res.status(500).json({ message: "Failed to fetch aircraft types" });
    }
  });
  
  app.put('/api/airlines/:id', isAuthenticated, async (req: any, res) => {
    try {
      const airlineId = req.params.id;
      const { airlineName, color } = req.body;
      
      // Update airline info
      const [updatedAirline] = await db
        .update(airlines)
        .set({
          airlineName,
          color,
          needsManualColorInput: false
        })
        .where(eq(airlines.airlineId, airlineId))
        .returning();
        
      res.json(updatedAirline);
    } catch (error) {
      console.error("Error updating airline:", error);
      res.status(500).json({ message: "Failed to update airline" });
    }
  });
  
  // Airports API for search/autocomplete
  app.get('/api/airports/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const searchTerm = `%${query}%`;
      const upperQuery = query.toUpperCase();
      
      // Use simpler approach to avoid where clause issues
      const searchResults = await db
        .select()
        .from(airports)
        .where(sql`${airports.iataCode} = ${upperQuery} OR ${airports.name} ILIKE ${searchTerm} OR ${airports.city} ILIKE ${searchTerm}`)
        .limit(10);
        
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching airports:", error);
      res.status(500).json({ message: "Failed to search airports" });
    }
  });
  
  // Import airports data on server start (if needed)
  const checkAndImportAirports = async () => {
    const airportCount = await db.select().from(airports).limit(1);
    
    if (airportCount.length === 0) {
      console.log("No airports found in database. Importing from reference data...");
      
      try {
        // Run the import-airports.js script
        const { exec } = require('child_process');
        const path = require('path');
        
        // Path to the import script
        const scriptPath = path.resolve('./import-airports.js');
        
        console.log(`Running airport import script: ${scriptPath}`);
        
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing airport import script: ${error.message}`);
            return;
          }
          
          if (stderr) {
            console.error(`Airport import script stderr: ${stderr}`);
          }
          
          console.log(`Airport import script output: ${stdout}`);
        });
        
        console.log("Airport data import initiated. Check logs for details.");
      } catch (error) {
        console.error("Failed to import airport data:", error);
      }
    } else {
      console.log(`Found ${airportCount.length} airports in database. No import needed.`);
    }
  };
  
  // Import airlines data on server start (if needed)
  const checkAndImportAirlines = async () => {
    const airlineCount = await db.select().from(airlines).limit(1);
    
    if (airlineCount.length === 0 || airlineCount.length < 10) {
      console.log("Few or no airlines found in database. Importing from reference data...");
      
      try {
        // Import airlines directly into the database
        // Hardcoded list of common airlines including historical ones
        const commonAirlines = [
          { airlineId: 'AA', airlineName: 'American Airlines', brandColorPrimary: '#0078D2', brandColorSecondary: '#C4D8E7' },
          { airlineId: 'AS', airlineName: 'Alaska Airlines', brandColorPrimary: '#0060AB', brandColorSecondary: '#41B6E6' },
          { airlineId: 'DL', airlineName: 'Delta Air Lines', brandColorPrimary: '#E01933', brandColorSecondary: '#003A70' },
          { airlineId: 'UA', airlineName: 'United Airlines', brandColorPrimary: '#002244', brandColorSecondary: '#3399CC' },
          { airlineId: 'B6', airlineName: 'JetBlue Airways', brandColorPrimary: '#003876', brandColorSecondary: '#00A1DE' },
          { airlineId: 'WN', airlineName: 'Southwest Airlines', brandColorPrimary: '#F9B612', brandColorSecondary: '#304CB2' },
          { airlineId: 'NW', airlineName: 'Northwest Airlines', brandColorPrimary: '#D12630', brandColorSecondary: '#0C1C47' },
          { airlineId: 'TW', airlineName: 'Trans World Airlines', brandColorPrimary: '#981E32', brandColorSecondary: '#FFFFFF' },
          { airlineId: 'CO', airlineName: 'Continental Airlines', brandColorPrimary: '#072F6B', brandColorSecondary: '#C4A15A' },
          { airlineId: 'US', airlineName: 'US Airways', brandColorPrimary: '#005DAA', brandColorSecondary: '#D82A20' },
          { airlineId: 'AC', airlineName: 'Air Canada', brandColorPrimary: '#D22630', brandColorSecondary: '#000000' },
          { airlineId: 'BA', airlineName: 'British Airways', brandColorPrimary: '#075AAA', brandColorSecondary: '#EB2226' },
          { airlineId: 'LH', airlineName: 'Lufthansa', brandColorPrimary: '#05164D', brandColorSecondary: '#FFAD1D' },
          { airlineId: 'AF', airlineName: 'Air France', brandColorPrimary: '#002157', brandColorSecondary: '#FF0000' },
          { airlineId: 'KL', airlineName: 'KLM Royal Dutch Airlines', brandColorPrimary: '#00A1DE', brandColorSecondary: '#FFFFFF' },
          { airlineId: 'QF', airlineName: 'Qantas Airways', brandColorPrimary: '#EE0000', brandColorSecondary: '#FFFFFF' },
          { airlineId: 'EK', airlineName: 'Emirates', brandColorPrimary: '#D71921', brandColorSecondary: '#FFFFFF' },
          { airlineId: 'SQ', airlineName: 'Singapore Airlines', brandColorPrimary: '#F1A52C', brandColorSecondary: '#011E41' },
          { airlineId: 'CX', airlineName: 'Cathay Pacific', brandColorPrimary: '#006564', brandColorSecondary: '#767171' },
          { airlineId: 'MH', airlineName: 'Malaysia Airlines', brandColorPrimary: '#006DB7', brandColorSecondary: '#B30838' },
        ];
        
        // Process the airline data in chunks to avoid query size limits
        const CHUNK_SIZE = 5;
        let totalImported = 0;
        
        for (let i = 0; i < commonAirlines.length; i += CHUNK_SIZE) {
          const chunk = commonAirlines.slice(i, i + CHUNK_SIZE);
          
          try {
            await db.insert(airlines).values(chunk).onConflictDoUpdate({
              target: airlines.airlineId,
              set: {
                airlineName: sql`excluded.airline_name`,
                brandColorPrimary: sql`excluded.brand_color_primary`,
                brandColorSecondary: sql`excluded.brand_color_secondary`,
                needsManualColorInput: false
              }
            });
            
            totalImported += chunk.length;
            console.log(`Imported chunk of ${chunk.length} airlines (${i+1}-${Math.min(i+CHUNK_SIZE, commonAirlines.length)} of ${commonAirlines.length})`);
          } catch (chunkError) {
            console.error(`Error importing chunk: ${chunkError.message}`);
          }
        }
        
        console.log(`Total imported: ${totalImported} airlines`);
      } catch (error) {
        console.error("Failed to import airline data:", error);
      }
    } else {
      console.log(`Found ${airlineCount.length} airlines in database. No import needed.`);
    }
  };
  
  // Flight data upload endpoint (supports CSV and Excel with AI-powered field detection)
  app.post('/api/flights/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      // Use Gemini-powered spreadsheet processor
      const { importedCount, errors } = await processSpreadsheetUpload(
        file.buffer,
        file.originalname,
        userId
      );
      
      // Send back the result with error details if any
      res.json({ 
        count: importedCount, 
        errors: errors,
        success: errors.length === 0 || importedCount > 0
      });
    } catch (error) {
      console.error("Error uploading flights:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // If it's a header mapping error, return a more specific status code
      if (errorMessage.includes("Could not identify") || 
          errorMessage.includes("Could not map required headers") || 
          errorMessage.includes("Missing required headers")) {
        return res.status(400).json({ 
          message: "Data format error",
          error: errorMessage,
          count: 0,
          errors: [errorMessage]
        });
      }
      
      res.status(500).json({ 
        message: "Failed to upload flights",
        error: errorMessage,
        count: 0,
        errors: [errorMessage]
      });
    }
  });
  
  // AI-powered flight data upload endpoint (supports CSV and Excel files)
  app.post('/api/flights/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      // Check for Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          message: "Gemini AI service not configured", 
          error: "GEMINI_API_KEY is not set in environment variables", 
          count: 0, 
          errors: ["AI-powered processing is currently unavailable. Please contact the administrator."] 
        });
      }
      
      console.log(`Processing ${file.originalname} with AI for user ${userId}`);
      
      // Use the new spreadsheet processor with Gemini AI
      const result = await processSpreadsheetUpload(
        file.buffer,
        file.originalname,
        userId
      );
      
      // Send back the result with error details if any
      res.json({ 
        count: result.count, 
        errors: result.errors,
        success: result.errors.length === 0 || result.count > 0
      });
    } catch (error) {
      console.error("Error uploading flights with AI:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // If it's a field identification error, return a more specific status code
      if (errorMessage.includes("Could not identify") || 
          errorMessage.includes("Failed to analyze spreadsheet format") || 
          errorMessage.includes("Missing required fields")) {
        return res.status(400).json({ 
          message: "Data format error",
          error: errorMessage,
          count: 0,
          errors: [errorMessage]
        });
      }
      
      res.status(500).json({ 
        message: "Failed to process flight data",
        error: errorMessage,
        count: 0,
        errors: [errorMessage]
      });
    }
  });
  
  // Excel template download endpoint
  app.get('/api/flights/template/excel', async (req, res) => {
    try {
      // Use xlsx library to create a simple template
      const XLSX = require('xlsx');
      
      // Create a new workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Sample data with the expected columns
      const sampleData = [
        {
          departure_airport_iata: 'PDX',
          arrival_airport_iata: 'ANC',
          airline_code: 'AS',
          flight_date: '2025-05-15',
          flight_duration_hours: 3.5,
          flight_number: '123',
          aircraft_type: 'B738',
          tags: 'Vacation;Family'
        },
        {
          departure_airport_iata: 'SFO',
          arrival_airport_iata: 'LAX',
          airline_code: 'UA',
          flight_date: '2025-06-01',
          flight_duration_hours: 1.2,
          flight_number: '456',
          aircraft_type: 'A320',
          tags: 'Business'
        },
        {
          departure_airport_iata: 'JFK',
          arrival_airport_iata: 'LHR',
          airline_code: 'BA',
          flight_date: '2025-07-10',
          flight_duration_hours: 7.5,
          flight_number: '112',
          aircraft_type: 'B777',
          tags: 'Vacation;Long-haul'
        }
      ];
      
      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(sampleData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Flight Data");
      
      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 20 }, // departure_airport_iata
        { wch: 20 }, // arrival_airport_iata
        { wch: 15 }, // airline_code
        { wch: 15 }, // flight_date
        { wch: 20 }, // flight_duration_hours
        { wch: 15 }, // flight_number
        { wch: 15 }, // aircraft_type
        { wch: 25 }  // tags
      ];
      
      // Write to buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers and send file
      res.setHeader('Content-Disposition', 'attachment; filename=flight_template.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (error) {
      console.error('Error generating Excel template:', error);
      res.status(500).json({ error: 'Failed to generate Excel template' });
    }
  });
  
  // Legacy CSV upload endpoint (keep for backward compatibility)
  app.post('/api/flights/upload_csv', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      const csvContent = file.buffer.toString('utf-8');
      const { importedCount, errors } = await processCSVUpload(csvContent, userId, db);
      
      // Send back the result with error details if any
      res.json({ 
        count: importedCount, 
        errors: errors,
        success: errors.length === 0 || importedCount > 0
      });
    } catch (error) {
      console.error("Error uploading flights:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // If it's a header mapping error, return a more specific status code
      if (errorMessage.includes("Could not map required headers") || 
          errorMessage.includes("Missing required headers")) {
        return res.status(400).json({ 
          message: "CSV header format error",
          error: errorMessage,
          count: 0,
          errors: [errorMessage]
        });
      }
      
      res.status(500).json({ 
        message: "Failed to upload flights",
        error: errorMessage,
        count: 0,
        errors: [errorMessage]
      });
    }
  });
  
  // Demo user endpoint
  app.post('/api/demo/create', async (req, res) => {
    try {
      const DEMO_USER_ID = 'demo-user-12345';
      
      console.log('Attempting to create demo user and session...');
      
      // Check if demo user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, DEMO_USER_ID));
        
      if (existingUser.length === 0) {
        console.log('Creating demo user in database...');
        await db.insert(users).values({
          id: DEMO_USER_ID,
          email: 'demo@solsticenavigator.com',
          firstName: 'Dave',
          lastName: 'Demo',
          profileImageUrl: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log('Demo user verified or created, setting up session...');
      
      // Create a mock passport user session
      req.login({
        claims: {
          sub: DEMO_USER_ID,
          email: 'demo@solsticenavigator.com',
          first_name: 'Dave',
          last_name: 'Demo',
          profile_image_url: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
        },
        access_token: 'demo-token',
        expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }, (err) => {
        if (err) {
          console.error('Error creating demo session:', err);
          return res.status(500).json({ error: 'Failed to create demo session' });
        }
        
        console.log('Demo user session created successfully');
        res.json({ message: 'Demo user created and logged in', userId: DEMO_USER_ID });
      });
    } catch (error) {
      console.error('Error creating demo user:', error);
      res.status(500).json({ error: 'Failed to create demo user', details: error.message });
    }
  });
  
  // Import demo data endpoint - simplified version
  app.post('/api/demo/import', async (req: any, res) => {
    try {
      console.log('Starting demo data import...');
      
      // Use a fixed demo user ID
      const userId = 'demo-user-12345';
      console.log(`Importing demo data for user: ${userId}`);
      
      // Check if flights already exist for this user
      const existingFlights = await db
        .select()
        .from(flights)
        .where(eq(flights.userId, userId))
        .limit(1);
        
      if (existingFlights.length > 0) {
        console.log('User already has flights, skipping import');
        return res.json({ 
          message: 'Demo flights already exist for this user', 
          count: existingFlights.length 
        });
      }
      
      // We'll add some fixed demo flights since file reading was causing issues
      const demoFlights = [
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "121",
          departureAirport: "ANC",
          arrivalAirport: "SEA",
          date: "1995-06-10",
          aircraft: "Boeing 727-200"
        },
        {
          airline: "United Airlines",
          airlineCode: "UA",
          flightNumber: "567",
          departureAirport: "SFO",
          arrivalAirport: "ORD",
          date: "1995-09-05",
          aircraft: "Boeing 727-200"
        },
        {
          airline: "Delta Air Lines",
          airlineCode: "DL",
          flightNumber: "310",
          departureAirport: "ATL",
          arrivalAirport: "LGA",
          date: "1996-02-12",
          aircraft: "Boeing 727-200"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "234",
          departureAirport: "SEA",
          arrivalAirport: "SFO",
          date: "1996-05-28",
          aircraft: "McDonnell Douglas MD-83"
        },
        {
          airline: "American Airlines",
          airlineCode: "AA",
          flightNumber: "910",
          departureAirport: "ORD",
          arrivalAirport: "LAX",
          date: "1997-06-22",
          aircraft: "McDonnell Douglas DC-10"
        },
        {
          airline: "United Airlines",
          airlineCode: "UA",
          flightNumber: "241",
          departureAirport: "DEN",
          arrivalAirport: "SFO",
          date: "1997-10-29",
          aircraft: "Boeing 737-300"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "465",
          departureAirport: "SEA",
          arrivalAirport: "LAX",
          date: "1998-01-15",
          aircraft: "McDonnell Douglas MD-83"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "102",
          departureAirport: "SFO",
          arrivalAirport: "SEA",
          date: "1999-02-18",
          aircraft: "McDonnell Douglas MD-83"
        },
        {
          airline: "Delta Air Lines",
          airlineCode: "DL",
          flightNumber: "975",
          departureAirport: "SLC",
          arrivalAirport: "ATL",
          date: "1999-05-03",
          aircraft: "Boeing 757-200"
        },
        {
          airline: "United Airlines",
          airlineCode: "UA",
          flightNumber: "622",
          departureAirport: "ORD",
          arrivalAirport: "MIA",
          date: "1999-07-20",
          aircraft: "Boeing 727-200"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "2001",
          departureAirport: "SEA",
          arrivalAirport: "GEG",
          date: "1999-11-15",
          aircraft: "Dash 8-Q200 (Horizon Air)"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "95",
          departureAirport: "ANC",
          arrivalAirport: "SEA",
          date: "2000-08-12",
          aircraft: "Boeing 737-400"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "456",
          departureAirport: "SEA",
          arrivalAirport: "SAN",
          date: "2001-07-03",
          aircraft: "Boeing 737-400"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "2102",
          departureAirport: "PDX",
          arrivalAirport: "BOI",
          date: "2002-05-16",
          aircraft: "Dash 8-Q400 (Horizon Air)"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "82",
          departureAirport: "SFO",
          arrivalAirport: "ANC",
          date: "2003-04-03",
          aircraft: "Boeing 737-400"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "533",
          departureAirport: "SEA",
          arrivalAirport: "PHX",
          date: "2004-05-07",
          aircraft: "Boeing 737-700"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "70",
          departureAirport: "ANC",
          arrivalAirport: "FAI",
          date: "2005-06-20",
          aircraft: "Boeing 737-400 Combi"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "145",
          departureAirport: "SFO",
          arrivalAirport: "PDX",
          date: "2006-05-01",
          aircraft: "Boeing 737-700"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "2305",
          departureAirport: "SEA",
          arrivalAirport: "EUG",
          date: "2007-03-29",
          aircraft: "Dash 8-Q400 (Horizon Air)"
        },
        {
          airline: "Alaska Airlines",
          airlineCode: "AS",
          flightNumber: "68",
          departureAirport: "SEA",
          arrivalAirport: "ANC",
          date: "2008-05-03",
          aircraft: "Boeing 737-800"
        }
      ];
      
      let importedCount = 0;
      
      // Add the demo flights
      for (const demo of demoFlights) {
        // Ensure the airline exists
        const existingAirline = await db
          .select()
          .from(airlines)
          .where(eq(airlines.airlineId, demo.airlineCode));
          
        if (existingAirline.length === 0) {
          await db.insert(airlines).values({
            airlineId: demo.airlineCode,
            airlineName: demo.airline,
            needsManualColorInput: true
          });
        }
        
        // Get airport coordinates
        const [depAirportData] = await db
          .select()
          .from(airports)
          .where(eq(airports.iataCode, demo.departureAirport));
          
        const [arrAirportData] = await db
          .select()
          .from(airports)
          .where(eq(airports.iataCode, demo.arrivalAirport));
          
        if (!depAirportData || !arrAirportData) {
          console.log(`Missing airport data for ${demo.departureAirport} or ${demo.arrivalAirport}`);
          continue;
        }
        
        // Calculate distance
        const distance = calculateDistance(
          Number(depAirportData.latitude),
          Number(depAirportData.longitude),
          Number(arrAirportData.latitude),
          Number(arrAirportData.longitude)
        );
        
        // Calculate carbon footprint
        const carbonFootprint = calculateCarbonFootprint(distance, demo.aircraft);
        
        // Calculate flight duration (based on distance and aircraft type)
        let flightDuration = (distance / 500) + 0.5; // Basic calculation
        
        // Insert the flight
        try {
          const [insertedFlight] = await db.insert(flights).values({
            userId,
            departureAirportIata: demo.departureAirport,
            arrivalAirportIata: demo.arrivalAirport,
            airlineCode: demo.airlineCode,
            flightDate: new Date(demo.date),
            flightNumber: demo.flightNumber,
            aircraftType: demo.aircraft,
            flightDurationHours: parseFloat(flightDuration.toFixed(1)),
            distanceMiles: Math.round(distance),
            carbonFootprintKg: carbonFootprint,
            carbonOffset: Math.random() > 0.7 // Randomly offset about 30% of flights
          }).returning();
          
          // Add tags based on aircraft type
          if (demo.aircraft.toLowerCase().includes('airbus')) {
            await db.insert(flightTags).values({
              flightId: insertedFlight.flightId,
              tagName: 'Airbus'
            });
          } else if (demo.aircraft.toLowerCase().includes('boeing')) {
            await db.insert(flightTags).values({
              flightId: insertedFlight.flightId,
              tagName: 'Boeing'
            });
          }
          
          // Add tags based on timeframe
          const flightYear = new Date(demo.date).getFullYear();
          if (flightYear < 2000) {
            await db.insert(flightTags).values({
              flightId: insertedFlight.flightId,
              tagName: '20th Century'
            });
          } else if (flightYear >= 2020) {
            await db.insert(flightTags).values({
              flightId: insertedFlight.flightId,
              tagName: 'Post-2020'
            });
          }
          
          importedCount++;
        } catch (err) {
          console.error(`Error inserting flight: ${err.message}`);
          continue;
        }
      }
      
      console.log(`Successfully imported ${importedCount} demo flights`);
      res.json({ 
        message: `Successfully imported ${importedCount} flights for demo user`, 
        count: importedCount,
        success: true
      });
    } catch (error) {
      console.error('Error importing demo data:', error);
      res.status(500).json({ 
        error: 'Failed to import demo data', 
        details: error.message 
      });
    }
  });
  
  // Get all airlines
  app.get('/api/airlines', isAuthenticated, async (req, res) => {
    try {
      // Fetch all airlines from database
      const allAirlines = await db
        .select()
        .from(airlines)
        .orderBy(airlines.airlineName);
        
      res.json(allAirlines);
    } catch (error) {
      console.error("Error fetching airlines:", error);
      res.status(500).json({ message: "Failed to fetch airlines" });
    }
  });
  
  // Get aircraft types
  app.get('/api/aircraft-types', isAuthenticated, async (req, res) => {
    try {
      // List of common aircraft types from 1960 to present
      const aircraftTypes = [
        // Airbus
        "Airbus A300", "Airbus A310", "Airbus A318", "Airbus A319", "Airbus A320", "Airbus A321",
        "Airbus A330", "Airbus A330-200", "Airbus A330-300", "Airbus A340", "Airbus A350", 
        "Airbus A380",
        
        // Boeing Modern
        "Boeing 717", "Boeing 737-600", "Boeing 737-700", "Boeing 737-800", "Boeing 737-900",
        "Boeing 737 MAX", "Boeing 747-400", "Boeing 747-8", "Boeing 757", "Boeing 767",
        "Boeing 777", "Boeing 787", "Boeing 787 Dreamliner",
        
        // Boeing Classic
        "Boeing 707", "Boeing 727", "Boeing 737-200", "Boeing 737-300", "Boeing 737-400",
        "Boeing 747-100", "Boeing 747-200", "Boeing 747-300",
        
        // McDonnell Douglas
        "DC-8", "DC-9", "DC-10", "MD-80", "MD-90", "MD-11",
        
        // Regional Jets
        "Bombardier CRJ", "Bombardier CRJ-700", "Bombardier CRJ-900", "Bombardier Q400",
        "Embraer ERJ-145", "Embraer E-170", "Embraer E-175", "Embraer E-190", "Embraer E-195",
        
        // Other historically significant
        "Lockheed L-1011", "Concorde", "BAC 1-11", "Tupolev Tu-154", "Fokker 100",
        
        // Generic option
        "Other"
      ];
      
      res.json(aircraftTypes.sort());
    } catch (error) {
      console.error("Error serving aircraft types:", error);
      res.status(500).json({ message: "Failed to retrieve aircraft types" });
    }
  });
  
  // Add an endpoint for airline search with code lookup
  app.get('/api/airlines/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 1) {
        return res.json([]);
      }
      
      const searchTerm = `%${query}%`;
      const upperQuery = query.toUpperCase();
      
      // Search by code or name
      const searchResults = await db
        .select()
        .from(airlines)
        .where(sql`${airlines.airlineId} = ${upperQuery} OR ${airlines.airlineName} ILIKE ${searchTerm}`)
        .limit(10);
        
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching airlines:", error);
      res.status(500).json({ message: "Failed to search airlines" });
    }
  });
  
  // Call the import checks
  checkAndImportAirports();
  checkAndImportAirlines();
  
  const httpServer = createServer(app);
  return httpServer;
}
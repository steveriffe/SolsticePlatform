import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  jsonb,
  index,
  date,
  decimal,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  authProvider: varchar("auth_provider"),
  providerId: varchar("provider_id"),
  email: varchar("email").unique(),
  displayName: varchar("display_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Airlines table
export const airlines = pgTable("airlines", {
  airlineId: varchar("airline_id").primaryKey().notNull(), // IATA/ICAO code
  airlineName: varchar("airline_name").unique().notNull(),
  brandColorPrimary: varchar("brand_color_primary").default("#FFFFFF"),
  brandColorSecondary: varchar("brand_color_secondary"),
  needsManualColorInput: boolean("needs_manual_color_input").default(true),
});

// Airports table
export const airports = pgTable("airports", {
  iataCode: varchar("iata_code", { length: 10 }).primaryKey().notNull(),
  name: varchar("name").notNull(),
  city: varchar("city"),
  countryId: varchar("country_id"),
  latitude: decimal("latitude", { precision: 9, scale: 6 }),
  longitude: decimal("longitude", { precision: 9, scale: 6 }),
});

// Flights table
export const flights = pgTable("flights", {
  flightId: serial("flight_id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  departureAirportIata: varchar("departure_airport_iata", { length: 10 }).notNull().references(() => airports.iataCode),
  arrivalAirportIata: varchar("arrival_airport_iata", { length: 10 }).notNull().references(() => airports.iataCode),
  airlineCode: varchar("airline_code").references(() => airlines.airlineId),
  flightDate: date("flight_date").notNull(),
  flightNumber: varchar("flight_number"),
  aircraftType: varchar("aircraft_type"),
  flightDurationHours: decimal("flight_duration_hours", { precision: 5, scale: 2 }),
  distanceMiles: integer("distance_miles"),
  tripCost: decimal("trip_cost", { precision: 10, scale: 2 }),
  tripCostCurrency: varchar("trip_cost_currency", { length: 3 }).default("USD"),
  carbonFootprintKg: decimal("carbon_footprint_kg", { precision: 10, scale: 2 }),
  carbonOffset: boolean("carbon_offset").default(false),
  carbonOffsetProvider: varchar("carbon_offset_provider"),
  carbonOffsetReference: varchar("carbon_offset_reference"),
  carbonOffsetDate: date("carbon_offset_date"),
  journalEntry: jsonb("journal_entry"), // Rich text journal entry stored as JSON
  createdAt: timestamp("created_at").defaultNow(),
});

// Flight tags table
export const flightTags = pgTable("flight_tags", {
  flightId: integer("flight_id").notNull().references(() => flights.flightId),
  tagName: varchar("tag_name").notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.flightId, table.tagName),
  };
});

// Schema types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type Airline = typeof airlines.$inferSelect;
export type InsertAirline = typeof airlines.$inferInsert;

export type Airport = typeof airports.$inferSelect;
export type InsertAirport = typeof airports.$inferInsert;

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = typeof flights.$inferInsert;

export type FlightTag = typeof flightTags.$inferSelect;
export type InsertFlightTag = typeof flightTags.$inferInsert;

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertAirlineSchema = createInsertSchema(airlines);
export const insertAirportSchema = createInsertSchema(airports);
export const insertFlightSchema = createInsertSchema(flights);
export const insertFlightTagSchema = createInsertSchema(flightTags);

// CSV upload schema
export const csvFlightSchema = z.object({
  departure_airport_iata: z.string().min(1).max(10),
  arrival_airport_iata: z.string().min(1).max(10),
  airline_code: z.string().min(1),
  flight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  flight_duration_hours: z.number().optional(),
  flight_number: z.string().optional(),
  aircraft_type: z.string().optional(),
  tags: z.string().optional(),
  trip_cost: z.number().optional(),
  trip_cost_currency: z.string().max(3).optional().default("USD"),
});

export type CSVFlight = z.infer<typeof csvFlightSchema>;

// KPI types
export type FlightKPIs = {
  totalAirlines: number;
  totalMiles: number;
  totalHours: number;
  newAirlinesThisYear: number;
  milesThisMonth: number;
  hoursThisMonth: number;
  totalCarbonKg?: number;
  offsetCarbonKg?: number;
  unOffsetCarbonKg?: number;
  offsetPercentage?: number;
  totalTripCost?: number;
  tripCostThisMonth?: number;
  primaryCurrency?: string;
};

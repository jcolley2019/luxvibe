import { pgTable, text, serial, integer, numeric, timestamp, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// MUST export auth models so drizzle migrations pick them up
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  hotelId: text("hotel_id").notNull(),
  hotelName: text("hotel_name").notNull(),
  roomType: text("room_type").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  guests: integer("guests").notNull(),
  totalPrice: numeric("total_price").notNull(),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  createdAt: true, 
  status: true,
  userId: true // userId is injected by the server from the session
});

// === LITEAPI BOOKING REFS ===
// Persistent store of bookingIds returned by LiteAPI, keyed by guestEmail.
// Needed because clientReference is now unique per booking, so we can't query by email alone.
export const litapiBookingRefs = pgTable("liteapi_booking_refs", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  bookingId: text("booking_id").notNull(),
  guestEmail: text("guest_email").notNull(),
  clientReference: text("client_reference").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertLitapiBookingRefSchema = createInsertSchema(litapiBookingRefs).omit({ id: true, createdAt: true });
export type LitapiBookingRef = typeof litapiBookingRefs.$inferSelect;
export type InsertLitapiBookingRef = z.infer<typeof insertLitapiBookingRefSchema>;

// === EXPLICIT API CONTRACT TYPES ===
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

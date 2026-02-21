import { db } from "./db";
import { bookings, type InsertBooking, type Booking } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUserBookings(userId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking & { userId: string }): Promise<Booking>;
}

export class DatabaseStorage implements IStorage {
  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async createBooking(bookingData: InsertBooking & { userId: string }): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }
}

export const storage = new DatabaseStorage();

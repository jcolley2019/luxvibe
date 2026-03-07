import { db } from "./db";
import { bookings, type InsertBooking, type Booking } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUserBookings(userId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking & { userId: string }): Promise<Booking>;
  getBookingById(id: number): Promise<Booking | null>;
}

export class DatabaseStorage implements IStorage {
  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async createBooking(bookingData: InsertBooking & { userId: string }): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  async getBookingById(id: number): Promise<Booking | null> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking ?? null;
  }
}

export const storage = new DatabaseStorage();

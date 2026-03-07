import { db } from "./db";
import { bookings, blogPosts, type InsertBooking, type Booking, type BlogPost, type InsertBlogPost } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUserBookings(userId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking & { userId: string }): Promise<Booking>;
  getBookingById(id: number): Promise<Booking | null>;
  getAllPublishedPosts(): Promise<BlogPost[]>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
  upsertPost(post: InsertBlogPost): Promise<BlogPost>;
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

  async getAllPublishedPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post ?? null;
  }

  async upsertPost(postData: InsertBlogPost): Promise<BlogPost> {
    const existing = await this.getPostBySlug(postData.slug);
    if (existing) {
      const [updated] = await db
        .update(blogPosts)
        .set({ ...postData, updatedAt: new Date() })
        .where(eq(blogPosts.slug, postData.slug))
        .returning();
      return updated;
    }
    const [created] = await db.insert(blogPosts).values(postData).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();

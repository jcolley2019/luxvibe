import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, type HotelSearchResponse, type HotelDetailsResponse } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.hotels.search.path, async (req, res) => {
    try {
      const { destination, checkIn, checkOut, guests } = req.query;
      
      // For now, if no liteAPI key or just to have some mock data while developing:
      if (!process.env.LITEAPI_KEY) {
        // Return mock data
        const mockHotels: HotelSearchResponse = [
          {
            id: "hotel-1",
            name: "Grand Plaza Hotel",
            address: "123 Main St, " + (destination || "City Center"),
            rating: 4.5,
            price: 199,
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
          },
          {
            id: "hotel-2",
            name: "Oceanview Resort",
            address: "456 Beach Rd, " + (destination || "Coastal Area"),
            rating: 4.8,
            price: 299,
            imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
          },
          {
            id: "hotel-3",
            name: "Mountain Retreat",
            address: "789 Pine View, " + (destination || "Highlands"),
            rating: 4.2,
            price: 149,
            imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c0d5c9f4?w=800&q=80",
          }
        ];
        return res.json(mockHotels);
      }

      // TODO: Implement actual liteAPI integration here using LITEAPI_KEY
      res.json([]);
    } catch (err) {
      res.status(500).json({ message: "Failed to search hotels" });
    }
  });

  app.get(api.hotels.get.path, async (req, res) => {
    try {
      if (!process.env.LITEAPI_KEY) {
        const mockHotel: HotelDetailsResponse = {
          id: req.params.id,
          name: "Grand Plaza Hotel",
          address: "123 Main St",
          description: "A beautiful hotel in the heart of the city with luxury amenities and breathtaking views. Perfect for both business and leisure travelers.",
          rating: 4.5,
          images: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
            "https://images.unsplash.com/photo-1551882547-ff40c0d5c9f4?w=1200&q=80"
          ],
          amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym", "Room Service"],
          rooms: [
            {
              id: "room1",
              name: "Standard Room",
              description: "1 King Bed, City View, 30 sqm",
              price: 199,
              capacity: 2,
            },
            {
              id: "room2",
              name: "Deluxe Suite",
              description: "1 King Bed, Ocean View, Balcony, 55 sqm",
              price: 349,
              capacity: 2,
            },
            {
              id: "room3",
              name: "Family Room",
              description: "2 Queen Beds, City View, 45 sqm",
              price: 279,
              capacity: 4,
            }
          ]
        };
        return res.json(mockHotel);
      }
      res.json(null);
    } catch (err) {
      res.status(500).json({ message: "Failed to get hotel details" });
    }
  });

  app.get(api.bookings.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post(api.bookings.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.bookings.create.input.parse(req.body);
      
      const booking = await storage.createBooking({
        ...input,
        userId
      });
      
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  return httpServer;
}

import { z } from 'zod';
import { insertBookingSchema, bookings } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  hotels: {
    featured: {
      method: 'GET' as const,
      path: '/api/hotels/featured' as const,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          address: z.string(),
          city: z.string(),
          stars: z.number().nullable(),
          rating: z.number().nullable(),
          reviewCount: z.number().nullable(),
          price: z.number().nullable(),
          imageUrl: z.string().nullable(),
        })),
        500: errorSchemas.internal,
      },
    },
    nearby: {
      method: 'GET' as const,
      path: '/api/hotels/nearby' as const,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          address: z.string(),
          city: z.string(),
          stars: z.number().nullable(),
          rating: z.number().nullable(),
          reviewCount: z.number().nullable(),
          price: z.number().nullable(),
          imageUrl: z.string().nullable(),
        })),
        500: errorSchemas.internal,
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/hotels/search' as const,
      input: z.object({
        destination: z.string(),
        checkIn: z.string(),
        checkOut: z.string(),
        guests: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          address: z.string(),
          stars: z.number().nullable(),
          rating: z.number().nullable(),
          reviewCount: z.number().nullable(),
          price: z.number(),
          imageUrl: z.string().nullable(),
        })),
        500: errorSchemas.internal,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/hotels/:id' as const,
      input: z.object({
        checkIn: z.string(),
        checkOut: z.string(),
        guests: z.string().optional(),
      }).optional(),
      responses: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          address: z.string(),
          city: z.string().nullable(),
          countryCode: z.string().nullable(),
          description: z.string(),
          stars: z.number().nullable(),
          rating: z.number().nullable(),
          reviewCount: z.number().nullable(),
          images: z.array(z.string()),
          amenities: z.array(z.string()),
          rooms: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            price: z.number(),
            capacity: z.number(),
          })),
        }),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    similar: {
      method: 'GET' as const,
      path: '/api/hotels/:id/similar' as const,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          address: z.string(),
          stars: z.number().nullable(),
          rating: z.number().nullable(),
          reviewCount: z.number().nullable(),
          price: z.number().nullable(),
          imageUrl: z.string().nullable(),
        })),
        500: errorSchemas.internal,
      },
    },
  },
  bookings: {
    list: {
      method: 'GET' as const,
      path: '/api/bookings' as const,
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bookings' as const,
      input: insertBookingSchema,
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type HotelSearchResponse = z.infer<typeof api.hotels.search.responses[200]>;
export type HotelDetailsResponse = z.infer<typeof api.hotels.get.responses[200]>;
export type HotelFeaturedResponse = z.infer<typeof api.hotels.featured.responses[200]>;
export type BookingResponse = z.infer<typeof api.bookings.create.responses[201]>;

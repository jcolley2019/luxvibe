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
    places: {
      method: 'GET' as const,
      path: '/api/places' as const,
      input: z.object({
        q: z.string(),
      }),
      responses: {
        200: z.array(z.object({
          placeId: z.string(),
          displayName: z.string(),
        })),
        500: errorSchemas.internal,
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/hotels/search' as const,
      input: z.object({
        destination: z.string().optional(),
        placeId: z.string().optional(),
        aiSearch: z.string().optional(),
        checkIn: z.string(),
        checkOut: z.string(),
        guests: z.string().optional(),
      }),
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
            id: z.string(), // mappedRoomId
            name: z.string(),
            photos: z.array(z.object({ url: z.string() })).optional(),
          })),
          roomTypes: z.array(z.object({
            offerId: z.string(),
            mappedRoomId: z.string(),
            name: z.string(),
            boardName: z.string(),
            price: z.number(),
            currency: z.string(),
            cancellationPolicy: z.string().optional(),
            refundableTag: z.string().optional(),
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
    prebook: {
      method: 'POST' as const,
      path: '/api/hotels/prebook' as const,
      input: z.object({
        offerId: z.string(),
      }),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    book: {
      method: 'POST' as const,
      path: '/api/hotels/book' as const,
      input: z.object({
        prebookId: z.string(),
        transactionId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
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

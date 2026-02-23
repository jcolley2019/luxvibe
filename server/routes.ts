import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

const LITEAPI_BASE = "https://api.liteapi.travel/v3.0";
const LITEAPI_BOOK_BASE = "https://book.liteapi.travel/v3.0";

async function liteApiGet(path: string, params?: Record<string, string>) {
  const url = new URL(`${LITEAPI_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), {
    headers: {
      "accept": "application/json",
      "X-API-Key": process.env.LITEAPI_KEY!,
    },
  });
  return res.json();
}

async function liteApiPost(path: string, body: any, baseUrl: string = LITEAPI_BASE) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "X-API-Key": process.env.LITEAPI_KEY!,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || data?.message || "LiteAPI request failed");
  }
  return data;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const CITY_COUNTRY_MAP: Record<string, string> = {
  "paris": "FR", "lyon": "FR", "nice": "FR", "marseille": "FR", "bordeaux": "FR",
  "london": "GB", "manchester": "GB", "birmingham": "GB", "edinburgh": "GB", "glasgow": "GB",
  "new york": "US", "los angeles": "US", "chicago": "US", "miami": "US", "las vegas": "US",
  "san francisco": "US", "boston": "US", "washington": "US", "seattle": "US", "orlando": "US",
  "houston": "US", "dallas": "US", "denver": "US", "atlanta": "US", "phoenix": "US",
  "nashville": "US", "new orleans": "US", "honolulu": "US", "portland": "US", "austin": "US",
  "san diego": "US", "philadelphia": "US", "detroit": "US", "minneapolis": "US", "tampa": "US",
  "tokyo": "JP", "osaka": "JP", "kyoto": "JP",
  "dubai": "AE", "abu dhabi": "AE",
  "rome": "IT", "milan": "IT", "venice": "IT", "florence": "IT", "naples": "IT",
  "barcelona": "ES", "madrid": "ES", "seville": "ES", "malaga": "ES", "valencia": "ES",
  "berlin": "DE", "munich": "DE", "hamburg": "DE", "frankfurt": "DE",
  "amsterdam": "NL", "rotterdam": "NL",
  "bangkok": "TH", "phuket": "TH", "chiang mai": "TH", "pattaya": "TH",
  "sydney": "AU", "melbourne": "AU", "brisbane": "AU", "perth": "AU",
  "toronto": "CA", "vancouver": "CA", "montreal": "CA",
  "singapore": "SG",
  "hong kong": "HK",
  "istanbul": "TR", "antalya": "TR",
  "lisbon": "PT", "porto": "PT",
  "athens": "GR", "santorini": "GR",
  "vienna": "AT", "salzburg": "AT",
  "prague": "CZ",
  "budapest": "HU",
  "zurich": "CH", "geneva": "CH",
  "dublin": "IE",
  "brussels": "BE",
  "copenhagen": "DK",
  "stockholm": "SE",
  "oslo": "NO",
  "helsinki": "FI",
  "warsaw": "PL", "krakow": "PL",
  "cairo": "EG",
  "marrakech": "MA", "casablanca": "MA",
  "mumbai": "IN", "delhi": "IN", "goa": "IN", "jaipur": "IN", "bangalore": "IN",
  "bali": "ID", "jakarta": "ID",
  "kuala lumpur": "MY",
  "manila": "PH", "cebu": "PH",
  "hanoi": "VN", "ho chi minh": "VN",
  "seoul": "KR", "busan": "KR",
  "beijing": "CN", "shanghai": "CN",
  "rio de janeiro": "BR", "sao paulo": "BR",
  "buenos aires": "AR",
  "mexico city": "MX", "cancun": "MX", "playa del carmen": "MX",
  "cape town": "ZA", "johannesburg": "ZA",
  "nairobi": "KE", "mombasa": "KE",
  "doha": "QA",
  "muscat": "OM",
  "riyadh": "SA", "jeddah": "SA",
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "france": "FR", "uk": "GB", "united kingdom": "GB", "england": "GB", "usa": "US",
  "united states": "US", "japan": "JP", "uae": "AE", "italy": "IT", "spain": "ES",
  "germany": "DE", "netherlands": "NL", "thailand": "TH", "australia": "AU",
  "canada": "CA", "singapore": "SG", "turkey": "TR", "portugal": "PT",
  "greece": "GR", "austria": "AT", "czech republic": "CZ", "hungary": "HU",
  "switzerland": "CH", "ireland": "IE", "belgium": "BE", "denmark": "DK",
  "sweden": "SE", "norway": "NO", "finland": "FI", "poland": "PL", "egypt": "EG",
  "morocco": "MA", "india": "IN", "indonesia": "ID", "malaysia": "MY",
  "philippines": "PH", "vietnam": "VN", "south korea": "KR", "korea": "KR",
  "china": "CN", "brazil": "BR", "argentina": "AR", "mexico": "MX",
  "south africa": "ZA", "kenya": "KE", "qatar": "QA", "oman": "OM",
  "saudi arabia": "SA", "hong kong": "HK",
};

function resolveDestination(destination: string): { cityName: string; countryCode: string } {
  const parts = destination.split(",").map(p => p.trim());
  
  if (parts.length >= 2) {
    const city = parts[0];
    const countryPart = parts[parts.length - 1].toLowerCase();
    const countryCode = countryPart.length === 2
      ? countryPart.toUpperCase()
      : COUNTRY_NAME_TO_CODE[countryPart] || "";
    if (countryCode) {
      return { cityName: city, countryCode };
    }
  }
  
  const cityLower = destination.toLowerCase().trim();
  const countryCode = CITY_COUNTRY_MAP[cityLower];
  if (countryCode) {
    return { cityName: destination, countryCode };
  }

  return { cityName: destination, countryCode: "" };
}

const FEATURED_CITIES: { cityName: string; countryCode: string; limit: number }[] = [
  { cityName: "New York", countryCode: "US", limit: 10 },
  { cityName: "Miami", countryCode: "US", limit: 10 },
  { cityName: "Las Vegas", countryCode: "US", limit: 8 },
  { cityName: "Los Angeles", countryCode: "US", limit: 8 },
  { cityName: "Chicago", countryCode: "US", limit: 8 },
  { cityName: "San Francisco", countryCode: "US", limit: 8 },
  { cityName: "Paris", countryCode: "FR", limit: 6 },
  { cityName: "Dubai", countryCode: "AE", limit: 6 },
  { cityName: "London", countryCode: "GB", limit: 6 },
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.hotels.featured.path, async (req, res) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const defaultCheckIn = fmt(tomorrow);
      const defaultCheckOut = fmt(dayAfter);

      const results: any[] = [];
      await Promise.all(
        FEATURED_CITIES.map(async ({ cityName, countryCode, limit }) => {
          try {
            const data = await liteApiGet("/data/hotels", {
              cityName,
              countryCode,
              limit: String(limit),
              offset: "0",
            });
            const hotels = data?.data || [];
            const scored = hotels
              .map((h: any) => ({
                id: h.id,
                name: h.name || "Hotel",
                address: [h.address, h.city, h.country].filter(Boolean).join(", "),
                city: cityName,
                stars: h.stars ? parseFloat(String(h.stars)) : null,
                rating: h.rating ? parseFloat(String(h.rating)) : null,
                reviewCount: h.reviews_total || h.reviewCount || null,
                price: null as number | null,
                imageUrl: h.main_photo || h.thumbnail || null,
              }))
              .filter((h: any) => h.rating !== null && h.rating >= 8.0 && (h.reviewCount == null || h.reviewCount >= 50))
              .sort((a: any, b: any) => {
                const scoreA = (a.rating ?? 0) * 2 + (a.stars ?? 0) * 0.5;
                const scoreB = (b.rating ?? 0) * 2 + (b.stars ?? 0) * 0.5;
                return scoreB - scoreA;
              })
              .slice(0, limit);
            results.push(...scored);
          } catch {
          }
        })
      );

      // Fetch rates for all hotels using default dates (tomorrow, 1 night)
      try {
        const hotelIds = results.map((h: any) => h.id);
        const BATCH = 20;
        const priceMap = new Map<string, number>();
        for (let i = 0; i < hotelIds.length; i += BATCH) {
          const batch = hotelIds.slice(i, i + BATCH);
          try {
            const ratesData = await liteApiPost("/hotels/rates", {
              hotelIds: batch,
              checkin: defaultCheckIn,
              checkout: defaultCheckOut,
              currency: "USD",
              guestNationality: "US",
              occupancies: [{ rooms: 1, adults: 2, children: [] }],
            });
            if (ratesData?.data) {
              for (const hotel of ratesData.data) {
                if (hotel.roomTypes?.length > 0) {
                  const prices = hotel.roomTypes
                    .map((rt: any) => rt.offerRetailRate?.amount)
                    .filter((p: any) => p && !isNaN(p));
                  if (prices.length > 0) {
                    priceMap.set(hotel.hotelId, Math.min(...prices));
                  }
                }
              }
            }
          } catch { }
        }
        for (const hotel of results) {
          hotel.price = priceMap.get(hotel.id) ?? null;
        }
      } catch { }

      results.sort((a: any, b: any) => {
        const scoreA = (a.rating ?? 0) * 2 + (a.stars ?? 0) * 0.5 + Math.min((a.reviewCount ?? 0) / 2000, 0.5);
        const scoreB = (b.rating ?? 0) * 2 + (b.stars ?? 0) * 0.5 + Math.min((b.reviewCount ?? 0) / 2000, 0.5);
        return scoreB - scoreA;
      });

      res.json(results);
    } catch (err: any) {
      console.error("Featured hotels error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch featured hotels" });
    }
  });

  app.get(api.hotels.nearby.path, async (req, res) => {
    try {
      const { lat, lng } = req.query as Record<string, string>;
      if (!lat || !lng) {
        return res.status(400).json({ message: "lat and lng are required" });
      }

      // Reverse geocode coordinates -> city + country using Nominatim (free, no key needed)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "User-Agent": "Luxvibe/1.0 (hotel booking app)" } }
      );
      const geoData = await geoRes.json();
      const addr = geoData?.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.county || "";
      const countryCode = addr.country_code?.toUpperCase() || "US";

      if (!cityName) {
        return res.json([]);
      }

      console.log(`[nearby] Resolved coords (${lat},${lng}) -> ${cityName}, ${countryCode}`);

      const hotelsData = await liteApiGet("/data/hotels", {
        cityName,
        countryCode,
        limit: "20",
        offset: "0",
      });

      const hotelsList: any[] = hotelsData?.data || [];
      if (hotelsList.length === 0) return res.json([]);

      const nearby = hotelsList
        .map((h: any) => ({
          id: h.id,
          name: h.name || "Hotel",
          address: [h.address, h.city, h.country].filter(Boolean).join(", "),
          city: h.city || cityName,
          stars: h.stars ? parseFloat(String(h.stars)) : null,
          rating: h.rating ? parseFloat(String(h.rating)) : null,
          reviewCount: h.reviews_total || h.reviewCount || null,
          price: null as number | null,
          imageUrl: h.main_photo || h.thumbnail || null,
        }))
        .filter((h: any) => h.rating !== null)
        .sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));

      // Fetch rates using default dates
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        const hotelIds = nearby.map((h: any) => h.id);
        const ratesData = await liteApiPost("/hotels/rates", {
          hotelIds,
          checkin: fmt(tomorrow),
          checkout: fmt(dayAfter),
          currency: "USD",
          guestNationality: "US",
          occupancies: [{ rooms: 1, adults: 2, children: [] }],
        });
        if (ratesData?.data) {
          const priceMap = new Map<string, number>();
          for (const hotel of ratesData.data) {
            if (hotel.roomTypes?.length > 0) {
              const prices = hotel.roomTypes
                .map((rt: any) => rt.offerRetailRate?.amount)
                .filter((p: any) => p && !isNaN(p));
              if (prices.length > 0) priceMap.set(hotel.hotelId, Math.min(...prices));
            }
          }
          for (const hotel of nearby) hotel.price = priceMap.get(hotel.id) ?? null;
        }
      } catch { }

      res.json(nearby);
    } catch (err: any) {
      console.error("Nearby hotels error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch nearby hotels" });
    }
  });

  app.get("/api/places", async (req, res) => {
    try {
      const { q } = req.query as Record<string, string>;
      if (!q) return res.json([]);
      const data = await liteApiGet("/data/places", { textQuery: q });
      const places = (data?.data || []).map((p: any) => ({
        placeId: p.placeId,
        displayName: p.name,
      }));
      res.json(places);
    } catch (err: any) {
      console.error("Places API error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch places" });
    }
  });

  app.get(api.hotels.search.path, async (req, res) => {
    try {
      const { destination, placeId, aiSearch, checkIn, checkOut, guests } = req.query as Record<string, string>;

      if ((!destination && !placeId && !aiSearch) || !checkIn || !checkOut) {
        return res.status(400).json({ message: "destination/placeId/aiSearch, checkIn, checkOut are required" });
      }

      const guestCount = parseInt(guests || "2");

      let hotelIds: string[] = [];
      let hotelsMetadata: any[] = [];

      if (aiSearch) {
        const ratesData = await liteApiPost("/hotels/rates", {
          aiSearch,
          checkin: checkIn,
          checkout: checkOut,
          currency: "USD",
          guestNationality: "US",
          occupancies: [{ rooms: 1, adults: guestCount, children: [] }],
        });

        if (!ratesData?.data || ratesData.data.length === 0) {
          return res.json([]);
        }

        const hotelsInfo = ratesData.hotels || [];
        const hotelsInfoMap = new Map(hotelsInfo.map((h: any) => [h.id, h]));

        const results = ratesData.data.map((hotelRate: any) => {
          const h = (hotelsInfoMap.get(hotelRate.hotelId) || {}) as any;
          const firstRoom = hotelRate.roomTypes?.[0];
          const price = firstRoom?.offerRetailRate?.amount || 0;

          return {
            id: hotelRate.hotelId,
            name: h.name || "Hotel",
            address: [h.address, h.city, h.country].filter(Boolean).join(", "),
            stars: h.stars ? parseFloat(String(h.stars)) : null,
            rating: h.rating ? parseFloat(String(h.rating)) : null,
            reviewCount: h.reviews_total || h.reviewCount || null,
            price: price,
            imageUrl: h.main_photo || h.thumbnail || null,
          };
        }).filter((h: any) => h.price > 0);

        return res.json(results);
      }

      if (placeId) {
        const hotelsData = await liteApiGet("/data/hotels", {
          placeId,
          limit: "20",
          offset: "0",
        });
        hotelsMetadata = hotelsData?.data || [];
      } else if (destination) {
        const resolved = resolveDestination(destination);
        if (!resolved.countryCode) {
          return res.status(400).json({ message: "Could not determine the country. Try adding the country, e.g. 'Paris, France'." });
        }
        const hotelsData = await liteApiGet("/data/hotels", {
          cityName: resolved.cityName,
          countryCode: resolved.countryCode,
          limit: "20",
          offset: "0",
        });
        hotelsMetadata = hotelsData?.data || [];
      }

      if (hotelsMetadata.length === 0) {
        return res.json([]);
      }

      hotelIds = hotelsMetadata.slice(0, 20).map((h: any) => h.id);
      let ratesMap = new Map<string, number>();

      try {
        const ratesData = await liteApiPost("/hotels/rates", {
          hotelIds,
          checkin: checkIn,
          checkout: checkOut,
          currency: "USD",
          guestNationality: "US",
          occupancies: [{ rooms: 1, adults: guestCount, children: [] }],
        });

        if (ratesData?.data) {
          for (const hotel of ratesData.data) {
            if (hotel.roomTypes && hotel.roomTypes.length > 0) {
              const prices = hotel.roomTypes
                .map((rt: any) => rt.offerRetailRate?.amount)
                .filter((p: any) => p && !isNaN(p));
              if (prices.length > 0) {
                ratesMap.set(hotel.hotelId, Math.min(...prices));
              }
            }
          }
        }
      } catch (rateErr) {
        console.error("Rates fetch failed, returning hotels without prices:", rateErr);
      }

      const results = hotelsMetadata.map((h: any) => ({
        id: h.id,
        name: h.name || "Hotel",
        address: [h.address, h.city, h.country].filter(Boolean).join(", "),
        stars: h.stars ? parseFloat(String(h.stars)) : null,
        rating: h.rating ? parseFloat(String(h.rating)) : null,
        reviewCount: h.reviews_total || h.reviewCount || null,
        price: ratesMap.get(h.id) || 0,
        imageUrl: h.main_photo || h.thumbnail || null,
      }));

      const withRates = results.filter((h: any) => h.price > 0);
      res.json(withRates.length > 0 ? withRates : results);
    } catch (err: any) {
      console.error("Hotel search error:", err?.message || err);
      res.status(500).json({ message: "Failed to search hotels" });
    }
  });

  app.get(api.hotels.get.path, async (req, res) => {
    try {
      const hotelId = req.params.id;
      const { checkIn, checkOut, guests } = req.query as Record<string, string>;

      const hotelsData = await liteApiGet("/data/hotel", { hotelId });
      const hotelRaw = hotelsData?.data?.[0] ?? hotelsData?.data;
      if (!hotelRaw) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const images: string[] = [];
      if (hotelRaw.hotelImages && Array.isArray(hotelRaw.hotelImages)) {
        const sorted = [...hotelRaw.hotelImages].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        for (const img of sorted) {
          const url = img.urlHd || img.url;
          if (url && !images.includes(url)) images.push(url);
        }
      }
      if (hotelRaw.main_photo && !images.includes(hotelRaw.main_photo)) images.push(hotelRaw.main_photo);
      if (hotelRaw.thumbnail && !images.includes(hotelRaw.thumbnail)) images.push(hotelRaw.thumbnail);
      if (images.length === 0) {
        images.push("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80");
      }

      // Extract room info (with photos) from hotel data
      const rooms: any[] = (hotelRaw.rooms || []).map((r: any) => ({
        id: String(r.id),
        name: r.name || "Room",
        photos: (r.photos || []).map((p: any) => ({ url: p.url || p })),
      }));

      const facilityMap: Record<number, string> = {
        1: "Parking", 8: "Restaurant", 91: "Fitness Center", 107: "24-hour Front Desk",
        124: "Laundry", 491: "Free WiFi", 502: "Airport Shuttle", 509: "Spa",
        519: "Pool", 526: "Bar", 533: "Room Service", 535: "Non-Smoking Rooms",
        564: "Business Center", 581: "Elevator", 595: "Air Conditioning",
        626: "Currency Exchange", 678: "Luggage Storage", 691: "Concierge",
        692: "Daily Housekeeping", 804: "Breakfast", 805: "Family Rooms", 806: "Accessible",
        1869: "Pet Friendly", 1979: "EV Charging",
      };

      const amenities: string[] = [];
      if (hotelRaw.facilityIds && Array.isArray(hotelRaw.facilityIds)) {
        for (const fid of hotelRaw.facilityIds) {
          const name = facilityMap[fid];
          if (name) amenities.push(name);
        }
      }
      if (amenities.length === 0) {
        amenities.push("Contact hotel for amenities");
      }

      const description = hotelRaw.hotelDescription
        ? stripHtml(hotelRaw.hotelDescription)
        : `Welcome to ${hotelRaw.name}. Enjoy your stay in ${hotelRaw.city || "this beautiful destination"}.`;

      // Fetch room rates
      let roomTypes: any[] = [];
      if (checkIn && checkOut) {
        const guestCount = parseInt(guests || "2");
        try {
          const ratesData = await liteApiPost("/hotels/rates", {
            hotelIds: [hotelId],
            checkin: checkIn,
            checkout: checkOut,
            currency: "USD",
            guestNationality: "US",
            occupancies: [{ rooms: 1, adults: guestCount, children: [] }],
          });

          const rawRoomTypes: any[] = ratesData?.data?.[0]?.roomTypes || [];
          for (const rt of rawRoomTypes) {
            if (roomTypes.length >= 15) break;
            const rate = rt.rates?.[0];
            const price = rt.offerRetailRate?.amount || rate?.retailRate?.total?.[0]?.amount || 0;
            const currency = rt.offerRetailRate?.currency || rate?.retailRate?.total?.[0]?.currency || "USD";
            const cancellationPolicies = rate?.cancellationPolicies || [];
            const cancellationPolicy = cancellationPolicies.length > 0
              ? `Cancel by ${cancellationPolicies[0]?.cancelTime?.split("T")[0] || "check-in"}`
              : undefined;

            roomTypes.push({
              offerId: rt.offerId,
              mappedRoomId: rt.mappedRoomId || rt.offerId,
              name: rt.name || rate?.name || "Room",
              boardName: rate?.boardName || "Room Only",
              price: typeof price === "number" ? price : parseFloat(String(price)) || 0,
              currency,
              refundableTag: rate?.refundableTag || undefined,
              cancellationPolicy,
            });
          }
        } catch (rateErr) {
          console.error("Rates fetch for hotel details failed:", rateErr);
        }
      }

      res.json({
        id: hotelRaw.id,
        name: hotelRaw.name || "Hotel",
        address: [hotelRaw.address, hotelRaw.city, hotelRaw.country].filter(Boolean).join(", "),
        city: hotelRaw.city || null,
        countryCode: hotelRaw.countryCode || null,
        description,
        stars: hotelRaw.stars ? parseFloat(String(hotelRaw.stars)) : null,
        rating: hotelRaw.rating ? parseFloat(String(hotelRaw.rating)) : null,
        reviewCount: hotelRaw.reviews_total || null,
        checkinTime: hotelRaw.checkinCheckoutTimes?.checkin_start || null,
        checkoutTime: hotelRaw.checkinCheckoutTimes?.checkout || null,
        images,
        amenities,
        rooms,
        roomTypes,
      });
    } catch (err: any) {
      console.error("Hotel details error:", err?.message || err);
      res.status(500).json({ message: "Failed to get hotel details" });
    }
  });

  app.get("/api/hotels/:id/reviews", async (req, res) => {
    try {
      const hotelId = req.params.id;
      const reviewsData = await liteApiGet("/data/reviews", { hotelId, limit: 10 });
      const raw: any[] = Array.isArray(reviewsData?.data) ? reviewsData.data : [];
      res.json(raw.map((r: any) => ({
        name: r.name || "Guest",
        score: typeof r.averageScore === "number" ? r.averageScore : null,
        type: r.type?.replace(/review category /i, "") || null,
        date: r.date ? r.date.split(" ")[0] : null,
        headline: r.headline || null,
        pros: r.pros || null,
        cons: r.cons || null,
        source: r.source || null,
        country: r.country || null,
      })));
    } catch (err: any) {
      console.error("Reviews error:", err?.message || err);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.get(api.hotels.similar.path, async (req, res) => {
    try {
      const hotelId = req.params.id;
      const hotelData = await liteApiGet("/data/hotel", { hotelId });
      const hotelRaw = hotelData?.data?.[0] ?? hotelData?.data;
      if (!hotelRaw?.city || !hotelRaw?.countryCode) {
        return res.json([]);
      }
      const cityHotels = await liteApiGet("/data/hotels", {
        cityName: hotelRaw.city,
        countryCode: hotelRaw.countryCode,
        limit: "10",
        offset: "0",
      });
      const list = (cityHotels?.data || []).filter((h: any) => h.id !== hotelId).slice(0, 5);
      const FALLBACK_IMAGES = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
      ];
      const results = list.map((h: any, i: number) => ({
        id: h.id,
        name: h.name || "Hotel",
        address: [h.address, h.city, h.country].filter(Boolean).join(", "),
        stars: h.stars ? parseFloat(String(h.stars)) : null,
        rating: h.rating ? parseFloat(String(h.rating)) : null,
        reviewCount: h.reviews_total || null,
        price: null,
        imageUrl: h.main_photo || h.thumbnail || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
      }));
      res.json(results);
    } catch (err: any) {
      console.error("Similar hotels error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch similar hotels" });
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

  app.post(api.hotels.prebook.path, async (req, res) => {
    try {
      const { offerId } = api.hotels.prebook.input.parse(req.body);
      const data = await liteApiPost("/rates/prebook", {
        usePaymentSdk: true,
        offerId
      }, LITEAPI_BOOK_BASE);

      if (data.error) {
        return res.status(400).json({ message: data.error });
      }

      const apiKey = process.env.LITEAPI_KEY || "";
      const paymentEnv = apiKey.startsWith("prod_") ? "live" : "sandbox";
      const inner = data.data || data;
      res.json({ ...inner, paymentEnv });
    } catch (err: any) {
      console.error("Prebook error:", err?.message || err);
      res.status(400).json({ message: err?.message || "Failed to prebook" });
    }
  });

  app.post(api.hotels.book.path, async (req, res) => {
    try {
      const { prebookId, transactionId, firstName, lastName, email, phone } = api.hotels.book.input.parse(req.body);
      const data = await liteApiPost("/rates/book", {
        prebookId,
        holder: { firstName, lastName, email, phone },
        payment: {
          method: "TRANSACTION_ID",
          transactionId
        },
        guests: [{
          occupancyNumber: 1,
          firstName,
          lastName,
          email
        }]
      }, LITEAPI_BOOK_BASE);

      if (data.error) {
        return res.status(400).json({ message: data.error });
      }

      res.json(data.data || data);
    } catch (err: any) {
      console.error("Book error:", err?.message || err);
      res.status(400).json({ message: err?.message || "Failed to book" });
    }
  });

  return httpServer;
}

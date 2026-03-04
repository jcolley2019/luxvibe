import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import Anthropic from "@anthropic-ai/sdk";

const LITEAPI_BASE = "https://api.liteapi.travel/v3.0";
const LITEAPI_BOOK_BASE = "https://book.liteapi.travel/v3.0";

class ApiCache {
  private cache = new Map<string, { value: any; expiry: number }>();

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: any, ttlMs: number) {
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }
}

const apiCache = new ApiCache();
const geocodeCache = new ApiCache();

async function geocodeHotel(name: string, city: string, countryCode: string): Promise<{ lat: number; lng: number } | null> {
  const key = `geocode_${name}_${city}_${countryCode}`;
  const cached = geocodeCache.get(key);
  if (cached !== null) return cached;

  try {
    const query = encodeURIComponent(`${name}, ${city}, ${countryCode}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Luxvibe/1.0 (hotel-booking-app)" },
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json() as any[];
    if (data?.length > 0 && data[0].lat && data[0].lon) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(key, result, 86400000); // 24h cache
      return result;
    }
    geocodeCache.set(key, null, 3600000); // 1h negative cache
    return null;
  } catch {
    return null;
  }
}

async function liteApiGet(path: string, params?: Record<string, string>, ttlMs?: number) {
  const url = new URL(`${LITEAPI_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  const cacheKey = url.toString();
  if (ttlMs) {
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(url.toString(), {
    headers: {
      "accept": "application/json",
      "X-API-Key": process.env.LITEAPI_KEY!,
    },
  });
  const data = await res.json();

  if (ttlMs && res.ok) {
    apiCache.set(cacheKey, data, ttlMs);
  }

  return data;
}

async function liteApiPost(path: string, body: any, baseUrl: string = LITEAPI_BASE, ttlMs?: number) {
  const cacheKey = `${baseUrl}${path}:${JSON.stringify(body)}`;
  if (ttlMs) {
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;
  }

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

  if (ttlMs) {
    apiCache.set(cacheKey, data, ttlMs);
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
      const { currency = "USD", guestNationality = "US" } = req.query as Record<string, string>;
      const cacheKey = `featured_${currency}_${guestNationality}`;
      const cached = apiCache.get(cacheKey);
      if (cached) return res.json(cached);

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
              .map((h: any) => {
                const rawFacilities: any[] = h.hotelFacilities || h.facilities || [];
                const facilities: string[] = rawFacilities
                  .map((f: any) => (typeof f === "string" ? f : f.name || f.facilityName || f.description || ""))
                  .filter(Boolean)
                  .slice(0, 30);
                return {
                  id: h.id,
                  name: h.name || "Hotel",
                  address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
                  city: cityName,
                  stars: h.stars ? parseFloat(String(h.stars)) : null,
                  rating: h.rating ? parseFloat(String(h.rating)) : null,
                  reviewCount: h.reviews_total || h.reviewCount || null,
                  price: null as number | null,
                  imageUrl: h.main_photo || h.thumbnail || null,
                  facilities,
                };
              })
              .filter((h: any) => h.rating !== null && h.rating >= 8.0 && h.stars !== null && h.stars >= 4 && (h.reviewCount == null || h.reviewCount >= 50))
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
              currency,
              guestNationality,
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

      apiCache.set(cacheKey, results, 600000);
      res.json(results);
    } catch (err: any) {
      console.error("Featured hotels error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch featured hotels" });
    }
  });

  app.get("/api/hotels/las-vegas", async (req, res) => {
    try {
      const { currency = "USD", guestNationality = "US" } = req.query as Record<string, string>;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const defaultCheckIn = fmt(tomorrow);
      const defaultCheckOut = fmt(dayAfter);

      const STRIP_KEYWORDS = [
        "bellagio","mgm grand","caesars","wynn","encore","venetian","palazzo","aria","vdara",
        "mandalay bay","delano","luxor","excalibur","new york-new york","new york new york",
        "paris las vegas","bally","horseshoe","flamingo","linq","harrah","cromwell",
        "treasure island","mirage","resorts world","sahara","circus circus","westgate",
        "strat","stratosphere","virgin hotels","nobu hotel","waldorf astoria las vegas",
        "veer","park mgm","nomad","t-mobile arena","cosmopolitan","fontainebleau",
      ];

      const DOWNTOWN_KEYWORDS = [
        "golden nugget","el cortez","the d las vegas","fremont hotel","four queens",
        "binion","main street station","california hotel","plaza hotel","downtown grand",
        "circa resort","circa las vegas","lady luck","vegas vic","oyo hotel","ambassador",
        "slotzilla","container park",
      ];

      const data = await liteApiGet("/data/hotels", {
        cityName: "Las Vegas",
        countryCode: "US",
        limit: "100",
        offset: "0",
      });

      const raw: any[] = data?.data || [];
      const hotels = raw.map((h: any) => ({
        id: h.id,
        name: h.name || "Hotel",
        address: [h.address, h.city].filter(Boolean).join(", "),
        city: "Las Vegas",
        stars: h.stars ? parseFloat(String(h.stars)) : null,
        rating: h.rating ? parseFloat(String(h.rating)) : null,
        reviewCount: h.reviews_total || h.reviewCount || null,
        price: null as number | null,
        imageUrl: h.main_photo || h.thumbnail || null,
      }));

      const classify = (name: string): "strip" | "downtown" | null => {
        const lower = name.toLowerCase();
        if (STRIP_KEYWORDS.some(k => lower.includes(k))) return "strip";
        if (DOWNTOWN_KEYWORDS.some(k => lower.includes(k))) return "downtown";
        return null;
      };

      const isLuxury = (h: any) => h.stars !== null && h.stars >= 4;
      let strip = hotels.filter(h => classify(h.name) === "strip" && h.rating && h.rating >= 7.0 && isLuxury(h));
      let downtown = hotels.filter(h => classify(h.name) === "downtown" && h.rating && h.rating >= 6.5 && h.stars !== null && h.stars >= 3);

      // Sort by rating
      const score = (h: any) => (h.rating ?? 0) * 2 + (h.stars ?? 0) * 0.5;
      strip = strip.sort((a, b) => score(b) - score(a)).slice(0, 12);
      downtown = downtown.sort((a, b) => score(b) - score(a)).slice(0, 8);

      // Fetch prices
      const allHotels = [...strip, ...downtown];
      if (allHotels.length > 0) {
        try {
          const ratesData = await liteApiPost("/hotels/rates", {
            hotelIds: allHotels.map(h => h.id),
            checkin: defaultCheckIn,
            checkout: defaultCheckOut,
            currency,
            guestNationality,
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
            for (const h of allHotels) h.price = priceMap.get(h.id) ?? null;
          }
        } catch { }
      }

      res.json({ strip, downtown });
    } catch (err: any) {
      console.error("Las Vegas hotels error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch Las Vegas hotels" });
    }
  });

  app.get(api.hotels.nearby.path, async (req, res) => {
    try {
      res.set("Cache-Control", "no-store");
      const { lat, lng, currency = "USD", guestNationality = "US" } = req.query as Record<string, string>;
      if (!lat || !lng) {
        return res.status(400).json({ message: "lat and lng are required" });
      }

      const nominatimHeaders = { "User-Agent": "Luxvibe/1.0 (hotel booking app)" };

      // First try detailed reverse geocode (zoom=14 default)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: nominatimHeaders }
      );
      const geoData = await geoRes.json();
      const addr = geoData?.address || {};
      let countryCode = addr.country_code?.toUpperCase() || "US";

      // Only use real city/town/village — NOT county, as LiteAPI doesn't index by county
      let cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "";

      // If no city-level name, retry Nominatim at zoom=10 (city-level zoom)
      if (!cityName) {
        try {
          const cityGeoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
            { headers: nominatimHeaders }
          );
          const cityGeoData = await cityGeoRes.json();
          const cityAddr = cityGeoData?.address || {};
          cityName = cityAddr.city || cityAddr.town || cityAddr.village || cityAddr.suburb || cityAddr.municipality || "";
        } catch { }
      }

      console.log(`[nearby] Resolved coords (${lat},${lng}) -> "${cityName}", ${countryCode}`);

      const KNOWN_CITIES = [
        // Pacific Coast
        { cityName: "Seattle", countryCode: "US", lat: 47.6062, lng: -122.3321 },
        { cityName: "Portland", countryCode: "US", lat: 45.5051, lng: -122.6750 },
        { cityName: "San Francisco", countryCode: "US", lat: 37.7749, lng: -122.4194 },
        { cityName: "Los Angeles", countryCode: "US", lat: 34.0522, lng: -118.2437 },
        { cityName: "San Diego", countryCode: "US", lat: 32.7157, lng: -117.1611 },
        // Pacific Northwest / Mountain
        { cityName: "Boise", countryCode: "US", lat: 43.6150, lng: -116.2023 },
        { cityName: "Salt Lake City", countryCode: "US", lat: 40.7608, lng: -111.8910 },
        { cityName: "Denver", countryCode: "US", lat: 39.7392, lng: -104.9903 },
        { cityName: "Las Vegas", countryCode: "US", lat: 36.1699, lng: -115.1398 },
        { cityName: "Phoenix", countryCode: "US", lat: 33.4484, lng: -112.0740 },
        { cityName: "Tucson", countryCode: "US", lat: 32.2226, lng: -110.9747 },
        { cityName: "Albuquerque", countryCode: "US", lat: 35.0844, lng: -106.6504 },
        // Midwest
        { cityName: "Minneapolis", countryCode: "US", lat: 44.9778, lng: -93.2650 },
        { cityName: "Chicago", countryCode: "US", lat: 41.8781, lng: -87.6298 },
        { cityName: "Detroit", countryCode: "US", lat: 42.3314, lng: -83.0458 },
        { cityName: "Milwaukee", countryCode: "US", lat: 43.0389, lng: -87.9065 },
        { cityName: "Kansas City", countryCode: "US", lat: 39.0997, lng: -94.5786 },
        { cityName: "St. Louis", countryCode: "US", lat: 38.6270, lng: -90.1994 },
        { cityName: "Indianapolis", countryCode: "US", lat: 39.7684, lng: -86.1581 },
        { cityName: "Columbus", countryCode: "US", lat: 39.9612, lng: -82.9988 },
        { cityName: "Cincinnati", countryCode: "US", lat: 39.1031, lng: -84.5120 },
        // South / Southwest
        { cityName: "Dallas", countryCode: "US", lat: 32.7767, lng: -96.7970 },
        { cityName: "Houston", countryCode: "US", lat: 29.7604, lng: -95.3698 },
        { cityName: "San Antonio", countryCode: "US", lat: 29.4241, lng: -98.4936 },
        { cityName: "Austin", countryCode: "US", lat: 30.2672, lng: -97.7431 },
        { cityName: "New Orleans", countryCode: "US", lat: 29.9511, lng: -90.0715 },
        { cityName: "Atlanta", countryCode: "US", lat: 33.7490, lng: -84.3880 },
        { cityName: "Nashville", countryCode: "US", lat: 36.1627, lng: -86.7816 },
        { cityName: "Memphis", countryCode: "US", lat: 35.1495, lng: -90.0490 },
        { cityName: "Charlotte", countryCode: "US", lat: 35.2271, lng: -80.8431 },
        { cityName: "Raleigh", countryCode: "US", lat: 35.7796, lng: -78.6382 },
        { cityName: "Miami", countryCode: "US", lat: 25.7617, lng: -80.1918 },
        { cityName: "Orlando", countryCode: "US", lat: 28.5383, lng: -81.3792 },
        { cityName: "Tampa", countryCode: "US", lat: 27.9506, lng: -82.4572 },
        // Northeast
        { cityName: "New York", countryCode: "US", lat: 40.7128, lng: -74.0060 },
        { cityName: "Philadelphia", countryCode: "US", lat: 39.9526, lng: -75.1652 },
        { cityName: "Washington", countryCode: "US", lat: 38.9072, lng: -77.0369 },
        { cityName: "Baltimore", countryCode: "US", lat: 39.2904, lng: -76.6122 },
        { cityName: "Boston", countryCode: "US", lat: 42.3601, lng: -71.0589 },
        { cityName: "Pittsburgh", countryCode: "US", lat: 40.4406, lng: -79.9959 },
        { cityName: "Cleveland", countryCode: "US", lat: 41.4993, lng: -81.6944 },
        // International
        { cityName: "Paris", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
        { cityName: "London", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
        { cityName: "Dubai", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
        { cityName: "Tokyo", countryCode: "JP", lat: 35.6762, lng: 139.6503 },
        { cityName: "Barcelona", countryCode: "ES", lat: 41.3851, lng: 2.1734 },
        { cityName: "Rome", countryCode: "IT", lat: 41.9028, lng: 12.4964 },
      ];
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const geoDistSq = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
        Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2);
      const sortedFallbacks = KNOWN_CITIES.slice().sort((a, b) =>
        geoDistSq({ lat: userLat, lng: userLng }, a) - geoDistSq({ lat: userLat, lng: userLng }, b)
      );

      const MIN_NEARBY = 20;
      const MAX_NEARBY = 24;

      // Helper to fetch and normalise hotels for a city
      const fetchHotelsForCity = async (city: string, country: string, displayCity?: string) => {
        const data = await liteApiGet("/data/hotels", {
          cityName: city,
          countryCode: country,
          limit: "50",
          offset: "0",
        });
        return ((data?.data || []) as any[]).map((h: any) => {
          const rawFacilities: any[] = h.hotelFacilities || h.facilities || [];
          const facilities: string[] = rawFacilities
            .map((f: any) => (typeof f === "string" ? f : f.name || f.facilityName || f.description || ""))
            .filter(Boolean)
            .slice(0, 30);
          return {
            id: h.id,
            name: h.name || "Hotel",
            address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
            city: displayCity || h.city || city,
            stars: h.stars ? parseFloat(String(h.stars)) : null,
            rating: h.rating ? parseFloat(String(h.rating)) : null,
            reviewCount: h.reviews_total || h.reviewCount || null,
            price: null as number | null,
            imageUrl: h.main_photo || h.thumbnail || null,
            facilities,
          };
        }).filter((h: any) => h.stars !== null && h.stars >= 3);
      };

      const seenIds = new Set<string>();
      const mergeHotels = (list: any[], incoming: any[]) => {
        for (const h of incoming) {
          if (!seenIds.has(h.id)) {
            seenIds.add(h.id);
            list.push(h);
          }
        }
      };

      let hotelsList: any[] = [];

      // Try geocoded city first (if we got one)
      if (cityName) {
        const primary = await fetchHotelsForCity(cityName, countryCode);
        mergeHotels(hotelsList, primary);

        // If few hotels found, try zoom=8 (region level) for a bigger city name
        if (hotelsList.length < MIN_NEARBY) {
          try {
            const regionRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=8`,
              { headers: nominatimHeaders }
            );
            const regionData = await regionRes.json();
            const regionAddr = regionData?.address || {};
            const fallbackCity = regionAddr.city || regionAddr.town || regionAddr.village || regionAddr.state_district || "";
            if (fallbackCity && fallbackCity !== cityName) {
              console.log(`[nearby] Fallback city from zoom=8: ${fallbackCity}`);
              const regionHotels = await fetchHotelsForCity(fallbackCity, countryCode);
              mergeHotels(hotelsList, regionHotels);
            }
          } catch { }
        }
      }

      // Keep pulling from nearest known cities until we have MIN_NEARBY
      for (const city of sortedFallbacks) {
        if (hotelsList.length >= MIN_NEARBY) break;
        try {
          console.log(`[nearby] Supplementing from: ${city.cityName}`);
          const extra = await fetchHotelsForCity(city.cityName, city.countryCode);
          mergeHotels(hotelsList, extra);
        } catch { }
      }

      if (hotelsList.length === 0) return res.json([]);

      // Sort: prefer 4+ stars first, then by rating, cap at MAX_NEARBY
      const nearby = hotelsList
        .sort((a: any, b: any) => {
          const starsA = (a.stars ?? 0) >= 4 ? 1 : 0;
          const starsB = (b.stars ?? 0) >= 4 ? 1 : 0;
          if (starsB !== starsA) return starsB - starsA;
          return (b.rating ?? 0) - (a.rating ?? 0);
        })
        .slice(0, MAX_NEARBY);

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
          currency,
          guestNationality,
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

  // Map country names/abbreviations to ISO 2-letter codes
  const COUNTRY_CODE_MAP: Record<string, string> = {
    "USA": "US", "US": "US", "United States": "US",
    "UK": "GB", "GB": "GB", "United Kingdom": "GB", "England": "GB",
    "France": "FR", "FR": "FR",
    "Germany": "DE", "DE": "DE",
    "Spain": "ES", "ES": "ES",
    "Italy": "IT", "IT": "IT",
    "UAE": "AE", "AE": "AE", "United Arab Emirates": "AE",
    "Australia": "AU", "AU": "AU",
    "Canada": "CA", "CA": "CA",
    "Japan": "JP", "JP": "JP",
    "Mexico": "MX", "MX": "MX",
    "Thailand": "TH", "TH": "TH",
    "Singapore": "SG", "SG": "SG",
    "India": "IN", "IN": "IN",
    "Netherlands": "NL", "NL": "NL",
    "Portugal": "PT", "PT": "PT",
    "Greece": "GR", "GR": "GR",
    "Turkey": "TR", "TR": "TR",
    "Brazil": "BR", "BR": "BR",
    "Switzerland": "CH", "CH": "CH",
    "Austria": "AT", "AT": "AT",
    "Belgium": "BE", "BE": "BE",
    "Sweden": "SE", "SE": "SE",
    "Norway": "NO", "NO": "NO",
    "Denmark": "DK", "DK": "DK",
    "Poland": "PL", "PL": "PL",
    "Czech Republic": "CZ", "Czechia": "CZ", "CZ": "CZ",
    "Croatia": "HR", "HR": "HR",
    "Indonesia": "ID", "ID": "ID",
    "Malaysia": "MY", "MY": "MY",
    "Vietnam": "VN", "VN": "VN",
    "Philippines": "PH", "PH": "PH",
    "South Korea": "KR", "Korea": "KR", "KR": "KR",
    "Israel": "IL", "IL": "IL",
    "Morocco": "MA", "MA": "MA",
    "Egypt": "EG", "EG": "EG",
    "South Africa": "ZA", "ZA": "ZA",
    "New Zealand": "NZ", "NZ": "NZ",
    "Ireland": "IE", "IE": "IE",
    "Saudi Arabia": "SA", "SA": "SA",
    "Qatar": "QA", "QA": "QA",
    "Bahrain": "BH", "BH": "BH",
    "Kuwait": "KW", "KW": "KW",
    "Oman": "OM", "OM": "OM",
    "Jordan": "JO", "JO": "JO",
    "Argentina": "AR", "AR": "AR",
    "Colombia": "CO", "CO": "CO",
    "Chile": "CL", "CL": "CL",
    "Peru": "PE", "PE": "PE",
  };

  function extractCountryCode(formattedAddress: string): string | null {
    if (!formattedAddress) return null;
    const parts = formattedAddress.split(",").map((p: string) => p.trim());
    for (let i = parts.length - 1; i >= 0; i--) {
      const code = COUNTRY_CODE_MAP[parts[i]];
      if (code) return code;
    }
    return null;
  }

  app.get("/api/places", async (req, res) => {
    try {
      const { q } = req.query as Record<string, string>;
      if (!q) return res.json([]);

      // Step 1: Get place suggestions from LiteAPI (backed by Google Places)
      // Cache places for 1 hour
      const placesData = await liteApiGet("/data/places", { textQuery: q }, 3600000);
      const places = (placesData?.data || []).map((p: any) => ({
        placeId: p.placeId,
        displayName: p.displayName || p.name || p.placeId,
        formattedAddress: p.formattedAddress || "",
        types: p.types || [],
      }));

      // Step 2: Detect city + country from places results, then fetch hotels for that city
      const localityPlace = places.find((p: any) =>
        p.types.some((t: string) => ["locality", "administrative_area_level_1", "colloquial_area"].includes(t))
      );
      let hotels: any[] = [];
      if (localityPlace) {
        const countryCode = extractCountryCode(localityPlace.formattedAddress);
        if (countryCode) {
          const hotelsData = await liteApiGet("/data/hotels", {
            cityName: localityPlace.displayName,
            countryCode,
            limit: "20",
          });
          hotels = (hotelsData?.data || []).map((h: any) => ({
            placeId: `hotel:${h.id}`,
            hotelId: h.id,
            displayName: h.name,
            formattedAddress: [h.address?.line1, h.address?.city?.name]
              .filter(Boolean).join(", ") || localityPlace.displayName,
            types: ["lodging", "establishment"],
          }));
        }
      } else {
        // No city found — try hotel name search (works when user types a brand like "hilton")
        // Places API (Google) already returns hotel establishments naturally, so hotels array stays empty
        // and we rely on the places results which include lodging types
      }

      res.json([...places, ...hotels]);
    } catch (err: any) {
      console.error("Places API error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch places" });
    }
  });

  app.get(api.hotels.search.path, async (req, res) => {
    try {
      const { destination, placeId, aiSearch, checkIn, checkOut, guests, children, roomConfig, currency = "USD", guestNationality = "US" } = req.query as Record<string, string>;

      const cacheKey = `search_${destination || placeId || aiSearch}_${checkIn}_${checkOut}_${currency}_${guestNationality}`;
      const cached = apiCache.get(cacheKey);
      if (cached) return res.json(cached);

      if ((!destination && !placeId && !aiSearch) || !checkIn || !checkOut) {
        return res.status(400).json({ message: "destination/placeId/aiSearch, checkIn, checkOut are required" });
      }

      // Build occupancies from roomConfig (multi-room) or fall back to guests/children params
      let occupancies: { rooms: number; adults: number; children: number[] }[];
      if (roomConfig) {
        try {
          const parsedRooms: { adults: number; children: number }[] = JSON.parse(roomConfig);
          occupancies = parsedRooms.map(r => ({
            rooms: 1,
            adults: r.adults || 1,
            children: Array.from({ length: r.children || 0 }, () => 10),
          }));
        } catch {
          occupancies = [{ rooms: 1, adults: parseInt(guests || "2"), children: [] }];
        }
      } else {
        const guestCount = parseInt(guests || "2");
        const childCount = parseInt(children || "0");
        occupancies = [{ rooms: 1, adults: guestCount, children: Array.from({ length: childCount }, () => 10) }];
      }

      const guestCount = occupancies.reduce((s, o) => s + o.adults + o.children.length, 0);
      const childrenAges = occupancies.flatMap(o => o.children);

      let hotelIds: string[] = [];
      let hotelsMetadata: any[] = [];

      if (aiSearch) {
        const ratesData = await liteApiPost("/hotels/rates", {
          aiSearch,
          checkin: checkIn,
          checkout: checkOut,
          currency,
          guestNationality,
          occupancies,
        }, LITEAPI_BASE, 900000); // 15 minute cache

        if (!ratesData?.data || ratesData.data.length === 0) {
          return res.json([]);
        }

        // Build a price map from rates
        const rateEntries = ratesData.data as any[];
        const aiRatesMap = new Map<string, number>();
        const aiBoardCodesMap = new Map<string, string[]>();
        const aiRefundableMap = new Map<string, boolean>();
        for (const hotelRate of rateEntries) {
          const prices = (hotelRate.roomTypes || [])
            .map((rt: any) => rt.offerRetailRate?.amount)
            .filter((p: any) => p && !isNaN(p));
          if (prices.length > 0) aiRatesMap.set(hotelRate.hotelId, Math.min(...prices));
          const codes: string[] = [];
          let hasRefundable = false;
          for (const rt of hotelRate.roomTypes || []) {
            const code = rt.boardCode || rt.mealPlanCode;
            if (code && !codes.includes(code)) codes.push(code);
            if (rt.refundableTag === "RFN") hasRefundable = true;
            if (rt.cancelPolicyInfos?.some((p: any) => p.cancelTime && p.amount === 0)) hasRefundable = true;
          }
          if (codes.length) aiBoardCodesMap.set(hotelRate.hotelId, codes);
          if (hasRefundable) aiRefundableMap.set(hotelRate.hotelId, true);
        }

        // Try to get hotel metadata from the response first (hotelsInfo), then fall back to fetching by IDs
        console.log('[aiSearch] ratesData keys:', Object.keys(ratesData || {}));
        console.log('[aiSearch] sample hotelRate keys:', rateEntries[0] ? Object.keys(rateEntries[0]) : []);
        const hotelsInfo: any[] = ratesData.hotels || ratesData.hotelsInfo || [];
        let hotelsInfoMap = new Map<string, any>(hotelsInfo.map((h: any) => [h.id || h.hotelId, h]));

        // If no hotel metadata in rates response, fetch it separately
        const missingIds = rateEntries
          .filter(r => aiRatesMap.has(r.hotelId) && !hotelsInfoMap.has(r.hotelId))
          .map(r => r.hotelId);
        if (missingIds.length > 0) {
          try {
            const metaData = await liteApiGet("/data/hotels", { hotelIds: missingIds.join(","), limit: String(missingIds.length) });
            for (const h of (metaData?.data || [])) {
              hotelsInfoMap.set(h.id || h.hotelId, h);
            }
          } catch (e) {
            console.error("AI search: failed to fetch hotel metadata", e);
          }
        }

        const results = rateEntries
          .filter((hotelRate: any) => aiRatesMap.has(hotelRate.hotelId))
          .map((hotelRate: any) => {
            const h = (hotelsInfoMap.get(hotelRate.hotelId) || hotelRate) as any;
            const rawFacilities: any[] = h.hotelFacilities || h.facilities || [];
            const facilities: string[] = rawFacilities
              .map((f: any) => (typeof f === "string" ? f : f.name || f.facilityName || f.description || ""))
              .filter(Boolean)
              .slice(0, 30);

            return {
              id: hotelRate.hotelId,
              name: h.name || h.hotelName || h.hotel_name || "Hotel",
              address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
              city: h.city || "",
              stars: h.stars ? parseFloat(String(h.stars)) : null,
              rating: h.rating ? parseFloat(String(h.rating)) : null,
              reviewCount: h.reviews_total || h.reviewCount || null,
              price: aiRatesMap.get(hotelRate.hotelId) || 0,
              imageUrl: h.main_photo || h.thumbnail || null,
              distance: h.distance_from_city_center || h.distance || null,
              lat: h.location?.latitude ?? h.latitude ?? h.lat ?? null,
              lng: h.location?.longitude ?? h.longitude ?? h.lng ?? null,
              facilities,
              boardCodes: aiBoardCodesMap.get(hotelRate.hotelId) || [],
              refundable: aiRefundableMap.get(hotelRate.hotelId) || false,
            };
          });

        return res.json(results);
      }

      const METADATA_LIMIT = 100;
      const RATES_BATCH = 25;

      if (placeId) {
        const hotelsData = await liteApiGet("/data/hotels", {
          placeId,
          limit: String(METADATA_LIMIT),
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
          limit: String(METADATA_LIMIT),
          offset: "0",
        });
        hotelsMetadata = hotelsData?.data || [];
      }

      if (hotelsMetadata.length === 0) {
        return res.json([]);
      }

      // Sort by stars descending so luxury hotels are prioritised when slicing for rates
      hotelsMetadata.sort((a: any, b: any) => {
        const sa = a.stars ? parseFloat(String(a.stars)) : 0;
        const sb = b.stars ? parseFloat(String(b.stars)) : 0;
        if (sb !== sa) return sb - sa;
        const ra = a.rating ? parseFloat(String(a.rating)) : 0;
        const rb = b.rating ? parseFloat(String(b.rating)) : 0;
        return rb - ra;
      });

      hotelIds = hotelsMetadata.map((h: any) => h.id);
      let ratesMap = new Map<string, number>();
      let boardCodesMap = new Map<string, string[]>();
      let refundableMap = new Map<string, boolean>();

      // Fetch rates in parallel batches for comprehensive coverage
      try {
        const batches: string[][] = [];
        for (let i = 0; i < hotelIds.length; i += RATES_BATCH) {
          batches.push(hotelIds.slice(i, i + RATES_BATCH));
        }
        const batchResults = await Promise.all(
          batches.map(batch =>
            liteApiPost("/hotels/rates", {
              hotelIds: batch,
              checkin: checkIn,
              checkout: checkOut,
              currency,
              guestNationality,
              occupancies,
            }).catch(() => null)
          )
        );
        for (const ratesData of batchResults) {
          if (ratesData?.data) {
            for (const hotel of ratesData.data) {
              if (hotel.roomTypes && hotel.roomTypes.length > 0) {
                const prices = hotel.roomTypes
                  .map((rt: any) => rt.offerRetailRate?.amount)
                  .filter((p: any) => p && !isNaN(p));
                if (prices.length > 0) {
                  ratesMap.set(hotel.hotelId, Math.min(...prices));
                }
                // Extract board codes (meal plans) and refundable status
                const codes: string[] = [];
                let hasRefundable = false;
                for (const rt of hotel.roomTypes) {
                  const code = rt.boardCode || rt.mealPlanCode;
                  if (code && !codes.includes(code)) codes.push(code);
                  if (rt.refundableTag === "RFN") hasRefundable = true;
                  if (rt.cancelPolicyInfos?.some((p: any) => p.cancelTime && p.amount === 0)) hasRefundable = true;
                }
                if (codes.length) boardCodesMap.set(hotel.hotelId, codes);
                if (hasRefundable) refundableMap.set(hotel.hotelId, true);
              }
            }
          }
        }
      } catch (rateErr) {
        console.error("Rates fetch failed, returning hotels without prices:", rateErr);
      }

      const results = hotelsMetadata.map((h: any) => {
        const rawFacilities: any[] = h.hotelFacilities || h.facilities || [];
        const facilities: string[] = rawFacilities
          .map((f: any) => (typeof f === "string" ? f : f.name || f.facilityName || f.description || ""))
          .filter(Boolean)
          .slice(0, 30);

        return {
          id: h.id,
          name: h.name || "Hotel",
          address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
          city: h.city || "",
          stars: h.stars ? parseFloat(String(h.stars)) : null,
          rating: h.rating ? parseFloat(String(h.rating)) : null,
          reviewCount: h.reviews_total || h.reviewCount || null,
          price: ratesMap.get(h.id) || 0,
          imageUrl: h.main_photo || h.thumbnail || null,
          distance: h.distance_from_city_center || h.distance || null,
          lat: h.location?.latitude ?? h.latitude ?? h.lat ?? null,
          lng: h.location?.longitude ?? h.longitude ?? h.lng ?? null,
          facilities,
          boardCodes: boardCodesMap.get(h.id) || [],
          refundable: refundableMap.get(h.id) || false,
        };
      });

      console.log('[hotel-data-sample]', JSON.stringify(results[0], null, 2));

      // Return results immediately, geocode in background to populate next cached request
      // Only include hotels that have a valid price (fully booked / no-availability hotels are excluded)
      const finalResults = results.filter((h: any) => h.price && h.price > 0);
      apiCache.set(cacheKey, finalResults, 300000);
      res.json(finalResults);

      // Background geocoding — only runs if hotels are missing coordinates
      const needsGeocode = finalResults.filter((h: any) => h.lat === null || h.lng === null).slice(0, 30);
      if (needsGeocode.length > 0) {
        (async () => {
          const resolvedForGeocode = placeId
            ? { cityName: hotelsMetadata[0]?.city || "", countryCode: hotelsMetadata[0]?.country || "US" }
            : resolveDestination(destination || "");
          const BATCH = 5;
          let anyGeocodedSuccessfully = false;
          for (let i = 0; i < needsGeocode.length; i += BATCH) {
            const batch = needsGeocode.slice(i, i + BATCH);
            const geoResults = await Promise.all(
              batch.map(h => geocodeHotel(h.name, resolvedForGeocode.cityName, resolvedForGeocode.countryCode))
            );
            for (let j = 0; j < batch.length; j++) {
              if (geoResults[j]) {
                batch[j].lat = geoResults[j]!.lat;
                batch[j].lng = geoResults[j]!.lng;
                anyGeocodedSuccessfully = true;
              }
            }
            if (i + BATCH < needsGeocode.length) await new Promise(r => setTimeout(r, 1100));
          }
          // Update the cache with geocoded coordinates so next request has them
          if (anyGeocodedSuccessfully) {
            apiCache.set(cacheKey, finalResults, 300000);
          }
        })().catch(() => {});
      }
    } catch (err: any) {
      console.error("Hotel search error:", err?.message || err);
      res.status(500).json({ message: "Failed to search hotels" });
    }
  });

  app.get(api.hotels.get.path, async (req, res) => {
    try {
      const hotelId = req.params.id;
      const { checkIn, checkOut, guests, currency = "USD", guestNationality = "US" } = req.query as Record<string, string>;

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

      // Extract room info and build a name-based lookup for photo matching
      // (mappedRoomId from rates != rooms[].id from hotel data — different formats)
      const normalizeName = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

      // French-to-English room type word translation applied before scoring
      // Accents are folded first so "supérieure" → "superieure" before lookup
      const ACCENT_MAP: Record<string, string> = {
        "à":"a","â":"a","á":"a","ä":"a","è":"e","é":"e","ê":"e","ë":"e",
        "î":"i","ï":"i","ô":"o","ö":"o","ù":"u","û":"u","ü":"u","ç":"c","ñ":"n",
      };
      const foldAccents = (s: string) => s.replace(/[àâáäèéêëîïôöùûüçñ]/gi, c => ACCENT_MAP[c.toLowerCase()] ?? c);

      const FR_TO_EN: Record<string, string> = {
        "classique": "classic", "chambre": "room", "superieure": "superior",
        "double": "double", "simple": "single",
        "suite": "suite", "deluxe": "deluxe", "standard": "standard",
        "grand": "grand", "grande": "grand", "petit": "small", "petite": "small",
        "confort": "comfort", "privilege": "privilege",
        "prestige": "prestige", "executive": "executive", "junior": "junior",
      };
      const translateFrench = (s: string): string =>
        normalizeName(foldAccents(s)).split(" ").map(w => FR_TO_EN[w] ?? w).join(" ");

      // Photo priority scoring: bedroom photos first, bathroom second, rest after
      const BEDROOM_KEYWORDS = ["bedroom", "bed", "sleep", "king", "queen", "twin", "double", "single", "bunk", "pillow", "mattress"];
      const BATHROOM_KEYWORDS = ["bathroom", "bath", "shower", "tub", "jacuzzi", "toilet", "vanity", "washroom"];
      const sortRoomPhotos = (photos: any[]): any[] => {
        return [...photos].sort((a, b) => {
          const catA = (a.category || a.type || a.caption || "").toLowerCase();
          const catB = (b.category || b.type || b.caption || "").toLowerCase();
          const urlA = (a.url || "").toLowerCase();
          const urlB = (b.url || "").toLowerCase();
          const combA = catA + " " + urlA;
          const combB = catB + " " + urlB;
          const isBedroomA = BEDROOM_KEYWORDS.some(k => combA.includes(k)) ? 0 : (BATHROOM_KEYWORDS.some(k => combA.includes(k)) ? 1 : 2);
          const isBedroomB = BEDROOM_KEYWORDS.some(k => combB.includes(k)) ? 0 : (BATHROOM_KEYWORDS.some(k => combB.includes(k)) ? 1 : 2);
          if (isBedroomA !== isBedroomB) return isBedroomA - isBedroomB;
          return (a.order ?? a.orderNumber ?? 999) - (b.order ?? b.orderNumber ?? 999);
        });
      };

      const roomDataList: any[] = (hotelRaw.rooms || []).map((r: any) => {
        const rawAmenities: any[] = r.roomAmenities || r.amenities || [];
        // Build flat list and grouped list from amenities
        const amenitiesFlat: string[] = rawAmenities
          .map((a: any) => (typeof a === "string" ? a : (a.name || a.facilityName || "")))
          .filter(Boolean);
        const AMENITY_CATEGORIES: Record<string, string[]> = {
          "Internet": ["wifi", "wi-fi", "internet", "wireless", "laptop", "broadband"],
          "Services": ["coffee", "tea maker", "espresso", "room service", "housekeeping", "turndown", "safety deposit", "safe", "massage", "crib", "infant", "composting", "towel", "bed sheet", "cleaning"],
          "Bathroom": ["bathroom", "bathtub", "shower", "bathrobe", "slippers", "soap", "shampoo", "toiletries", "toilet", "grab bar", "accessible bath"],
          "Activities": [],
          "Climate": ["air conditioning", "heating", "blackout", "drapes", "curtains", "energy-saving"],
          "Entertainment": ["tv", "television", "streaming"],
        };
        const categorizeAmenity = (name: string): string => {
          const lower = name.toLowerCase();
          const apiCat = rawAmenities.find((a: any) => (a.name || a.facilityName) === name);
          if (apiCat && typeof apiCat === "object") {
            const explicitCat = apiCat.type || apiCat.facilityType || apiCat.category;
            if (explicitCat && explicitCat !== "General") return explicitCat;
          }
          for (const [cat, keywords] of Object.entries(AMENITY_CATEGORIES)) {
            if (keywords.some(k => lower.includes(k))) return cat;
          }
          return "General";
        };
        const amenityGroupsMap: Record<string, string[]> = {};
        for (const name of amenitiesFlat) {
          const cat = categorizeAmenity(name);
          if (!amenityGroupsMap[cat]) amenityGroupsMap[cat] = [];
          if (!amenityGroupsMap[cat].includes(name)) amenityGroupsMap[cat].push(name);
        }
        const categoryOrder = ["General", "Internet", "Services", "Bathroom", "Climate", "Entertainment", "Activities"];
        const amenityGroups = Object.entries(amenityGroupsMap)
          .sort(([a], [b]) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b)))
          .map(([category, items]) => ({ category, items }));

        const rawPhotos = (r.photos || []).map((p: any) => ({
          url: p.hd_url || p.url || (typeof p === "string" ? p : ""),
          category: p.category || p.type || p.caption || "",
          order: p.order ?? p.orderNumber ?? 999,
        })).filter((p: any) => p.url && typeof p.url === "string");
        const sortedPhotos = sortRoomPhotos(rawPhotos);

        return {
          id: String(r.id),
          name: r.roomName || r.name || "Room",
          normalizedName: normalizeName(r.roomName || r.name || ""),
          photos: sortedPhotos,
          description: r.description ? stripHtml(r.description) : null,
          amenities: amenitiesFlat,
          amenityGroups,
          bedTypes: (r.bedTypes || []).map((b: any) => ({ type: b.bedType || b.type || "Bed", quantity: b.quantity || 1 })),
          roomSize: r.roomSizeSquare ? `${r.roomSizeSquare} ${r.roomSizeUnit === "m2" ? "m²" : (r.roomSizeUnit || "sqm")}` : null,
          maxOccupancy: r.maxOccupancy || r.maxAdults || null,
        };
      });

      console.log('[room-photos-debug]', roomDataList.map(r => ({ name: r.name, photoCount: r.photos.length })));

      // Bed-type keywords — highly distinctive, worth 4x and conflict-penalized
      const BED_TYPES = ["king", "queen", "double", "twin", "single", "suite", "studio", "bunk"];

      // Name-based photo finder: weighted keyword scoring with conflict penalty
      const findPhotosByName = (rateName: string): { url: string }[] => {
        const rateWords = translateFrench(rateName).split(" ").filter(w => w.length > 2);
        const rateBedTypes = rateWords.filter(w => BED_TYPES.includes(w));

        let bestScore = -Infinity;
        let bestPhotos: { url: string }[] = [];

        for (const room of roomDataList) {
          if (!room.photos.length) continue;
          const roomWords: string[] = translateFrench(room.normalizedName).split(" ").filter((w: string) => w.length > 2);
          const roomWordSet = new Set<string>(roomWords);
          const roomBedTypes = roomWords.filter((w: string) => BED_TYPES.includes(w));

          let score = 0;

          // Score each rate word
          for (let i = 0; i < rateWords.length; i++) {
            const w = rateWords[i];
            if (roomWordSet.has(w)) {
              // Bed-type keyword: worth 4 points; any other match: 1 point
              score += BED_TYPES.includes(w) ? 4 : 1;
            }
          }

          // Penalize conflicting bed types (rate says "king" but room says "double" etc.)
          if (rateBedTypes.length > 0 && roomBedTypes.length > 0) {
            const rateBedSet = new Set<string>(rateBedTypes);
            for (let i = 0; i < roomBedTypes.length; i++) {
              if (!rateBedSet.has(roomBedTypes[i])) score -= 6;
            }
          }

          // Only consider rooms with a positive meaningful score
          if (score > 0 && score > bestScore) {
            bestScore = score;
            bestPhotos = room.photos;
          }
        }

        // Fallback: if no scored match, find first room with photos whose category
        // roughly matches the rate's general type (suite→suite, double→double, single→single)
        if (bestPhotos.length === 0) {
          const CATEGORY_KEYS = ["suite", "double", "single", "twin", "king", "queen", "studio"];
          const rateCategory = CATEGORY_KEYS.find(k => rateWords.includes(k));
          for (const room of roomDataList) {
            if (!room.photos.length) continue;
            const roomWords = translateFrench(room.normalizedName).split(" ");
            if (!rateCategory || roomWords.includes(rateCategory)) {
              bestPhotos = room.photos;
              break;
            }
          }
          // Last resort: first room with any photos
          if (bestPhotos.length === 0) {
            const anyRoom = roomDataList.find((r: any) => r.photos.length > 0);
            if (anyRoom) bestPhotos = anyRoom.photos;
          }
        }

        return bestPhotos;
      };

      const findRoomByName = (rateName: string): any | null => {
        const rateWords = translateFrench(rateName).split(" ").filter(w => w.length > 2);
        const rateBedTypes = rateWords.filter(w => BED_TYPES.includes(w));

        let bestScore = -Infinity;
        let bestRoom: any = null;

        for (const room of roomDataList) {
          const roomWords: string[] = translateFrench(room.normalizedName).split(" ").filter((w: string) => w.length > 2);
          const roomWordSet = new Set<string>(roomWords);
          const roomBedTypes = roomWords.filter((w: string) => BED_TYPES.includes(w));

          let score = 0;
          for (const w of rateWords) {
            if (roomWordSet.has(w)) {
              score += BED_TYPES.includes(w) ? 4 : 1;
            }
          }

          if (rateBedTypes.length > 0 && roomBedTypes.length > 0) {
            const rateBedSet = new Set<string>(rateBedTypes);
            for (const rbt of roomBedTypes) {
              if (!rateBedSet.has(rbt)) score -= 6;
            }
          }

          if (score > 0 && score > bestScore) {
            bestScore = score;
            bestRoom = room;
          }
        }
        return bestRoom;
      };

      // Strip normalizedName before sending to client
      const rooms: any[] = roomDataList.map(({ normalizedName, ...rest }) => rest);

      // Use the facilities[] array from the API which has names directly
      const amenities: string[] = (hotelRaw.facilities || [])
        .map((f: any) => f.name || f)
        .filter(Boolean)
        .slice(0, 60);
      if (amenities.length === 0) {
        amenities.push("Contact hotel for amenities");
      }

      const description = hotelRaw.hotelDescription
        ? stripHtml(hotelRaw.hotelDescription)
        : `Welcome to ${hotelRaw.name}. Enjoy your stay in ${hotelRaw.city || "this beautiful destination"}.`;

      // Fetch room rates
      const nights = (checkIn && checkOut)
        ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
        : 1;

      const MEALS: Record<string, string> = {
        RO: "No meals included", BB: "Breakfast included", HB: "Breakfast & dinner included",
        FB: "All meals included", AI: "All inclusive", SA: "Self catering",
      };

      let roomTypes: any[] = [];
      let reviewCountFromRates: number | null = null;
      if (checkIn && checkOut) {
        const guestCount = parseInt(guests || "2");
        try {
          const ratesData = await liteApiPost("/hotels/rates", {
            hotelIds: [hotelId],
            checkin: checkIn,
            checkout: checkOut,
            currency,
            guestNationality,
            occupancies: [{ rooms: 1, adults: guestCount, children: [] }],
          });

          const ratesHotel = ratesData?.data?.[0] || {};
          const rcVal = ratesHotel.reviews_total ?? ratesHotel.reviewCount ?? ratesHotel.review_count;
          if (rcVal != null) reviewCountFromRates = Number(rcVal) || null;
          const rawRoomTypes: any[] = ratesHotel.roomTypes || [];

          const parseRate = (rt: any) => {
            const rate = rt.rates?.[0];
            const totalAmount = parseFloat(String(rt.offerRetailRate?.amount || rate?.retailRate?.total?.[0]?.amount || 0)) || 0;
            const cur = rt.offerRetailRate?.currency || rate?.retailRate?.total?.[0]?.currency || "USD";
            const suggestedRaw = rt.suggestedSellingPrice?.amount ?? rate?.suggestedSellingPrice?.amount ?? null;
            const suggestedTotal = suggestedRaw != null ? parseFloat(String(suggestedRaw)) : null;
            const pricePerNight = parseFloat((totalAmount / nights).toFixed(2));
            const suggestedPricePerNight = suggestedTotal ? parseFloat((suggestedTotal / nights).toFixed(2)) : null;
            const discountPercent = (suggestedPricePerNight && pricePerNight < suggestedPricePerNight)
              ? Math.round(((suggestedPricePerNight - pricePerNight) / suggestedPricePerNight) * 100)
              : null;
            let taxes: number | null = null;
            const taxDirect = rate?.retailRate?.total?.[0]?.taxesAndFees;
            if (taxDirect != null) {
              taxes = parseFloat(String(taxDirect));
            } else {
              const txItems: any[] = rt.retailRate?.taxesAndFees || rate?.retailRate?.taxesAndFees || [];
              if (Array.isArray(txItems) && txItems.length > 0) {
                taxes = parseFloat(txItems.reduce((sum: number, t: any) => sum + (parseFloat(String(t.amount || 0)) || 0), 0).toFixed(2));
              } else {
                const feeRaw = rate?.retailRate?.fees?.[0]?.amount;
                if (feeRaw != null) taxes = parseFloat(String(feeRaw));
              }
            }
            const cancellationPoliciesRaw = rate?.cancellationPolicies;
            const cancellationPolicies = Array.isArray(cancellationPoliciesRaw)
              ? cancellationPoliciesRaw
              : cancellationPoliciesRaw?.cancelPolicyInfos || [];
            const refundableTag = rate?.refundableTag
              || (cancellationPoliciesRaw && !Array.isArray(cancellationPoliciesRaw) ? cancellationPoliciesRaw.refundableTag : undefined)
              || (cancellationPolicies.length > 0 ? "NRFN" : undefined);
            const cancelTime = cancellationPolicies.length > 0 ? (cancellationPolicies[0]?.cancelTime || null) : null;
            const cancellationPolicy = cancelTime
              ? `Cancel by ${cancelTime.split("T")[0] || "check-in"}`
              : undefined;
            const boardCode = rate?.boardCode || rt.boardCode || rate?.mealPlanCode || "";
            const boardName = rate?.boardName || "Room Only";
            const boardNameLower = boardName.toLowerCase();
            let mealsIncluded = MEALS[boardCode] || "";
            if (!mealsIncluded) {
              if (boardNameLower.includes("breakfast")) mealsIncluded = "Breakfast";
              else if (boardNameLower.includes("all inclusive")) mealsIncluded = "All inclusive";
              else if (boardNameLower.includes("half board")) mealsIncluded = "Breakfast & dinner included";
              else if (boardNameLower.includes("full board")) mealsIncluded = "All meals included";
              else if (boardCode) mealsIncluded = boardCode;
              else mealsIncluded = "No meals included";
            }
            const rateName = rt.name || rate?.name || "Room";
            return {
              offerId: rt.offerId,
              rateName,
              boardName,
              boardCode,
              mealsIncluded,
              price: totalAmount,
              pricePerNight,
              suggestedTotalPrice: suggestedTotal,
              suggestedPricePerNight,
              discountPercent,
              taxes,
              nights,
              currency: cur,
              refundableTag: refundableTag || undefined,
              cancellationPolicy,
              cancelTime,
            };
          };

          const allParsed = rawRoomTypes.map(parseRate);

          const roomGroups: Record<string, { nameGroupId: string; rateName: string; boardRates: Record<string, typeof allParsed[0]> }> = {};
          for (const parsed of allParsed) {
            const nameGroupId = normalizeName(parsed.rateName).replace(/\s+/g, "_");
            const boardKey = parsed.boardName.toLowerCase();
            if (!roomGroups[nameGroupId]) {
              roomGroups[nameGroupId] = { nameGroupId, rateName: parsed.rateName, boardRates: {} };
            }
            const existing = roomGroups[nameGroupId].boardRates[boardKey];
            if (!existing || parsed.price < existing.price) {
              roomGroups[nameGroupId].boardRates[boardKey] = parsed;
            }
          }

          // Deduplicate similar room groups (e.g. "Deluxe King" vs "Deluxe King Room")
          const groups = Object.values(roomGroups);
          const mergedGroups: typeof groups = [];
          for (const group of groups) {
            const sigWords = group.nameGroupId.split("_").filter(w => w.length > 3).sort().join("_");
            let found = false;
            if (sigWords) {
              for (const mg of mergedGroups) {
                const mgSigWords = mg.nameGroupId.split("_").filter(w => w.length > 3).sort().join("_");
                if (sigWords === mgSigWords) {
                  for (const [bk, rate] of Object.entries(group.boardRates)) {
                    if (!mg.boardRates[bk] || rate.price < mg.boardRates[bk].price) {
                      mg.boardRates[bk] = rate;
                    }
                  }
                  found = true;
                  break;
                }
              }
            }
            if (!found) mergedGroups.push(group);
          }

          const sortedGroups = mergedGroups.sort((a, b) => {
            const aMin = Math.min(...Object.values(a.boardRates).map(r => r.price));
            const bMin = Math.min(...Object.values(b.boardRates).map(r => r.price));
            return aMin - bMin;
          });

          for (const group of sortedGroups.slice(0, 20)) {
            const matchedRoom = findRoomByName(group.rateName);
            const photos = findPhotosByName(group.rateName);
            const boardOrder = ["room only", "breakfast included"];
            const sortedBoards = Object.entries(group.boardRates).sort(([a], [b]) => {
              const ai = boardOrder.indexOf(a); const bi = boardOrder.indexOf(b);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });
            for (const [, parsed] of sortedBoards) {
              roomTypes.push({
                offerId: parsed.offerId,
                mappedRoomId: group.nameGroupId,
                name: parsed.rateName,
                boardName: parsed.boardName,
                boardCode: parsed.boardCode,
                mealsIncluded: parsed.mealsIncluded,
                price: parsed.price,
                pricePerNight: parsed.pricePerNight,
                suggestedTotalPrice: parsed.suggestedTotalPrice,
                suggestedPricePerNight: parsed.suggestedPricePerNight,
                discountPercent: parsed.discountPercent,
                taxes: parsed.taxes,
                nights: parsed.nights,
                currency: parsed.currency,
                refundableTag: parsed.refundableTag,
                cancellationPolicy: parsed.cancellationPolicy,
                cancelTime: parsed.cancelTime,
                photos,
                roomName: matchedRoom?.name || null,
                roomDescription: matchedRoom?.description || null,
                roomSize: matchedRoom?.roomSize || null,
                maxOccupancy: matchedRoom?.maxOccupancy || null,
                roomAmenities: (matchedRoom?.amenities || []).slice(0, 10),
                roomAmenitiesFull: matchedRoom?.amenities || [],
                roomAmenityGroups: matchedRoom?.amenityGroups || [],
                bedTypes: matchedRoom?.bedTypes || [],
              });
            }
          }
        } catch (rateErr) {
          console.error("Rates fetch for hotel details failed:", rateErr);
        }
      }

      res.json({
        id: hotelRaw.id,
        name: hotelRaw.name || "Hotel",
        address: [hotelRaw.address, hotelRaw.city, hotelRaw.country?.toUpperCase()].filter(Boolean).join(", "),
        city: hotelRaw.city || null,
        countryCode: hotelRaw.countryCode || null,
        description,
        stars: hotelRaw.stars ? parseFloat(String(hotelRaw.stars)) : null,
        rating: hotelRaw.rating ? parseFloat(String(hotelRaw.rating)) : null,
        reviewCount: (hotelRaw.reviews_total || hotelRaw.reviewCount || hotelRaw.review_count)
          ? Number(hotelRaw.reviews_total || hotelRaw.reviewCount || hotelRaw.review_count) || null
          : reviewCountFromRates,
        lat: hotelRaw.location?.latitude ?? hotelRaw.latitude ?? hotelRaw.lat ?? null,
        lng: hotelRaw.location?.longitude ?? hotelRaw.longitude ?? hotelRaw.lng ?? null,
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

  app.post("/api/hotels/:id/ask", async (req, res) => {
    try {
      const { question, hotelName, description, amenities } = req.body as {
        question: string;
        hotelName: string;
        description: string;
        amenities: string[];
      };

      if (!question?.trim()) {
        return res.status(400).json({ message: "question is required" });
      }

      const anthropic = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      const userMessage = `Hotel: ${hotelName}

Description: ${description || "Not available"}

Amenities: ${amenities?.length ? amenities.join(", ") : "Not listed"}

Guest question: ${question}`;

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 8192,
        system: "You are a helpful hotel concierge assistant. Answer questions about this specific hotel based only on the information provided. Be concise and helpful in 2-3 sentences. If the information needed isn't available, say so politely.",
        messages: [{ role: "user", content: userMessage }],
      });

      const answer = message.content[0]?.type === "text" ? message.content[0].text : "I'm sorry, I couldn't generate a response.";
      res.json({ answer });
    } catch (err: any) {
      console.error("Hotel ask error:", err?.message || err);
      res.status(500).json({ message: "Failed to get answer" });
    }
  });

  const LANDMARK_FALLBACKS: Record<string, { name: string; lat: number; lng: number }[]> = {
    "paris": [
      { name: "Eiffel Tower", lat: 48.8584, lng: 2.2945 },
      { name: "Louvre Museum", lat: 48.8606, lng: 2.3376 },
      { name: "Notre-Dame Cathedral", lat: 48.8530, lng: 2.3499 },
      { name: "Champs-Élysées", lat: 48.8698, lng: 2.3078 },
      { name: "Montmartre", lat: 48.8867, lng: 2.3431 },
      { name: "Musée d'Orsay", lat: 48.8600, lng: 2.3266 },
    ],
    "london": [
      { name: "Big Ben", lat: 51.5007, lng: -0.1246 },
      { name: "Tower of London", lat: 51.5081, lng: -0.0759 },
      { name: "Buckingham Palace", lat: 51.5014, lng: -0.1419 },
      { name: "London Eye", lat: 51.5033, lng: -0.1196 },
      { name: "Covent Garden", lat: 51.5117, lng: -0.1240 },
      { name: "Shoreditch", lat: 51.5226, lng: -0.0777 },
    ],
    "new york": [
      { name: "Times Square", lat: 40.7580, lng: -73.9855 },
      { name: "Central Park", lat: 40.7851, lng: -73.9683 },
      { name: "Empire State Building", lat: 40.7484, lng: -73.9967 },
      { name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969 },
      { name: "Statue of Liberty", lat: 40.6892, lng: -74.0445 },
      { name: "5th Avenue", lat: 40.7549, lng: -73.9840 },
    ],
    "las vegas": [
      { name: "The Strip", lat: 36.1147, lng: -115.1728 },
      { name: "Fremont Street", lat: 36.1710, lng: -115.1440 },
      { name: "Bellagio Fountains", lat: 36.1126, lng: -115.1767 },
      { name: "Las Vegas Convention Center", lat: 36.1340, lng: -115.1524 },
      { name: "Allegiant Stadium", lat: 36.0909, lng: -115.1833 },
      { name: "High Roller", lat: 36.1175, lng: -115.1697 },
    ],
    "dubai": [
      { name: "Burj Khalifa", lat: 25.1972, lng: 55.2744 },
      { name: "Dubai Mall", lat: 25.1980, lng: 55.2796 },
      { name: "Palm Jumeirah", lat: 25.1124, lng: 55.1390 },
      { name: "Dubai Marina", lat: 25.0805, lng: 55.1403 },
      { name: "Burj Al Arab", lat: 25.1412, lng: 55.1853 },
      { name: "Dubai Creek", lat: 25.2622, lng: 55.3006 },
    ],
    "tokyo": [
      { name: "Shinjuku", lat: 35.6896, lng: 139.6917 },
      { name: "Shibuya Crossing", lat: 35.6595, lng: 139.7004 },
      { name: "Asakusa / Senso-ji", lat: 35.7148, lng: 139.7967 },
      { name: "Akihabara", lat: 35.7022, lng: 139.7741 },
      { name: "Harajuku", lat: 35.6702, lng: 139.7026 },
      { name: "Tsukiji Market", lat: 35.6655, lng: 139.7707 },
    ],
    "miami": [
      { name: "South Beach", lat: 25.7825, lng: -80.1300 },
      { name: "Art Deco Historic District", lat: 25.7736, lng: -80.1301 },
      { name: "Wynwood Arts District", lat: 25.8007, lng: -80.1994 },
      { name: "Brickell City Centre", lat: 25.7618, lng: -80.1940 },
      { name: "Bayside Marketplace", lat: 25.7751, lng: -80.1864 },
      { name: "Little Havana", lat: 25.7711, lng: -80.2282 },
    ],
    "barcelona": [
      { name: "Sagrada Família", lat: 41.4036, lng: 2.1744 },
      { name: "La Rambla", lat: 41.3797, lng: 2.1733 },
      { name: "Gothic Quarter", lat: 41.3833, lng: 2.1777 },
      { name: "Park Güell", lat: 41.4145, lng: 2.1527 },
      { name: "Barceloneta Beach", lat: 41.3763, lng: 2.1899 },
      { name: "Camp Nou", lat: 41.3809, lng: 2.1228 },
    ],
    "rome": [
      { name: "Colosseum", lat: 41.8902, lng: 12.4922 },
      { name: "Vatican City", lat: 41.9029, lng: 12.4534 },
      { name: "Trevi Fountain", lat: 41.9009, lng: 12.4833 },
      { name: "Spanish Steps", lat: 41.9057, lng: 12.4823 },
      { name: "Pantheon", lat: 41.8986, lng: 12.4769 },
      { name: "Piazza Navona", lat: 41.8992, lng: 12.4731 },
    ],
    "chicago": [
      { name: "Millennium Park", lat: 41.8827, lng: -87.6233 },
      { name: "Navy Pier", lat: 41.8919, lng: -87.6051 },
      { name: "The Magnificent Mile", lat: 41.8958, lng: -87.6244 },
      { name: "Willis Tower", lat: 41.8789, lng: -87.6359 },
      { name: "Lincoln Park", lat: 41.9221, lng: -87.6338 },
      { name: "Wicker Park", lat: 41.9088, lng: -87.6793 },
    ],
  };

  app.get("/api/landmarks/:city", async (req, res) => {
    const { city } = req.params;
    console.log('[landmarks-api] called for city:', city);
    const cacheKey = `landmarks_${city.toLowerCase()}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log('[landmarks-api] returning cached result, length:', cached.length);
      return res.json(cached);
    }

    const cityKey = city.toLowerCase().trim().replace(/,.*$/, "").trim();
    const fallback = LANDMARK_FALLBACKS[cityKey] || null;

    try {
      const anthropic = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      let message: any;
      try {
        message = await anthropic.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 512,
          system: "You are a travel geography expert. Return ONLY a raw JSON array. No markdown, no code fences, no explanation — just the JSON array itself.",
          messages: [{
            role: "user",
            content: `List the 6 most famous tourist landmarks or popular neighborhoods in ${city} that hotel guests would want to be near. Return ONLY a JSON array of objects with name, lat, lng fields. Example: [{"name":"Eiffel Tower","lat":48.8584,"lng":2.2945}]. Use accurate real-world coordinates.`,
          }],
        });
      } catch (aiErr: any) {
        console.log('[landmarks-error] Anthropic API call failed:', aiErr?.message || aiErr);
        if (fallback) {
          apiCache.set(cacheKey, fallback, 3600000); // 1h cache for fallback
          console.log('[landmarks-api] using hardcoded fallback, length:', fallback.length);
          return res.json(fallback);
        }
        return res.json([]);
      }

      let rawText = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
      console.log('[landmarks-api] raw Claude response:', rawText.slice(0, 200));

      // Strip markdown code fences if present
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

      let landmarks: { name: string; lat: number; lng: number }[] = [];
      try {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) {
          landmarks = parsed.filter((l: any) => l.name && typeof l.lat === "number" && typeof l.lng === "number");
        }
      } catch (parseErr: any) {
        console.log('[landmarks-error] JSON parse failed:', parseErr?.message, '| raw text was:', rawText.slice(0, 200));
        landmarks = [];
      }

      if (landmarks.length === 0 && fallback) {
        console.log('[landmarks-api] Claude returned empty/unparseable, using hardcoded fallback');
        landmarks = fallback;
      }

      apiCache.set(cacheKey, landmarks, 86400000); // 24h
      console.log('[landmarks-api] result length:', landmarks.length, '| first:', landmarks[0]?.name);
      return res.json(landmarks);
    } catch (err: any) {
      console.log('[landmarks-error] outer catch:', err?.message || err);
      if (fallback) return res.json(fallback);
      return res.json([]);
    }
  });

  app.get("/api/hotels/:id/reviews", async (req, res) => {
    try {
      const hotelId = req.params.id;
      const reviewsData = await liteApiGet("/data/reviews", { hotelId, limit: "10", getSentiment: "true" });
      const raw: any[] = Array.isArray(reviewsData?.data) ? reviewsData.data : [];
      const reviews = raw.map((r: any) => ({
        name: r.name || "Guest",
        score: typeof r.averageScore === "number" ? r.averageScore : null,
        type: r.type?.replace(/review category /i, "") || null,
        date: r.date ? r.date.split(" ")[0] : null,
        headline: r.headline || null,
        pros: r.pros || null,
        cons: r.cons || null,
        source: r.source || null,
        country: r.country || null,
      }));

      let sentiment: { categories: Record<string, number>; pros: string[]; cons: string[] } | null = null;
      const rawSentiment = reviewsData?.sentiment;
      if (rawSentiment && typeof rawSentiment === "object") {
        const categories: Record<string, number> = {};
        if (rawSentiment.categories && typeof rawSentiment.categories === "object") {
          for (const [key, val] of Object.entries(rawSentiment.categories)) {
            if (typeof val === "number") {
              categories[key] = val;
            }
          }
        }
        const pros = Array.isArray(rawSentiment.pros) ? rawSentiment.pros.filter((p: any) => typeof p === "string") : [];
        const cons = Array.isArray(rawSentiment.cons) ? rawSentiment.cons.filter((c: any) => typeof c === "string") : [];
        if (Object.keys(categories).length > 0 || pros.length > 0 || cons.length > 0) {
          sentiment = { categories, pros, cons };
        }
      }

      res.json({ reviews, sentiment });
    } catch (err: any) {
      console.error("Reviews error:", err?.message || err);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.get(api.hotels.similar.path, async (req, res) => {
    try {
      const hotelId = req.params.id;
      const fmtDate = (d: Date) => d.toISOString().split("T")[0];
      const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
      const dayAfterTmrw = new Date(); dayAfterTmrw.setDate(dayAfterTmrw.getDate() + 2);
      const checkIn = (req.query.checkIn as string) || fmtDate(tmrw);
      const checkOut = (req.query.checkOut as string) || fmtDate(dayAfterTmrw);
      const guests = parseInt((req.query.guests as string) || "2", 10);
      const currency = (req.query.currency as string) || "USD";
      const guestNationality = (req.query.guestNationality as string) || "US";

      const hotelData = await liteApiGet("/data/hotel", { hotelId });
      const hotelRaw = hotelData?.data?.[0] ?? hotelData?.data;
      // Resolve countryCode from multiple possible field names
      const resolvedCountryCode = hotelRaw?.countryCode || hotelRaw?.country_code || hotelRaw?.country || null;
      if (!hotelRaw?.city || !resolvedCountryCode) {
        return res.json([]);
      }
      const cityHotels = await liteApiGet("/data/hotels", {
        cityName: hotelRaw.city,
        countryCode: resolvedCountryCode,
        limit: "15",
        offset: "0",
      });
      const list = (cityHotels?.data || []).filter((h: any) => h.id !== hotelId).slice(0, 10);
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
        address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
        stars: h.stars ? parseFloat(String(h.stars)) : null,
        rating: h.rating ? parseFloat(String(h.rating)) : null,
        reviewCount: h.reviews_total || null,
        price: null as number | null,
        imageUrl: h.main_photo || h.thumbnail || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
        lat: h.location?.latitude ?? h.latitude ?? h.lat ?? null,
        lng: h.location?.longitude ?? h.longitude ?? h.lng ?? null,
      }));

      try {
        const hotelIds = results.map((h: any) => h.id);
        if (hotelIds.length > 0) {
          const ratesData = await liteApiPost("/hotels/rates", {
            hotelIds,
            checkin: checkIn,
            checkout: checkOut,
            currency,
            guestNationality,
            occupancies: [{ rooms: 1, adults: guests, children: [] }],
          });
          if (ratesData?.data) {
            const priceMap = new Map<string, number>();
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
            for (const hotel of results) {
              hotel.price = priceMap.get(hotel.id) ?? null;
            }
          }
        }
      } catch (rateErr: any) {
        console.error("Similar hotels rates error:", rateErr?.message || rateErr);
      }

      // Only return hotels with a valid price (exclude fully booked / no-availability hotels)
      const pricedResults = results.filter((h: any) => h.price && h.price > 0);
      res.json(pricedResults);
    } catch (err: any) {
      console.error("Similar hotels error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch similar hotels" });
    }
  });

  app.get("/api/bookings/lookup", async (req, res) => {
    try {
      const { bookingId } = req.query as Record<string, string>;
      if (!bookingId?.trim()) return res.status(400).json({ message: "Booking ID is required" });

      const url = `${LITEAPI_BOOK_BASE}/bookings/${bookingId.trim()}`;
      console.log("[lookup] fetching:", url);
      const response = await fetch(url, {
        headers: { "accept": "application/json", "X-API-Key": process.env.LITEAPI_KEY! }
      });
      const data = await response.json();
      console.log("[lookup] response:", JSON.stringify(data).slice(0, 200));
      const b = data?.data || data;
      if (!response.ok || !b || b.error) {
        return res.status(404).json({ message: "Booking not found. Please check your Booking ID." });
      }
      res.json({
        id: b.bookingId || bookingId,
        confirmationCode: b.supplierBookingId || b.hotel_confirmation_code || "",
        hotelName: b.hotel?.name || b.hotelName || "Hotel",
        roomType: b.bookedRooms?.[0]?.roomType?.name || b.roomTypeName || "Room",
        checkIn: b.checkin || b.checkIn,
        checkOut: b.checkout || b.checkOut,
        guests: b.adults || b.guests || 1,
        totalPrice: b.bookedRooms?.[0]?.rate?.retailRate?.total?.[0]?.amount || b.totalAmount || null,
        currency: b.currency || "USD",
        status: b.status || "CONFIRMED",
        cancellationPolicy: b.cancellationPolicies || null,
        guestName: `${b.holder?.firstName || ""} ${b.holder?.lastName || ""}`.trim(),
        email: b.holder?.email || null,
      });
    } catch (err: any) {
      console.error("Booking lookup error:", err?.message || err);
      res.status(500).json({ message: "Failed to look up booking" });
    }
  });

  app.get(api.bookings.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.email || req.user?.claims?.email || "";
      const response = await fetch(
        `${LITEAPI_BOOK_BASE}/bookings?clientReference=${encodeURIComponent(userEmail)}`,
        { headers: { "accept": "application/json", "X-API-Key": process.env.LITEAPI_KEY! } }
      );
      const data = await response.json();
      console.log('[my-bookings] raw:', JSON.stringify(data).slice(0, 300));
      const bookings = data?.data || [];
      res.json(bookings.map((b: any) => ({
        id: b.bookingId,
        hotelName: b.hotel?.name || "Hotel",
        roomType: b.bookedRooms?.[0]?.roomType?.name || "Room",
        checkIn: b.checkin,
        checkOut: b.checkout,
        guests: b.bookedRooms?.[0]?.adults || 1,
        totalPrice: b.bookedRooms?.[0]?.rate?.retailRate?.total?.[0]?.amount || null,
        currency: b.currency || "USD",
        status: b.status,
        createdAt: b.createdAt,
      })));
    } catch (err) {
      console.error("Fetch bookings error:", err);
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

  app.post("/api/ai-concierge", async (req, res) => {
    try {
      const { message, history = [] } = req.body as {
        message: string;
        history: { role: "user" | "assistant"; content: string }[];
      };

      if (!message?.trim()) {
        return res.status(400).json({ message: "message is required" });
      }

      const msg = message.toLowerCase().trim();

      // --- Intent detection ---
      const isHotelSearch = (() => {
        const searchKeywords = [
          "hotel", "resort", "stay", "accommodation", "room", "suite", "inn",
          "lodge", "hostel", "airbnb", "place to stay", "somewhere to stay",
          "book", "find", "search", "recommend", "looking for",
          "luxury", "boutique", "budget", "cheap", "affordable", "romantic",
          "family", "beach", "mountain", "ski", "urban", "city", "downtown",
          "spa", "pool", "vibe", "getaway", "retreat", "escape",
          "paris", "bali", "london", "tokyo", "dubai", "new york", "rome",
          "barcelona", "amsterdam", "santorini", "maldives", "miami", "las vegas",
          "bangkok", "sydney", "singapore", "istanbul", "prague", "venice",
        ];
        return searchKeywords.some(k => msg.includes(k));
      })();

      const isLuxvibeQuestion = (() => {
        return msg.includes("luxvibe") || msg.includes("lux vibe") ||
          msg.includes("your platform") || msg.includes("your service") ||
          msg.includes("your company") || msg.includes("your website") ||
          msg.includes("what do you do") || msg.includes("what is this") ||
          msg.includes("who are you") || msg.includes("about you") ||
          msg.includes("how does") || msg.includes("how do i") ||
          msg.includes("cancel") || msg.includes("refund") || msg.includes("price") ||
          msg.includes("cost") || msg.includes("fee") || msg.includes("payment");
      })();

      // --- Luxvibe FAQ responses --- (takes priority over hotel search for direct questions)
      const isDirectQuestion = msg.includes("what is") || msg.includes("what's") ||
        msg.includes("who are") || msg.includes("tell me about") || msg.includes("explain");
      if (isLuxvibeQuestion && (isDirectQuestion || !isHotelSearch)) {
        const faqs: { match: string[]; answer: string }[] = [
          {
            match: ["who are you", "what are you", "about you", "what is luxvibe", "what is this", "what do you do", "what's luxvibe"],
            answer: "I'm Luxe, your personal travel concierge from Luxvibe! Luxvibe is a premium hotel booking platform with thousands of curated properties worldwide. We specialize in helping you find the perfect hotel — whether you're after a romantic escape, a family adventure, a business trip, or a luxurious retreat. Just tell me what you're dreaming of and I'll find it for you!",
          },
          {
            match: ["cancel", "refund", "cancellation"],
            answer: "Cancellation policies vary by hotel and rate type. When booking on Luxvibe, you'll always see whether a rate is fully refundable or non-refundable before you confirm. Free cancellation options are available at most properties — look for the 'Refundable' tag when searching! Is there anything else I can help you with?",
          },
          {
            match: ["pay", "payment", "credit card", "cost", "fee", "price", "how much"],
            answer: "Luxvibe supports secure payments via credit and debit cards. The total price shown at checkout is final — no hidden fees! Some rates require payment upfront, while others let you pay at the hotel. Ready to find a great deal? Just tell me your destination!",
          },
          {
            match: ["how do i", "how does", "how to"],
            answer: "Using Luxvibe is simple! Search for your destination and travel dates, browse curated hotel results with real-time prices, filter by your preferences (stars, amenities, vibe), and book in just a few clicks. You can also use our vibe search — just tell me what experience you're after and I'll find the perfect match!",
          },
        ];
        for (const faq of faqs) {
          if (faq.match.some(k => msg.includes(k))) {
            return res.json({ text: faq.answer, hotels: [], vibeQuery: "" });
          }
        }
        return res.json({
          text: "Luxvibe is a premium hotel booking platform that helps you discover amazing hotels worldwide! Whether you want a luxury escape, boutique experience, or family-friendly resort, we've got you covered. I can also help you search for hotels — just tell me your dream destination or vibe!",
          hotels: [],
          vibeQuery: "",
        });
      }

      // --- Travel tip / general questions ---
      const isTravelTip = (() => {
        return msg.includes("best time") || msg.includes("when to visit") || msg.includes("weather") ||
          msg.includes("visa") || msg.includes("passport") || msg.includes("currency") ||
          msg.includes("tip") || msg.includes("advice") || msg.includes("suggest") ||
          msg.includes("honeymoon") || msg.includes("destination") || msg.includes("where") ||
          (msg.includes("should i") && !isHotelSearch);
      })();

      if (isTravelTip && !isHotelSearch) {
        const destinations: Record<string, string> = {
          honeymoon: "For a honeymoon, these destinations are absolutely dreamy: **Santorini** (iconic sunsets and cliffside hotels), **Maldives** (overwater bungalows and crystal waters), **Bali** (lush jungle retreats and private villas), **Paris** (the city of love!), and **Amalfi Coast** (dramatic scenery and romantic dinners). Want me to find hotels in any of these?",
          beach: "Top beach destinations include Bali, Maldives, Santorini, Miami, Cancún, and the Algarve in Portugal. Each offers stunning coastlines and incredible hotels. Which one calls to you?",
          family: "Family-friendly hotspots include Orlando (theme parks!), Barcelona, Bali, Dubai, and the Swiss Alps. Hotels with kids' clubs, pools, and activities make all the difference. Want me to search for family hotels somewhere specific?",
          luxury: "For luxury travel, Dubai, Paris, Maldives, Tokyo, and New York consistently top the charts. I'd love to find you an extraordinary hotel — just name your destination!",
          budget: "Budget-friendly destinations with amazing value include Bangkok, Lisbon, Prague, Bali, and Vietnam. You can stay in incredible places without breaking the bank. Want me to search for options?",
          ski: "Top ski destinations include the Swiss Alps (Zermatt, St. Moritz), French Alps (Chamonix, Courchevel), Aspen and Vail in Colorado, and Niseko in Japan. Shall I find hotels in any of these?",
        };
        for (const [key, response] of Object.entries(destinations)) {
          if (msg.includes(key)) {
            return res.json({ text: response, hotels: [], vibeQuery: "" });
          }
        }
      }

      // --- Hotel search via LiteAPI semantic search ---
      if (isHotelSearch) {
        const vibeQuery = message.trim();
        let foundHotels: any[] = [];

        try {
          const semanticData = await liteApiGet("/data/hotels/semantic-search", { query: vibeQuery }, 300000);
          const semanticHotels: any[] = Array.isArray(semanticData?.data) ? semanticData.data : [];

          if (semanticHotels.length > 0) {
            foundHotels = semanticHotels.slice(0, 5).map((h: any) => ({
              id: h.id || h.hotelId || "",
              name: h.name || "Hotel",
              address: [h.address, h.city, h.country].filter(Boolean).join(", "),
              city: h.city || null,
              country: h.country || null,
              photo: h.main_photo || h.thumbnail || (Array.isArray(h.photos) && h.photos.length > 0 ? h.photos[0] : null) || null,
              relevanceScore: h.relevanceScore ?? h.relevance_score ?? h.score ?? null,
              semanticTags: Array.isArray(h.tags) ? h.tags : (h.semantic_tags ? h.semantic_tags : []),
              persona: h.persona || null,
              style: h.style || null,
              story: h.story || null,
            }));
          }
        } catch (err) {
          console.error("AI concierge semantic search error:", err);
        }

        if (foundHotels.length > 0) {
          const firstCity = foundHotels[0]?.city || "";
          const topNames = foundHotels.slice(0, 2).map(h => h.name).join(" and ");
          const responseText = `I found ${foundHotels.length} great match${foundHotels.length > 1 ? "es" : ""} for "${vibeQuery}"! ${topNames ? `${topNames} ${foundHotels.length > 2 ? "and more" : ""}` : ""} — all hand-picked to match your vibe. Click any hotel to explore it, or use "Explore all results" to see everything on the map!`;
          return res.json({ text: responseText, hotels: foundHotels, vibeQuery });
        } else {
          return res.json({
            text: `I searched for "${vibeQuery}" but didn't find exact matches right now. Try describing the vibe differently — for example, "luxury beachfront resort" or "boutique hotel Paris". I'm here to help you find the perfect stay!`,
            hotels: [],
            vibeQuery,
          });
        }
      }

      // --- Default greeting / fallback ---
      const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "sup", "yo"];
      if (greetings.some(g => msg === g || msg.startsWith(g + " ") || msg.startsWith(g + "!"))) {
        return res.json({
          text: "Hello! I'm Luxe, your Luxvibe travel concierge. I'm here to help you discover amazing hotels by vibe, occasion, or destination. Try asking me for a 'romantic beachfront resort in Bali' or a 'luxury boutique hotel in Paris' — or just tell me where you dream of going!",
          hotels: [],
          vibeQuery: "",
        });
      }

      return res.json({
        text: "I'd love to help with that! I specialize in finding the perfect hotel for any vibe or destination. Try describing your dream stay — for example, 'cozy mountain lodge in Switzerland' or 'beachfront resort with spa in Thailand'. What kind of experience are you looking for?",
        hotels: [],
        vibeQuery: "",
      });

    } catch (err: any) {
      console.error("AI concierge error:", err?.message || err);
      res.status(500).json({ message: "Failed to get response from AI concierge" });
    }
  });

  app.get("/api/hotels/semantic-search", async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const data = await liteApiGet("/data/hotels/semantic-search", { query });
      const hotels = Array.isArray(data?.data) ? data.data : [];
      const results = hotels.map((h: any) => ({
        id: h.id || h.hotelId || "",
        name: h.name || "Hotel",
        address: [h.address, h.city, h.country].filter(Boolean).join(", "),
        city: h.city || null,
        country: h.country || null,
        photo: h.main_photo || h.thumbnail || (Array.isArray(h.photos) && h.photos.length > 0 ? h.photos[0] : null) || null,
        relevanceScore: h.relevanceScore ?? h.relevance_score ?? h.score ?? null,
        semanticTags: Array.isArray(h.tags) ? h.tags : (h.semantic_tags ? h.semantic_tags : []),
        persona: h.persona || null,
        style: h.style || null,
        locationType: h.location_type || h.locationType || null,
        story: h.story || h.contextual_story || null,
      }));
      res.json(results);
    } catch (err: any) {
      console.error("Semantic search error:", err?.message || err);
      res.status(500).json({ message: "Failed to perform semantic search" });
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
      res.json({ ...inner, paymentEnv, publicKey: apiKey });
    } catch (err: any) {
      console.error("Prebook error:", err?.message || err);
      res.status(400).json({ message: err?.message || "Failed to prebook" });
    }
  });

  app.post(api.hotels.book.path, async (req, res) => {
    try {
      console.log('[book] incoming body:', JSON.stringify({ prebookId: req.body.prebookId, transactionId: req.body.transactionId }));
      const { prebookId, transactionId, firstName, lastName, email, phone } = api.hotels.book.input.parse(req.body);
      const bookPayload = {
        prebookId,
        clientReference: email,
        holder: { firstName, lastName, email, phone },
        payment: { method: "TRANSACTION_ID", transactionId },
        guests: [{ occupancyNumber: 1, firstName, lastName, email }]
      };
      console.log('[book] payload:', JSON.stringify(bookPayload));
      const data = await liteApiPost("/rates/book", bookPayload, LITEAPI_BOOK_BASE);
      console.log('[book] full response:', JSON.stringify(data));

      if (data.error) {
        console.error('[book] LiteAPI error full response:', JSON.stringify(data));
        return res.status(400).json({
          message: typeof data.error === 'string'
            ? data.error
            : data.error?.message || data.message || JSON.stringify(data.error),
          liteApiCode: data.error?.code || data.code || null,
        });
      }

      res.json(data.data || data);
    } catch (err: any) {
      console.error("Book error:", err?.message || err);
      res.status(400).json({ message: err?.message || "Failed to book" });
    }
  });

  return httpServer;
}

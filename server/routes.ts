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
                address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
                city: cityName,
                stars: h.stars ? parseFloat(String(h.stars)) : null,
                rating: h.rating ? parseFloat(String(h.rating)) : null,
                reviewCount: h.reviews_total || h.reviewCount || null,
                price: null as number | null,
                imageUrl: h.main_photo || h.thumbnail || null,
              }))
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

  app.get("/api/hotels/las-vegas", async (req, res) => {
    try {
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
      const { lat, lng } = req.query as Record<string, string>;
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

      // Helper to fetch hotels for a city
      const fetchHotelsForCity = async (city: string, country: string) => {
        const data = await liteApiGet("/data/hotels", {
          cityName: city,
          countryCode: country,
          limit: "25",
          offset: "0",
        });
        return (data?.data || []) as any[];
      };

      let hotelsList: any[] = [];

      // Try geocoded city first (if we got one)
      if (cityName) {
        hotelsList = await fetchHotelsForCity(cityName, countryCode);

        // If no hotels found, try zoom=8 (region level) for a bigger city name
        if (hotelsList.length === 0) {
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
              hotelsList = await fetchHotelsForCity(fallbackCity, countryCode);
            }
          } catch { }
        }
      }

      // Final fallback: find nearest well-covered city by lat/lng distance
      if (hotelsList.length === 0) {
        for (const city of sortedFallbacks) {
          hotelsList = await fetchHotelsForCity(city.cityName, city.countryCode);
          if (hotelsList.length > 0) {
            console.log(`[nearby] Nearest known city fallback: ${city.cityName}`);
            break;
          }
        }
      }

      if (hotelsList.length === 0) return res.json([]);

      const nearby = hotelsList
        .map((h: any) => ({
          id: h.id,
          name: h.name || "Hotel",
          address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
          city: h.city || cityName,
          stars: h.stars ? parseFloat(String(h.stars)) : null,
          rating: h.rating ? parseFloat(String(h.rating)) : null,
          reviewCount: h.reviews_total || h.reviewCount || null,
          price: null as number | null,
          imageUrl: h.main_photo || h.thumbnail || null,
        }))
        .filter((h: any) => h.rating !== null && h.stars !== null && h.stars >= 4)
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
      const placesData = await liteApiGet("/data/places", { textQuery: q });
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
      const { destination, placeId, aiSearch, checkIn, checkOut, guests, children, roomConfig } = req.query as Record<string, string>;

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
          currency: "USD",
          guestNationality: "US",
          occupancies,
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
            address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
            stars: h.stars ? parseFloat(String(h.stars)) : null,
            rating: h.rating ? parseFloat(String(h.rating)) : null,
            reviewCount: h.reviews_total || h.reviewCount || null,
            price: price,
            imageUrl: h.main_photo || h.thumbnail || null,
          };
        }).filter((h: any) => h.price > 0);

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
              currency: "USD",
              guestNationality: "US",
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
          lat: h.latitude ?? h.lat ?? null,
          lng: h.longitude ?? h.lng ?? null,
          facilities,
          boardCodes: boardCodesMap.get(h.id) || [],
          refundable: refundableMap.get(h.id) || false,
        };
      });

      // Return hotels with rates first, then those without; all results included
      const withRates = results.filter((h: any) => h.price > 0);
      const withoutRates = results.filter((h: any) => h.price === 0);
      res.json([...withRates, ...withoutRates]);
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

      // Extract room info and build a name-based lookup for photo matching
      // (mappedRoomId from rates != rooms[].id from hotel data — different formats)
      const normalizeName = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

      const roomDataList: any[] = (hotelRaw.rooms || []).map((r: any) => ({
        id: String(r.id),
        name: r.roomName || r.name || "Room",
        normalizedName: normalizeName(r.roomName || r.name || ""),
        photos: (r.photos || []).map((p: any) => ({ url: p.hd_url || p.url || p })).filter((p: any) => p.url && typeof p.url === "string"),
        description: r.description ? stripHtml(r.description) : null,
        amenities: (r.roomAmenities || []).slice(0, 12).map((a: any) => a.name || a).filter(Boolean),
        bedTypes: (r.bedTypes || []).map((b: any) => ({ type: b.bedType || b.type || "Bed", quantity: b.quantity || 1 })),
        roomSize: r.roomSizeSquare ? `${r.roomSizeSquare} ${r.roomSizeUnit === "m2" ? "m²" : (r.roomSizeUnit || "sqm")}` : null,
        maxOccupancy: r.maxOccupancy || r.maxAdults || null,
      }));

      // Bed-type keywords — highly distinctive, worth 4x and conflict-penalized
      const BED_TYPES = ["king", "queen", "double", "twin", "single", "suite", "studio", "bunk"];

      // Name-based photo finder: weighted keyword scoring with conflict penalty
      const findPhotosByName = (rateName: string): { url: string }[] => {
        const rateWords = normalizeName(rateName).split(" ").filter(w => w.length > 2);
        const rateBedTypes = rateWords.filter(w => BED_TYPES.includes(w));

        let bestScore = -Infinity;
        let bestPhotos: { url: string }[] = [];

        for (const room of roomDataList) {
          if (!room.photos.length) continue;
          const roomWords: string[] = room.normalizedName.split(" ").filter((w: string) => w.length > 2);
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
        return bestPhotos;
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
            currency: "USD",
            guestNationality: "US",
            occupancies: [{ rooms: 1, adults: guestCount, children: [] }],
          });

          const ratesHotel = ratesData?.data?.[0] || {};
          const rcVal = ratesHotel.reviews_total ?? ratesHotel.reviewCount ?? ratesHotel.review_count;
          if (rcVal != null) reviewCountFromRates = Number(rcVal) || null;
          const rawRoomTypes: any[] = ratesHotel.roomTypes || [];
          for (const rt of rawRoomTypes) {
            if (roomTypes.length >= 15) break;
            const rate = rt.rates?.[0];
            const totalAmount = parseFloat(String(rt.offerRetailRate?.amount || rate?.retailRate?.total?.[0]?.amount || 0)) || 0;
            const currency = rt.offerRetailRate?.currency || rate?.retailRate?.total?.[0]?.currency || "USD";

            // Suggested (pre-discount) total — LiteAPI field
            const suggestedRaw = rt.suggestedSellingPrice?.amount ?? rate?.suggestedSellingPrice?.amount ?? null;
            const suggestedTotal = suggestedRaw != null ? parseFloat(String(suggestedRaw)) : null;

            // Per-night prices
            const pricePerNight = parseFloat((totalAmount / nights).toFixed(2));
            const suggestedPricePerNight = suggestedTotal ? parseFloat((suggestedTotal / nights).toFixed(2)) : null;
            const discountPercent = (suggestedPricePerNight && pricePerNight < suggestedPricePerNight)
              ? Math.round(((suggestedPricePerNight - pricePerNight) / suggestedPricePerNight) * 100)
              : null;

            // Taxes
            const taxRaw = rate?.retailRate?.total?.[0]?.taxesAndFees ?? rate?.retailRate?.fees?.[0]?.amount ?? null;
            const taxes = taxRaw != null ? parseFloat(String(taxRaw)) : null;

            // Cancellation
            const cancellationPolicies = rate?.cancellationPolicies || [];
            const cancelTime = cancellationPolicies.length > 0 ? (cancellationPolicies[0]?.cancelTime || null) : null;
            const cancellationPolicy = cancelTime
              ? `Cancel by ${cancelTime.split("T")[0] || "check-in"}`
              : undefined;

            // Board / meals
            const boardCode = rate?.boardCode || "";
            const mealsIncluded = MEALS[boardCode] || "No meals included";

            const rateName = rt.name || rate?.name || "Room";
            roomTypes.push({
              offerId: rt.offerId,
              mappedRoomId: rt.mappedRoomId || rt.offerId,
              name: rateName,
              boardName: rate?.boardName || "Room Only",
              boardCode,
              mealsIncluded,
              price: totalAmount,
              pricePerNight,
              suggestedTotalPrice: suggestedTotal,
              suggestedPricePerNight,
              discountPercent,
              taxes,
              nights,
              currency,
              refundableTag: rate?.refundableTag || undefined,
              cancellationPolicy,
              cancelTime,
              photos: findPhotosByName(rateName),
            });
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
      const reviewsData = await liteApiGet("/data/reviews", { hotelId, limit: "10" });
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
        address: [h.address, h.city, h.country?.toUpperCase()].filter(Boolean).join(", "),
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

  app.get("/api/bookings/lookup", async (req, res) => {
    try {
      const id = parseInt(req.query.id as string, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid booking ID" });
      const booking = await storage.getBookingById(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json({
        id: booking.id,
        hotelName: booking.hotelName,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        status: booking.status,
      });
    } catch {
      res.status(500).json({ message: "Failed to look up booking" });
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

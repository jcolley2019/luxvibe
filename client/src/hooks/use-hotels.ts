import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type HotelSearchResponse, type HotelDetailsResponse, type HotelFeaturedResponse, type SemanticHotel } from "@shared/routes";
import { usePreferences, LANG_TO_NATIONALITY } from "@/context/preferences";

export type HotelReview = {
  name: string;
  score: number | null;
  type: string | null;
  date: string | null;
  headline: string | null;
  pros: string | null;
  cons: string | null;
  source: string | null;
  country: string | null;
};

export type ReviewSentiment = {
  categories: Record<string, number>;
  pros: string[];
  cons: string[];
};

export type ReviewsResponse = {
  reviews: HotelReview[];
  sentiment: ReviewSentiment | null;
};

export type NearbyHotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  stars: number | null;
  rating: number | null;
  reviewCount: number | null;
  price: number | null;
  imageUrl: string | null;
  facilities?: string[];
};

export function useFeaturedHotels() {
  const { currency, language } = usePreferences();
  const guestNationality = LANG_TO_NATIONALITY[language] || "US";
  return useQuery({
    queryKey: [api.hotels.featured.path, currency, guestNationality],
    queryFn: async () => {
      const res = await fetch(`${api.hotels.featured.path}?currency=${currency}&guestNationality=${guestNationality}`);
      if (!res.ok) throw new Error("Failed to fetch featured hotels");
      return api.hotels.featured.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useSearchHotels(params: {
  destination?: string;
  placeId?: string;
  aiSearch?: string;
  checkIn: string;
  checkOut: string;
  guests?: string;
}) {
  const { currency, language } = usePreferences();
  const guestNationality = LANG_TO_NATIONALITY[language] || "US";
  return useQuery({
    queryKey: [api.hotels.search.path, params, currency, guestNationality],
    queryFn: async () => {
      const url = buildUrl(api.hotels.search.path);
      const queryParams = new URLSearchParams();
      if (params.destination) queryParams.set("destination", params.destination);
      if (params.placeId) queryParams.set("placeId", params.placeId);
      if (params.aiSearch) queryParams.set("aiSearch", params.aiSearch);
      queryParams.set("checkIn", params.checkIn);
      queryParams.set("checkOut", params.checkOut);
      if (params.guests) queryParams.set("guests", params.guests);
      queryParams.set("currency", currency);
      queryParams.set("guestNationality", guestNationality);

      const res = await fetch(`${url}?${queryParams.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to search hotels");
      }
      return api.hotels.search.responses[200].parse(await res.json());
    },
    enabled: (!!params.destination || !!params.placeId || !!params.aiSearch) && !!params.checkIn && !!params.checkOut,
  });
}

export function useNearbyHotels(coords: { lat: number; lng: number } | null) {
  const { currency, language } = usePreferences();
  const guestNationality = LANG_TO_NATIONALITY[language] || "US";
  return useQuery<NearbyHotel[]>({
    queryKey: [api.hotels.nearby.path, coords, currency, guestNationality],
    queryFn: async () => {
      const res = await fetch(
        `${api.hotels.nearby.path}?lat=${coords!.lat}&lng=${coords!.lng}&currency=${currency}&guestNationality=${guestNationality}`
      );
      if (!res.ok) throw new Error("Failed to fetch nearby hotels");
      return res.json();
    },
    enabled: !!coords,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLasVegasHotels() {
  const { currency, language } = usePreferences();
  const guestNationality = LANG_TO_NATIONALITY[language] || "US";
  return useQuery<{ strip: NearbyHotel[]; downtown: NearbyHotel[] }>({
    queryKey: ["/api/hotels/las-vegas", currency, guestNationality],
    queryFn: async () => {
      const res = await fetch(`/api/hotels/las-vegas?currency=${currency}&guestNationality=${guestNationality}`);
      if (!res.ok) throw new Error("Failed to fetch Las Vegas hotels");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useSimilarHotels(id: string, params?: { checkIn?: string; checkOut?: string; guests?: string }) {
  const { currency, language } = usePreferences();
  const guestNationality = LANG_TO_NATIONALITY[language] || "US";
  return useQuery({
    queryKey: [api.hotels.similar.path, id, params?.checkIn, params?.checkOut, params?.guests, currency, guestNationality],
    queryFn: async () => {
      let url = buildUrl(api.hotels.similar.path, { id });
      const qs = new URLSearchParams();
      if (params?.checkIn) qs.set("checkIn", params.checkIn);
      if (params?.checkOut) qs.set("checkOut", params.checkOut);
      if (params?.guests) qs.set("guests", params.guests);
      qs.set("currency", currency);
      qs.set("guestNationality", guestNationality);
      url += `?${qs.toString()}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return api.hotels.similar.responses[200].parse(await res.json());
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useHotelReviews(id: string) {
  return useQuery<ReviewsResponse>({
    queryKey: ["/api/hotels/reviews", id],
    queryFn: async () => {
      const url = buildUrl(api.hotels.reviews.path, { id });
      const res = await fetch(url);
      if (!res.ok) return { reviews: [], sentiment: null };
      const data = await res.json();
      if (Array.isArray(data)) {
        return { reviews: data, sentiment: null };
      }
      return data as ReviewsResponse;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSemanticSearch(query: string) {
  return useQuery<SemanticHotel[]>({
    queryKey: ["/api/hotels/semantic-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/hotels/semantic-search?query=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!query && query.length >= 3,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHotel(id: string, params?: { checkIn?: string; checkOut?: string; guests?: string }) {
  const { currency, language } = usePreferences();
  const guestNationality = LANG_TO_NATIONALITY[language] || "US";
  return useQuery({
    queryKey: [api.hotels.get.path, id, params, currency, guestNationality],
    queryFn: async () => {
      let url = buildUrl(api.hotels.get.path, { id });
      const queryParams = new URLSearchParams();
      if (params?.checkIn) queryParams.set("checkIn", params.checkIn);
      if (params?.checkOut) queryParams.set("checkOut", params.checkOut);
      if (params?.guests) queryParams.set("guests", params.guests);
      queryParams.set("currency", currency);
      queryParams.set("guestNationality", guestNationality);
      url += `?${queryParams.toString()}`;
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch hotel details");
      return api.hotels.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export async function askHotelAI(
  hotelId: string,
  question: string,
  hotelName: string,
  description: string,
  amenities: string[]
): Promise<string> {
  const res = await fetch(`/api/hotels/${hotelId}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, hotelName, description, amenities }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to get answer from AI");
  }

  const data = await res.json();
  return data.answer;
}

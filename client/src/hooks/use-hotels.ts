import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type HotelSearchResponse, type HotelDetailsResponse, type HotelFeaturedResponse } from "@shared/routes";

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
};

export function useFeaturedHotels() {
  return useQuery({
    queryKey: [api.hotels.featured.path],
    queryFn: async () => {
      const res = await fetch(api.hotels.featured.path);
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
  return useQuery({
    queryKey: [api.hotels.search.path, params],
    queryFn: async () => {
      const url = buildUrl(api.hotels.search.path);
      const queryParams = new URLSearchParams();
      if (params.destination) queryParams.set("destination", params.destination);
      if (params.placeId) queryParams.set("placeId", params.placeId);
      if (params.aiSearch) queryParams.set("aiSearch", params.aiSearch);
      queryParams.set("checkIn", params.checkIn);
      queryParams.set("checkOut", params.checkOut);
      if (params.guests) queryParams.set("guests", params.guests);

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
  return useQuery<NearbyHotel[]>({
    queryKey: [api.hotels.nearby.path, coords],
    queryFn: async () => {
      const res = await fetch(`${api.hotels.nearby.path}?lat=${coords!.lat}&lng=${coords!.lng}`);
      if (!res.ok) throw new Error("Failed to fetch nearby hotels");
      return res.json();
    },
    enabled: !!coords,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSimilarHotels(id: string) {
  return useQuery({
    queryKey: [api.hotels.similar.path, id],
    queryFn: async () => {
      const url = buildUrl(api.hotels.similar.path, { id });
      const res = await fetch(url);
      if (!res.ok) return [];
      return api.hotels.similar.responses[200].parse(await res.json());
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useHotel(id: string, params?: { checkIn?: string; checkOut?: string; guests?: string }) {
  return useQuery({
    queryKey: [api.hotels.get.path, id, params],
    queryFn: async () => {
      let url = buildUrl(api.hotels.get.path, { id });
      const queryParams = new URLSearchParams();
      if (params?.checkIn) queryParams.set("checkIn", params.checkIn);
      if (params?.checkOut) queryParams.set("checkOut", params.checkOut);
      if (params?.guests) queryParams.set("guests", params.guests);
      const qs = queryParams.toString();
      if (qs) url += `?${qs}`;
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch hotel details");
      return api.hotels.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

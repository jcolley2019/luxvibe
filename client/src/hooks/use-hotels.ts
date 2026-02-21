import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type HotelSearchResponse, type HotelDetailsResponse } from "@shared/routes";

// Search Hotels
export function useSearchHotels(params: {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests?: string;
}) {
  return useQuery({
    queryKey: [api.hotels.search.path, params],
    queryFn: async () => {
      const url = buildUrl(api.hotels.search.path);
      const queryParams = new URLSearchParams();
      queryParams.set("destination", params.destination);
      queryParams.set("checkIn", params.checkIn);
      queryParams.set("checkOut", params.checkOut);
      if (params.guests) queryParams.set("guests", params.guests);

      const res = await fetch(`${url}?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to search hotels");
      return api.hotels.search.responses[200].parse(await res.json());
    },
    enabled: !!params.destination && !!params.checkIn && !!params.checkOut,
  });
}

// Get Single Hotel Details
export function useHotel(id: string) {
  return useQuery({
    queryKey: [api.hotels.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.hotels.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch hotel details");
      return api.hotels.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

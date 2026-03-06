import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertBooking } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

export function useBookings() {
  return useQuery({
    queryKey: [api.bookings.list.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingData: InsertBooking) => {
      const res = await apiRequest(api.bookings.create.method, api.bookings.create.path, bookingData);
      return api.bookings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      toast({
        title: "Booking Confirmed!",
        description: "Your reservation has been successfully created.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}

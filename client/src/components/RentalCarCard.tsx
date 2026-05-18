import { Car, ExternalLink } from "lucide-react";

interface RentalCarCardProps {
  pickupDate?: string;
  returnDate?: string;
  destination?: string;
}

export function RentalCarCard({ pickupDate, returnDate, destination }: RentalCarCardProps) {
  if (import.meta.env.VITE_RENTAL_CAR_ENABLED !== "true") return null;

  const baseUrl =
    import.meta.env.VITE_RENTAL_CAR_AFFILIATE_URL ||
    "https://www.rentalcars.com";

  const params = new URLSearchParams();
  if (pickupDate) params.set("pickupDate", pickupDate);
  if (returnDate) params.set("dropoffDate", returnDate);
  if (destination) params.set("location", destination);

  const searchUrl = `${baseUrl}?${params.toString()}`;

  return (
    <div
      className="rounded-2xl border border-blue-200 dark:border-blue-800 overflow-hidden"
      data-testid="card-rental-car"
    >
      <div className="px-5 py-4 border-b border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 flex items-center gap-2">
        <Car className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Need a rental car?
        </p>
        <span className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
          Add to trip
        </span>
      </div>

      <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-card">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">
            Compare rental cars for your trip
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Economy, SUV, luxury, and more — from top carriers at your destination.
            Free cancellation on most bookings.
          </p>
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          data-testid="link-rental-car-search"
        >
          Search Cars
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

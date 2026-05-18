import { Car, ExternalLink } from "lucide-react";

const AFFILIATE_ID = import.meta.env.VITE_RENTAL_CAR_AFFILIATE_ID || "joeycl2019";
const BASE_URL = import.meta.env.VITE_RENTAL_CAR_AFFILIATE_URL || "https://www.discovercars.com";

interface RentalCarCardProps {
  pickupDate?: string;
  returnDate?: string;
  destination?: string;
}

export function RentalCarCard({ pickupDate, returnDate, destination }: RentalCarCardProps) {
  if (import.meta.env.VITE_RENTAL_CAR_ENABLED !== "true") return null;

  const params = new URLSearchParams({ a_aid: AFFILIATE_ID });
  if (destination) params.set("pick_up_place", destination);
  if (pickupDate) params.set("pick_up_date", pickupDate);
  if (returnDate) params.set("drop_off_date", returnDate);

  const searchUrl = `${BASE_URL}/united-states/?${params.toString()}`;

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
            Compare rental cars via DiscoverCars
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            500+ suppliers including Enterprise, Hertz, Avis &amp; Budget.
            Free cancellation on most bookings.
          </p>
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
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

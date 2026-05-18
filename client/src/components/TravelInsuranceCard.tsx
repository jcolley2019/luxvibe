import { ShieldCheck, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TravelInsuranceCardProps {
  departureDate?: string;
  returnDate?: string;
  travelers?: number;
  tripCost?: number;
  currency?: string;
  destination?: string;
}

export function TravelInsuranceCard({
  departureDate,
  returnDate,
  travelers = 1,
  tripCost,
  currency = "USD",
  destination,
}: TravelInsuranceCardProps) {
  if (import.meta.env.VITE_INSURANCE_ENABLED !== "true") return null;

  const baseUrl =
    import.meta.env.VITE_INSURANCE_AFFILIATE_URL ||
    "https://www.squaremouth.com/travel-insurance-quotes";

  const params = new URLSearchParams();
  if (departureDate) {
    try {
      params.set("DepartDate", format(parseISO(departureDate), "MM/dd/yyyy"));
    } catch {}
  }
  if (returnDate) {
    try {
      params.set("ReturnDate", format(parseISO(returnDate), "MM/dd/yyyy"));
    } catch {}
  }
  if (travelers) params.set("Travelers", String(travelers));
  if (tripCost) params.set("TripCost", String(Math.round(tripCost)));
  if (destination) params.set("DestCountry", destination);

  const quoteUrl = `${baseUrl}?${params.toString()}`;

  return (
    <div
      className="rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden"
      data-testid="card-travel-insurance"
    >
      <div className="px-5 py-4 border-b border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Protect your trip
        </p>
        <span className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
          Recommended
        </span>
      </div>

      <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-card">
        <div className="flex-1 space-y-1.5">
          <p className="text-sm text-muted-foreground">
            Travel insurance covers trip cancellations, medical emergencies, and
            lost baggage — so the unexpected doesn't ruin your plans.
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
              Trip cancellation &amp; interruption
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
              Emergency medical &amp; evacuation
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
              Lost, stolen, or delayed baggage
            </li>
          </ul>
        </div>

        <a
          href={quoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-insurance-quote"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Get a free quote
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

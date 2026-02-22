import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchHeroProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
}

export function SearchHero({ initialDestination, initialCheckIn, initialCheckOut, initialGuests }: SearchHeroProps) {
  const [, setLocation] = useLocation();
  const [destination, setDestination] = useState(initialDestination || "");

  const parseDate = (str?: string) => {
    if (!str) return undefined;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>(
    initialCheckIn ? { from: parseDate(initialCheckIn)!, to: parseDate(initialCheckOut) } : undefined
  );
  const [guests, setGuests] = useState(parseInt(initialGuests || "2"));

  const handleSearch = () => {
    if (!destination || !date?.from || !date?.to) return;
    const checkIn = format(date.from, "yyyy-MM-dd");
    const checkOut = format(date.to, "yyyy-MM-dd");
    const params = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      guests: String(guests),
    });
    try {
      const existing = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const entry = { destination, checkIn, checkOut, guests: String(guests) };
      const filtered = existing.filter((s: typeof entry) => s.destination !== destination);
      localStorage.setItem("recentSearches", JSON.stringify([entry, ...filtered].slice(0, 5)));
    } catch {}
    setLocation(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const dateLabel = date?.from
    ? date.to
      ? `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`
      : format(date.from, "MMM d")
    : "Add dates";

  const guestsLabel = `1 Room, ${guests} Guest${guests !== 1 ? "s" : ""}`;

  return (
    <div className="relative w-full bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop"
          alt="Luxury Resort"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/5" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">
          2 Million Hotels Worldwide
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 drop-shadow-xl">
          Luxury, <span className="text-blue-300">Unlocked.</span>
        </h1>
        <p className="text-white/80 text-lg mb-10">
          The world's finest hotels — at prices you didn't think were possible.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-3xl bg-white dark:bg-card rounded-full shadow-2xl flex items-stretch overflow-hidden px-2 py-2 gap-0">

          {/* Where */}
          <div className="flex-1 flex flex-col justify-center px-5 py-1 min-w-0">
            <span className="text-xs font-semibold text-foreground">Where</span>
            <input
              type="text"
              placeholder="Enter a destination"
              className="text-sm text-muted-foreground bg-transparent outline-none border-none placeholder:text-muted-foreground truncate w-full"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="input-destination"
            />
          </div>

          <div className="w-px bg-border self-stretch my-1" />

          {/* Dates */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex-1 flex flex-col justify-center px-5 py-1 min-w-0 hover:bg-muted/30 rounded-full transition-colors text-left"
                data-testid="button-dates"
              >
                <span className="text-xs font-semibold text-foreground">Dates</span>
                <span className={cn("text-sm truncate", date ? "text-muted-foreground" : "text-muted-foreground")}>
                  {dateLabel}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={(range) => setDate(range as { from: Date; to?: Date } | undefined)}
                numberOfMonths={2}
                disabled={(d) => d < new Date()}
              />
            </PopoverContent>
          </Popover>

          <div className="w-px bg-border self-stretch my-1" />

          {/* Guests */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex-1 flex flex-col justify-center px-5 py-1 min-w-0 hover:bg-muted/30 rounded-full transition-colors text-left"
                data-testid="button-guests"
              >
                <span className="text-xs font-semibold text-foreground">Guests</span>
                <span className="text-sm text-muted-foreground truncate">{guestsLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Adults</div>
                    <div className="text-xs text-muted-foreground">Ages 18+</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg font-medium"
                    >−</button>
                    <span className="w-4 text-center font-medium">{guests}</span>
                    <button
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg font-medium"
                    >+</button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
            data-testid="button-search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

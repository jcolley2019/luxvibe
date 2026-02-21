import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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
  const [guests, setGuests] = useState(initialGuests || "2");

  const handleSearch = () => {
    if (!destination || !date?.from || !date?.to) return;
    const params = new URLSearchParams({
      destination,
      checkIn: format(date.from, "yyyy-MM-dd"),
      checkOut: format(date.to, "yyyy-MM-dd"),
      guests,
    });
    setLocation(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="relative w-full bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop"
          alt="Luxury Resort"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">
          2 Million Hotels Worldwide
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 drop-shadow-xl">
          Same Luxury. <span className="text-blue-300">Better Prices.</span>
        </h1>
        <p className="text-white/80 text-lg mb-10">
          Find and book top-rated hotels at unbeatable rates.
        </p>

        <div className="w-full max-w-3xl bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-border">
              <MapPin className="text-primary w-5 h-5 shrink-0 mr-3" />
              <Input
                placeholder="Where are you going?"
                className="border-0 shadow-none focus-visible:ring-0 p-0 text-base h-auto bg-transparent placeholder:text-muted-foreground"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid="input-destination"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-border text-left hover:bg-muted/30 transition-colors",
                    !date && "text-muted-foreground"
                  )}
                  data-testid="button-dates"
                >
                  <CalendarIcon className="w-5 h-5 shrink-0 mr-3 text-primary" />
                  <span className="text-base">
                    {date?.from ? (
                      date.to ? (
                        `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`
                      ) : (
                        format(date.from, "MMM d")
                      )
                    ) : (
                      "Check-in date — Check-out date"
                    )}
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

            <div className="flex items-center px-4 py-3 border-b md:border-b-0 border-border md:w-56">
              <Users className="w-5 h-5 shrink-0 mr-3 text-primary" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-base text-foreground whitespace-nowrap">
                  {guests} adult{parseInt(guests) !== 1 ? "s" : ""} · 0 children · 1 room
                </span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full h-1 mt-1 accent-primary cursor-pointer"
                  data-testid="input-guests"
                />
              </div>
            </div>

            <div className="p-2">
              <Button
                size="lg"
                className="w-full h-full px-8 text-base font-semibold rounded-xl"
                onClick={handleSearch}
                data-testid="button-search"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

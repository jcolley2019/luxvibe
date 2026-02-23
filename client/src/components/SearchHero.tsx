import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Search, MapPin, Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface SearchHeroProps {
  initialDestination?: string;
  initialPlaceId?: string;
  initialAiSearch?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
}

export function SearchHero({
  initialDestination,
  initialPlaceId,
  initialAiSearch,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: SearchHeroProps) {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"destination" | "vibe">(initialAiSearch ? "vibe" : "destination");
  const [destination, setDestination] = useState(initialDestination || "");
  const [placeId, setPlaceId] = useState(initialPlaceId || "");
  const [aiSearch, setAiSearch] = useState(initialAiSearch || "");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { data: places = [] } = useQuery({
    queryKey: ["/api/places", destination],
    queryFn: async () => {
      if (!destination || destination.length < 3) return [];
      const res = await fetch(`/api/places?q=${encodeURIComponent(destination)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: mode === "destination" && destination.length >= 3,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseDate = (str?: string) => {
    if (!str) return undefined;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>(
    initialCheckIn ? { from: parseDate(initialCheckIn)!, to: parseDate(initialCheckOut) } : undefined
  );
  const [dateOpen, setDateOpen] = useState(false);
  const [guests, setGuests] = useState(parseInt(initialGuests || "2"));

  const handleSearch = () => {
    if (!date?.from || !date?.to) return;
    if (mode === "destination" && !destination) return;
    if (mode === "vibe" && !aiSearch) return;

    const checkIn = format(date.from, "yyyy-MM-dd");
    const checkOut = format(date.to, "yyyy-MM-dd");
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });

    if (mode === "destination") {
      params.set("destination", destination);
      if (placeId) params.set("placeId", placeId);
    } else {
      params.set("aiSearch", aiSearch);
    }

    try {
      const existing = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const entry = { destination: mode === "destination" ? destination : aiSearch, checkIn, checkOut, guests: String(guests) };
      const filtered = existing.filter((s: any) => s.destination !== entry.destination);
      localStorage.setItem("recentSearches", JSON.stringify([entry, ...filtered].slice(0, 5)));
    } catch {}

    setLocation(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showAutocomplete && places.length > 0) {
        const first = places[0] as any;
        setDestination(first.displayName || first.placeId);
        setPlaceId(first.placeId);
        setShowAutocomplete(false);
      } else {
        handleSearch();
      }
    }
  };

  const dateLabel = date?.from
    ? date.to
      ? `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`
      : format(date.from, "MMM d")
    : "Add dates";

  const guestsLabel = `1 Room, ${guests} Guest${guests !== 1 ? "s" : ""}`;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Rounded hero card */}
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ minHeight: 460 }}>

        {/* Split photo background */}
        <div className="absolute inset-0 flex">
          <div
            className="flex-1 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80')" }}
          />
          <div
            className="flex-1 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80')" }}
          />
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Same Stays. Better Prices.
          </h1>
          <p className="text-white/80 text-base mb-8">2 Million Hotels Worldwide</p>

          {/* Search bar */}
          <div className="w-full max-w-2xl bg-white dark:bg-card rounded-full shadow-xl flex items-stretch overflow-visible px-1 py-1 gap-0">

            {/* Where / Vibe input */}
            <div className="flex-[2] flex flex-col justify-center px-4 py-1.5 min-w-0 relative" ref={autocompleteRef}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide text-left">
                {mode === "destination" ? "Where" : "Vibe"}
              </span>
              {mode === "destination" ? (
                <>
                  <input
                    type="text"
                    placeholder="Enter a destination"
                    className="text-sm text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate w-full"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setPlaceId("");
                      setShowAutocomplete(true);
                    }}
                    onFocus={() => setShowAutocomplete(true)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-destination"
                  />
                  {showAutocomplete && places.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {(places as any[]).map((place: any) => (
                        <button
                          key={place.placeId}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                          onClick={() => {
                            setDestination(place.displayName || place.placeId);
                            setPlaceId(place.placeId);
                            setShowAutocomplete(false);
                          }}
                        >
                          <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{place.displayName || place.placeId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. 'romantic beachfront resort'"
                  className="text-sm text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate w-full"
                  value={aiSearch}
                  onChange={(e) => setAiSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  data-testid="input-vibe"
                />
              )}
            </div>

            <div className="w-px bg-gray-200 self-stretch my-2" />

            {/* Dates */}
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 flex flex-col justify-center px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left"
                  data-testid="button-dates"
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Dates</span>
                  <span className="text-sm text-gray-700 dark:text-foreground truncate">{dateLabel}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={(range) => {
                    const r = range as { from: Date; to?: Date } | undefined;
                    setDate(r);
                    if (r?.to) setDateOpen(false);
                  }}
                  numberOfMonths={2}
                  disabled={(d) => d < new Date()}
                />
              </PopoverContent>
            </Popover>

            <div className="w-px bg-gray-200 self-stretch my-2" />

            {/* Guests */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 flex flex-col justify-center px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left"
                  data-testid="button-guests"
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Guests</span>
                  <span className="text-sm text-gray-700 dark:text-foreground truncate">{guestsLabel}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
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
              </PopoverContent>
            </Popover>

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="shrink-0 w-11 h-11 m-0.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow"
              data-testid="button-search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Vibe toggle */}
          <button
            onClick={() => setMode(mode === "destination" ? "vibe" : "destination")}
            className="mt-4 flex items-center gap-1.5 text-white/70 hover:text-white text-xs transition-colors"
            data-testid="button-toggle-mode"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {mode === "destination" ? "Try AI vibe search instead" : "Switch to destination search"}
          </button>
        </div>
      </div>
    </div>
  );
}

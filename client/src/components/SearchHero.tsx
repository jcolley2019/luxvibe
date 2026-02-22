import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, Sparkles, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

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
  initialGuests 
}: SearchHeroProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"destination" | "vibe">(initialAiSearch ? "vibe" : "destination");
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
    enabled: activeTab === "destination" && destination.length >= 3,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
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
  const [guests, setGuests] = useState(parseInt(initialGuests || "2"));

  const handleSearch = () => {
    if (!date?.from || !date?.to) return;
    if (activeTab === "destination" && !destination) return;
    if (activeTab === "vibe" && !aiSearch) return;

    const checkIn = format(date.from, "yyyy-MM-dd");
    const checkOut = format(date.to, "yyyy-MM-dd");
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });

    if (activeTab === "destination") {
      params.set("destination", destination);
      if (placeId) params.set("placeId", placeId);
    } else {
      params.set("aiSearch", aiSearch);
    }

    try {
      const existing = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const entry = { 
        destination: activeTab === "destination" ? destination : aiSearch, 
        checkIn, 
        checkOut, 
        guests: String(guests) 
      };
      const filtered = existing.filter((s: any) => s.destination !== entry.destination);
      localStorage.setItem("recentSearches", JSON.stringify([entry, ...filtered].slice(0, 5)));
    } catch {}
    setLocation(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showAutocomplete && places.length > 0) {
        const firstPlace = places[0];
        setDestination(firstPlace.displayName);
        setPlaceId(firstPlace.placeId);
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
    <div className="relative w-full bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop"
          alt="Luxury Resort"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/20" />
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

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as any)} 
          className="w-full max-w-3xl mb-4"
        >
          <TabsList className="bg-black/20 backdrop-blur-md border border-white/10 p-1 rounded-full h-12">
            <TabsTrigger 
              value="destination" 
              className="rounded-full px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Destination
            </TabsTrigger>
            <TabsTrigger 
              value="vibe" 
              className="rounded-full px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Search by Vibe
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search bar */}
        <div className="w-full max-w-3xl bg-white dark:bg-card rounded-3xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-stretch overflow-visible px-2 py-2 gap-0">

          {/* Input Area */}
          <div className="flex-1 flex flex-col justify-center px-5 py-2 min-w-0 relative">
            <span className="text-xs font-semibold text-foreground text-left">
              {activeTab === "destination" ? "Where" : "Describe the vibe"}
            </span>
            {activeTab === "destination" ? (
              <div ref={autocompleteRef} className="w-full">
                <input
                  type="text"
                  placeholder="Enter a destination"
                  className="text-sm text-muted-foreground bg-transparent outline-none border-none placeholder:text-muted-foreground truncate w-full"
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
                    {places.map((place: any) => (
                      <button
                        key={place.placeId}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        onClick={() => {
                          setDestination(place.displayName);
                          setPlaceId(place.placeId);
                          setShowAutocomplete(false);
                        }}
                      >
                        <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{place.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Try 'romantic getaway in Paris' or 'beachfront resort'"
                className="text-sm text-muted-foreground bg-transparent outline-none border-none placeholder:text-muted-foreground truncate w-full"
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid="input-vibe"
              />
            )}
          </div>

          <div className="hidden md:block w-px bg-border self-stretch my-1" />

          {/* Dates */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex-1 flex flex-col justify-center px-5 py-2 min-w-0 hover:bg-muted/30 rounded-full transition-colors text-left"
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

          <div className="hidden md:block w-px bg-border self-stretch my-1" />

          {/* Guests */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex-1 flex flex-col justify-center px-5 py-2 min-w-0 hover:bg-muted/30 rounded-full transition-colors text-left"
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
            className="shrink-0 w-full md:w-12 h-12 rounded-2xl md:rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md mt-2 md:mt-0"
            data-testid="button-search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

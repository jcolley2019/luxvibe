import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  Search, MapPin, CalendarDays, Users, Building2, Star, 
  BedDouble, Plane, Info, X, ChevronRight, Plus, Minus, Sparkles
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

interface SearchHeroProps {
  variant?: "hero" | "navbar";
  heroImage?: string;
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
}

export default function SearchHero({ 
  variant = "hero",
  heroImage = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2000",
  initialDestination = "",
  initialCheckIn,
  initialCheckOut,
  initialGuests = "2"
}: SearchHeroProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [destination, setDestination] = useState(initialDestination);
  const [placeId, setPlaceId] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  
  const [date, setDate] = useState<{ from: Date; to: Date } | undefined>(() => {
    if (initialCheckIn && initialCheckOut) {
      try {
        return {
          from: new Date(initialCheckIn),
          to: new Date(initialCheckOut)
        };
      } catch (e) {
        console.error("Invalid initial dates", e);
      }
    }
    return {
      from: addDays(new Date(), 7),
      to: addDays(new Date(), 14),
    };
  });

  const [guests, setGuests] = useState(() => {
    const total = parseInt(initialGuests) || 2;
    return { adults: total, children: 0 };
  });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<"destination" | "vibe">("destination");

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const mobileAutocompleteRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
      if (mobileAutocompleteRef.current && !mobileAutocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: places = [] } = useQuery({
    queryKey: ["/api/places", destination],
    enabled: destination.length >= 2 && showAutocomplete,
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (mode === "vibe" && aiSearch) {
      params.set("aiSearch", aiSearch);
    } else if (placeId) {
      params.set("placeId", placeId);
    } else if (destination) {
      params.set("destination", destination);
    }

    if (date?.from) params.set("checkin", format(date.from, "yyyy-MM-dd"));
    if (date?.to) params.set("checkout", format(date.to, "yyyy-MM-dd"));
    params.set("adults", guests.adults.toString());
    params.set("children", guests.children.toString());

    setLocation(`/hotels/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleCalendarOpen = () => {
    setGuestsOpen(false);
    setShowAutocomplete(false);
  };

  const dateLabel = date?.from && date?.to 
    ? `${format(date.from, "MMM d")} - ${format(date.to, "MMM d")}`
    : "Select dates";

  const guestsLabel = `${guests.adults} ${guests.adults === 1 ? 'Adult' : 'Adults'}${guests.children > 0 ? `, ${guests.children} ${guests.children === 1 ? 'Child' : 'Children'}` : ''}`;

  const autocompleteList = places.length > 0 && (
    <div className="absolute top-full left-0 z-[100] mt-2 bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-full min-w-[300px] max-h-[400px] overflow-y-auto">
      {places.map((place: any, idx: number) => {
        const types: string[] = place.types || [];
        const isHotelType = String(place.placeId).startsWith("hotel:") || types.some((t: string) => ["lodging", "hotel"].includes(t));
        const isAirport = types.includes("airport");
        const isLocality = types.some((t: string) => ["locality", "administrative_area_level_1", "country", "colloquial_area"].includes(t));
        const PlaceIcon = isAirport ? Plane : isHotelType ? BedDouble : isLocality ? Building2 : MapPin;
        const name = place.displayName || place.placeId;

        return (
          <button
            key={place.placeId}
            className={cn(
              "w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-gray-50 last:border-none",
              idx === 0 ? "bg-blue-50/50 dark:bg-muted/60" : "hover:bg-gray-50 dark:hover:bg-muted/40"
            )}
            onClick={() => {
              if (place.hotelId) {
                setLocation(`/hotel/${place.hotelId}`);
              } else {
                setDestination(name);
                setPlaceId(place.placeId);
              }
              setShowAutocomplete(false);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
              <PlaceIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 dark:text-foreground truncate">{name}</div>
              {place.formattedAddress && (
                <div className="text-xs text-gray-400 dark:text-muted-foreground truncate">{place.formattedAddress}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const calendarContent = (numberOfMonths: number) => (
    <div className="bg-white dark:bg-card p-4 rounded-3xl">
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={setDate}
        numberOfMonths={numberOfMonths}
        disabled={(date) => date < new Date()}
        className="rounded-xl border-none"
        classNames={{
          day_range_middle: "bg-blue-50 text-blue-900",
          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
          day_today: "bg-gray-100 text-gray-900",
        }}
      />
    </div>
  );

  const makeGuestsPopoverContent = (alignOffset = 0) => (
    <PopoverContent className="w-80 p-6 rounded-3xl shadow-2xl border border-border bg-white dark:bg-card z-[100]" align="end" alignOffset={alignOffset} sideOffset={12}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-foreground">Adults</p>
            <p className="text-xs text-gray-400">Ages 13 or above</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={() => setGuests(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-4 text-center">{guests.adults}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={() => setGuests(prev => ({ ...prev, adults: prev.adults + 1 }))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-foreground">Children</p>
            <p className="text-xs text-gray-400">Ages 2–12</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={() => setGuests(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-4 text-center">{guests.children}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={() => setGuests(prev => ({ ...prev, children: prev.children + 1 }))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </PopoverContent>
  );

  if (variant === "navbar") {
    return (
      <div className="hidden md:flex flex-col items-center w-full max-w-2xl">
        <div className="flex w-full bg-white dark:bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow items-stretch overflow-visible px-1 py-0.5 gap-0">
          <div className="flex-1 flex flex-col justify-center px-3 py-0.5 min-w-0 relative border-r border-border" ref={autocompleteRef}>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide text-left leading-tight">
              {t("search.destination_tab")}
            </span>
            <input
              type="text"
              placeholder="Enter a destination"
              className="text-xs text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate w-full"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); }}
              onFocus={() => setShowAutocomplete(true)}
              onKeyDown={handleKeyDown}
              data-testid="input-destination-navbar"
            />
            {showAutocomplete && autocompleteList}
          </div>

          <Popover open={dateOpen} onOpenChange={(open) => { setDateOpen(open); if (open) { setGuestsOpen(false); handleCalendarOpen(); } }}>
            <PopoverTrigger asChild>
              <button
                className="flex-1 flex flex-col justify-center px-3 py-0.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left border-r border-border relative"
                data-testid="button-dates-navbar"
              >
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{t("search.checkin")} / {t("search.checkout")}</span>
                <span className="text-xs text-gray-700 dark:text-foreground truncate">{dateLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              {calendarContent(2)}
            </PopoverContent>
          </Popover>

          <Popover open={guestsOpen} onOpenChange={(open) => { setGuestsOpen(open); if (open) setDateOpen(false); }}>
            <PopoverTrigger asChild>
              <button
                className="flex-1 flex flex-col justify-center px-3 py-0.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left border-r border-border"
                data-testid="button-guests-navbar"
              >
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{t("search.guests")}</span>
                <span className="text-xs text-gray-700 dark:text-foreground truncate">{guestsLabel}</span>
              </button>
            </PopoverTrigger>
            {makeGuestsPopoverContent()}
          </Popover>

          <button
            onClick={handleSearch}
            className="shrink-0 w-8 h-8 m-0.5 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow"
            data-testid="button-search-navbar"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", variant === "hero" ? "h-[638px] overflow-hidden" : "h-auto")}>
      {variant === "hero" && (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={heroImage}
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center h-full pt-20">
        <div className="mb-8">
          <h1 className="text-3xl md:text-7xl font-bold text-white mb-3 drop-shadow-lg leading-tight">
            Luxury Stays. Unbeatable Rates.
          </h1>
          <p className="text-white text-lg font-medium tracking-wide mb-4 text-center">Discover stays that redefine extraordinary</p>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white text-sm font-medium drop-shadow-md">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 opacity-90" />
              <span className="whitespace-nowrap">2M+ Hotels Worldwide</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 opacity-90" />
              <span className="whitespace-nowrap">190+ Countries</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="whitespace-nowrap">4.9/5 Guest Rating</span>
            </div>
          </div>
        </div>

        {/* ── MOBILE search card (shown below md) ── */}
        <div className="md:hidden w-full px-3 relative z-10 -mt-10">
          <div className="w-full max-w-sm mx-auto bg-white dark:bg-card rounded-2xl shadow-xl overflow-visible border border-border/50">
            <div className="flex flex-col">
              {/* Top row: Destination and Dates */}
              <div className="flex border-b border-gray-100 dark:border-border">
                <div className="flex-[1.5] relative border-r border-gray-100 dark:border-border" ref={mobileAutocompleteRef}>
                  <div className="flex items-center gap-2 px-3 py-3">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      placeholder="Destination"
                      className="flex-1 text-sm text-gray-800 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 min-w-0"
                      value={destination}
                      onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); }}
                      onFocus={() => { setShowAutocomplete(true); setDateOpen(false); setGuestsOpen(false); setMode("destination"); }}
                      onKeyDown={handleKeyDown}
                      data-testid="input-destination"
                    />
                  </div>
                  {showAutocomplete && mode === "destination" && autocompleteList}
                </div>

                <Popover open={dateOpen && isMobile} onOpenChange={(open) => { setDateOpen(open); if (open) { setGuestsOpen(false); handleCalendarOpen(); } }}>
                  <PopoverTrigger asChild>
                    <button
                      className="flex-1 flex items-center gap-2 px-3 py-3 text-left active:bg-gray-50 transition-colors truncate"
                      data-testid="button-date-mobile"
                    >
                      <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm text-gray-800 dark:text-foreground truncate">{dateLabel}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-32px)] p-0 border-none shadow-2xl rounded-3xl" align="center" sideOffset={8}>
                    {calendarContent(1)}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Bottom row: Guests and Search Button */}
              <div className="flex items-center px-3 py-2 gap-2">
                <Popover open={guestsOpen && isMobile} onOpenChange={(open) => { setGuestsOpen(open); if (open) setDateOpen(false); }}>
                  <PopoverTrigger asChild>
                    <button
                      className="flex-1 flex items-center gap-2 px-1 text-left active:bg-gray-50 transition-colors truncate"
                      data-testid="button-guests-mobile"
                    >
                      <Users className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm text-gray-800 dark:text-foreground truncate">{guestsLabel}</span>
                    </button>
                  </PopoverTrigger>
                  {makeGuestsPopoverContent()}
                </Popover>

                <button
                  onClick={handleSearch}
                  className="shrink-0 h-10 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── DESKTOP content (shown at md+) ── */}
        <div className="hidden md:flex flex-col items-center mt-12 w-full max-w-4xl">
          <div className="w-full bg-white dark:bg-card rounded-3xl shadow-2xl overflow-visible items-stretch px-2 py-2 gap-0 relative flex border border-white/10" ref={searchBarRef}>
            <div className="flex-1 flex items-center gap-0">
              <div className="flex-[1.2] relative px-6 py-3 border-r border-border text-left" ref={autocompleteRef}>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter a destination"
                    className="flex-1 text-base text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate font-medium"
                    value={destination}
                    onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); }}
                    onFocus={() => { setShowAutocomplete(true); setDateOpen(false); setGuestsOpen(false); }}
                    onKeyDown={handleKeyDown}
                    data-testid="input-destination-desktop"
                  />
                </div>
                {showAutocomplete && mode === "destination" && autocompleteList}
              </div>

              <Popover open={dateOpen && !isMobile} onOpenChange={(open) => { setDateOpen(open); if (open) { setGuestsOpen(false); handleCalendarOpen(); } }}>
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 px-6 py-3 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left border-r border-border relative"
                    data-testid="button-dates-desktop"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-blue-600 shrink-0" />
                      <span className="text-base text-gray-700 dark:text-foreground font-medium truncate">{dateLabel}</span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[800px] p-0 border-none shadow-2xl rounded-3xl z-[100]" align="center" sideOffset={12}>
                  {calendarContent(2)}
                </PopoverContent>
              </Popover>

              <Popover open={guestsOpen && !isMobile} onOpenChange={(open) => { setGuestsOpen(open); if (open) setDateOpen(false); }}>
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 px-6 py-3 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left relative"
                    data-testid="button-guests-desktop"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600 shrink-0" />
                      <span className="text-base text-gray-700 dark:text-foreground font-medium truncate">{guestsLabel}</span>
                    </div>
                  </button>
                </PopoverTrigger>
                {makeGuestsPopoverContent(-48)}
              </Popover>

              <button
                onClick={handleSearch}
                className="shrink-0 w-14 h-14 m-1 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-md active:scale-95"
                data-testid="button-search-desktop"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

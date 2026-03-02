import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  Search, MapPin, CalendarDays, Users, Building2, Star, 
  BedDouble, Plane, X, Plus, Minus, Navigation, Loader2
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
  
  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>(() => {
    if (initialCheckIn && initialCheckOut) {
      try {
        return { from: new Date(initialCheckIn), to: new Date(initialCheckOut) };
      } catch {}
    }
    return { from: addDays(new Date(), 7), to: addDays(new Date(), 14) };
  });

  const [guests, setGuests] = useState(() => {
    const total = parseInt(initialGuests) || 2;
    return { adults: total, children: 0 };
  });

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [mobileDateOpen, setMobileDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [mobileGuestsOpen, setMobileGuestsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarWidth, setCalendarWidth] = useState<number | undefined>();
  const [selectionStep, setSelectionStep] = useState<"checkin" | "checkout">("checkin");
  const [geoLoading, setGeoLoading] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const mobileAutocompleteRef = useRef<HTMLDivElement>(null);
  const desktopSearchBarRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!desktopSearchBarRef.current) return;
    const measure = () => setCalendarWidth(desktopSearchBarRef.current?.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(desktopSearchBarRef.current);
    return () => ro.disconnect();
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

  const { data: places = [], isLoading: placesLoading } = useQuery({
    queryKey: ["/api/places", destination],
    enabled: destination.length >= 2 && showAutocomplete,
    staleTime: 60000,
    queryFn: async () => {
      const res = await fetch(`/api/places?q=${encodeURIComponent(destination)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch places");
      return res.json();
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (placeId) {
      params.set("placeId", placeId);
      params.set("destination", destination);
    } else if (destination && destination !== "Around my area") {
      params.set("destination", destination);
    }
    if (date?.from) params.set("checkIn", format(date.from, "yyyy-MM-dd"));
    if (date?.to) params.set("checkOut", format(date.to, "yyyy-MM-dd"));
    params.set("guests", (guests.adults + guests.children).toString());
    setLocation(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setShowAutocomplete(false);
        const params = new URLSearchParams();
        params.set("nearMe", "1");
        params.set("lat", pos.coords.latitude.toString());
        params.set("lng", pos.coords.longitude.toString());
        if (date?.from) params.set("checkIn", format(date.from, "yyyy-MM-dd"));
        if (date?.to) params.set("checkOut", format(date.to, "yyyy-MM-dd"));
        params.set("guests", (guests.adults + guests.children).toString());
        setDestination("Around my area");
        setLocation(`/?${params.toString()}`);
      },
      () => {
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const openCalendar = () => {
    setSelectionStep("checkin");
    setDate(undefined);
    setDateOpen(true);
    setGuestsOpen(false);
    setShowAutocomplete(false);
  };

  const handleDateSelect = (range: any, autoClose = false) => {
    if (selectionStep === "checkin") {
      const from = range?.from ?? range?.to;
      if (!from) return;
      setDate({ from });
      setSelectionStep("checkout");
    } else {
      if (!date?.from) return;
      const to = range?.to;
      if (!to || to <= date.from) return;
      setDate({ from: date.from, to });
      if (autoClose) {
        setTimeout(() => {
          setDateOpen(false);
          setSelectionStep("checkin");
        }, 300);
      } else {
        setSelectionStep("checkin");
      }
    }
  };

  const mobileDateLabel = date?.from && date?.to
    ? `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`
    : "Add dates";

  const desktopDateLabel = date?.from && date?.to
    ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}`
    : "Add dates";

  const mobileGuestsLabel = `1 Room, ${guests.adults} ${guests.adults === 1 ? "adult" : "adults"}${guests.children > 0 ? `, ${guests.children} ${guests.children === 1 ? "child" : "children"}` : ""}`;
  const desktopGuestsLabel = `1 Room, ${guests.adults + guests.children} ${guests.adults + guests.children === 1 ? "Guest" : "Guests"}`;

  const calendarHeader = selectionStep === "checkin"
    ? "When do you want to check in?"
    : "Now select your check-out date";

  const isCheckoutStep = selectionStep === "checkout";

  const nearMeButton = (
    <button
      onClick={handleNearMe}
      disabled={geoLoading}
      className="w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/40"
    >
      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
        {geoLoading
          ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          : <Navigation className="w-4 h-4 text-blue-600" />
        }
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800 dark:text-foreground">Around my area</div>
        <div className="text-xs text-gray-400">Find hotels near your current location</div>
      </div>
    </button>
  );

  const autocompleteDropdown = showAutocomplete && (
    <div className="absolute top-full left-0 z-[200] mt-2 bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-full min-w-[280px] max-h-[380px] overflow-y-auto">
      {nearMeButton}
      {destination.length >= 2 && placesLoading && (
        <div className="px-4 py-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-gray-100 dark:bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
      {destination.length >= 2 && !placesLoading && (places as any[]).length === 0 && (
        <div className="px-4 py-4 text-sm text-gray-400 dark:text-muted-foreground text-center">
          No destinations found for "<span className="font-medium text-gray-600 dark:text-foreground">{destination}</span>"
        </div>
      )}
      {(places as any[]).map((place: any, idx: number) => {
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
              "w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-gray-50 dark:border-border/50 last:border-none",
              idx === 0 ? "bg-blue-50/40 dark:bg-muted/40" : "hover:bg-gray-50 dark:hover:bg-muted/40"
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
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
              <PlaceIcon className="w-4 h-4 text-blue-600" />
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

  const mobileCalendarContent = (
    <div className="luxvibe-calendar px-3 pb-1">
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={(r) => handleDateSelect(r, false)}
        numberOfMonths={1}
        weekStartsOn={0}
        disabled={(d) => isCheckoutStep && date?.from ? d <= date.from : d < new Date()}
        className="border-none p-0 w-full"
        classNames={{
          months: "flex flex-col w-full",
          month: "w-full space-y-2",
          caption: "flex justify-center pt-1 pb-2 relative items-center",
          caption_label: "text-sm font-semibold text-gray-900 dark:text-foreground",
          nav_button: cn(
            "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 border border-gray-200 dark:border-border rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted transition-colors"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          head_row: "flex w-full",
          head_cell: "flex-1 text-gray-400 dark:text-muted-foreground font-medium text-xs text-center py-1",
          row: "flex w-full mt-0.5",
          cell: "flex-1 h-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-10 w-10 p-0 mx-auto font-normal text-sm rounded-full aria-selected:opacity-100 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-muted transition-colors",
          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-full",
          day_range_middle: "day-range-middle aria-selected:bg-transparent aria-selected:text-blue-800 dark:aria-selected:text-blue-300 hover:bg-transparent",
          day_range_end: "day-range-end bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white",
          day_range_start: "day-range-start bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white",
          day_today: "font-bold text-blue-600 dark:text-blue-400",
          day_outside: "text-gray-300 dark:text-muted-foreground/40 aria-selected:text-gray-400",
          day_disabled: "text-gray-200 dark:text-muted-foreground/30 cursor-not-allowed",
          day_hidden: "invisible",
        }}
      />
    </div>
  );

  const desktopCalendarContent = (
    <div className="luxvibe-calendar">
      <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-border mb-2">
        <p
          key={calendarHeader}
          className="text-base font-bold text-gray-900 dark:text-foreground tracking-tight transition-all duration-200"
          style={{ animation: "fadeSlideIn 0.18s ease" }}
        >
          {calendarHeader}
        </p>
        {isCheckoutStep && date?.from && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
            Check-in: {format(date.from, "MMM d, yyyy")}
          </p>
        )}
      </div>
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={(r) => handleDateSelect(r, true)}
        numberOfMonths={2}
        weekStartsOn={0}
        disabled={(d) => isCheckoutStep && date?.from ? d <= date.from : d < new Date()}
        className="px-6 pb-6 rounded-none border-none w-full"
        classNames={{
          months: "flex flex-row w-full [&>div:last-child]:border-l [&>div:last-child]:border-gray-200 dark:[&>div:last-child]:border-border [&>div:last-child]:pl-6 space-y-0 space-x-0",
          month: "flex-1 space-y-3 min-w-0",
          caption: "flex justify-center pt-1 pb-2 relative items-center",
          caption_label: "text-sm font-semibold text-gray-900 dark:text-foreground",
          nav_button: cn(
            "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 border border-gray-200 dark:border-border rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted transition-colors"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          head_row: "flex w-full",
          head_cell: "flex-1 text-gray-400 dark:text-muted-foreground font-medium text-xs text-center py-1",
          row: "flex w-full mt-0.5",
          cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-9 w-9 p-0 mx-auto font-normal text-sm rounded-full aria-selected:opacity-100 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-muted transition-colors",
          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-full",
          day_range_middle: "day-range-middle aria-selected:bg-transparent aria-selected:text-blue-800 dark:aria-selected:text-blue-300 hover:bg-transparent",
          day_range_end: "day-range-end bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white",
          day_range_start: "day-range-start bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white",
          day_today: "font-bold text-blue-600",
          day_outside: "text-gray-300 dark:text-muted-foreground/40 aria-selected:text-gray-400",
          day_disabled: "text-gray-200 dark:text-muted-foreground/30 cursor-not-allowed",
          day_hidden: "invisible",
        }}
      />
    </div>
  );

  const guestsContent = (
    <div className="space-y-6 p-6">
      {[
        { label: "Adults", sub: "Ages 13 or above", key: "adults" as const, min: 1 },
        { label: "Children", sub: "Ages 2–12", key: "children" as const, min: 0 },
      ].map(({ label, sub, key, min }) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{label}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"
              onClick={() => setGuests(prev => ({ ...prev, [key]: Math.max(min, prev[key] - 1) }))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-4 text-center">{guests[key]}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"
              onClick={() => setGuests(prev => ({ ...prev, [key]: prev[key] + 1 }))}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const makeGuestsPopoverContent = (alignOffset = 0) => (
    <PopoverContent className="w-80 p-0 rounded-3xl shadow-2xl border border-border bg-white dark:bg-card z-[100]" align="end" alignOffset={alignOffset} sideOffset={12}>
      {guestsContent}
    </PopoverContent>
  );

  // ── NAVBAR VARIANT ──
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
            {autocompleteDropdown}
          </div>

          <Popover open={dateOpen} onOpenChange={(open) => { setDateOpen(open); if (open) setGuestsOpen(false); }}>
            <PopoverTrigger asChild>
              <button className="flex-1 flex flex-col justify-center px-3 py-0.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left border-r border-border" data-testid="button-dates-navbar">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{t("search.checkin")} / {t("search.checkout")}</span>
                <span className="text-xs text-gray-700 dark:text-foreground truncate">{mobileDateLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              {mobileCalendarContent}
            </PopoverContent>
          </Popover>

          <Popover open={guestsOpen} onOpenChange={(open) => { setGuestsOpen(open); if (open) setDateOpen(false); }}>
            <PopoverTrigger asChild>
              <button className="flex-1 flex flex-col justify-center px-3 py-0.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left border-r border-border" data-testid="button-guests-navbar">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{t("search.guests")}</span>
                <span className="text-xs text-gray-700 dark:text-foreground truncate">{mobileGuestsLabel}</span>
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

  // ── HERO VARIANT ──
  return (
    <>
      {/* ── MOBILE layout (below md) ── */}
      <div className="md:hidden">
        <div className="relative h-[320px] overflow-hidden">
          <img src={heroImage} alt="Luxury Hotel" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <h1 className="text-[28px] font-bold text-white leading-tight mb-2 drop-shadow-lg">
              Luxury Stays.<br />Unbeatable Rates.
            </h1>
            <p className="text-white/90 text-sm font-medium drop-shadow-md">
              Discover stays that redefine extraordinary
            </p>
          </div>
        </div>

        <div className="relative -mt-12 mx-4 z-10 pb-2">
          {/* Date Dialog */}
          <Dialog open={mobileDateOpen} onOpenChange={(open) => { if (!open) { setSelectionStep("checkin"); } setMobileDateOpen(open); }}>
            <DialogContent className="w-[calc(100vw-32px)] max-w-sm p-0 rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
              <DialogTitle className="sr-only">{calendarHeader}</DialogTitle>
              <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-border">
                <div>
                  <h3
                    key={calendarHeader}
                    className="font-bold text-base text-foreground"
                    style={{ animation: "fadeSlideIn 0.18s ease" }}
                  >
                    {calendarHeader}
                  </h3>
                  {isCheckoutStep && date?.from && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
                      Check-in: {format(date.from, "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                <button onClick={() => setMobileDateOpen(false)} className="text-muted-foreground hover:text-foreground mt-0.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {mobileCalendarContent}
              <div className="px-5 pb-5 pt-2">
                <button
                  onClick={() => { if (date?.from && date?.to) setMobileDateOpen(false); }}
                  disabled={!date?.from || !date?.to}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-sm transition-colors",
                    date?.from && date?.to
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 dark:bg-muted text-gray-400 dark:text-muted-foreground cursor-not-allowed"
                  )}
                  data-testid="button-confirm-dates"
                >
                  {date?.from && date?.to ? "Confirm dates" : isCheckoutStep ? "Select check-out date" : "Select check-in date"}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Guests Dialog */}
          <Dialog open={mobileGuestsOpen} onOpenChange={setMobileGuestsOpen}>
            <DialogContent className="w-[calc(100vw-32px)] max-w-sm p-0 rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
              <DialogTitle className="sr-only">Guests</DialogTitle>
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <h3 className="font-bold text-base text-foreground">Guests</h3>
                <button onClick={() => setMobileGuestsOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {guestsContent}
              <div className="px-5 pb-5">
                <button onClick={() => setMobileGuestsOpen(false)} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm">
                  Confirm
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="bg-white dark:bg-card rounded-3xl shadow-2xl" ref={mobileAutocompleteRef}>
            <div className="relative px-5 py-4 border-b border-gray-100 dark:border-border">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter a destination"
                  className="flex-1 text-base text-gray-800 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 min-w-0"
                  value={destination}
                  onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); }}
                  onFocus={() => setShowAutocomplete(true)}
                  onKeyDown={handleKeyDown}
                  data-testid="input-destination"
                />
              </div>
              {showAutocomplete && (
                <div className="absolute top-full left-0 z-[200] mt-2 bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-full max-h-[320px] overflow-y-auto">
                  {nearMeButton}
                  {(places as any[]).map((place: any) => {
                    const types: string[] = place.types || [];
                    const isHotelType = String(place.placeId).startsWith("hotel:") || types.some((t: string) => ["lodging", "hotel"].includes(t));
                    const isAirport = types.includes("airport");
                    const isLocality = types.some((t: string) => ["locality", "administrative_area_level_1", "country", "colloquial_area"].includes(t));
                    const PlaceIcon = isAirport ? Plane : isHotelType ? BedDouble : isLocality ? Building2 : MapPin;
                    const name = place.displayName || place.placeId;
                    return (
                      <button key={place.placeId}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-muted/40 border-b border-gray-50 dark:border-border/50 last:border-none"
                        onClick={() => {
                          if (place.hotelId) { setLocation(`/hotel/${place.hotelId}`); }
                          else { setDestination(name); setPlaceId(place.placeId); }
                          setShowAutocomplete(false);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
                          <PlaceIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 dark:text-foreground truncate">{name}</div>
                          {place.formattedAddress && <div className="text-xs text-gray-400 truncate">{place.formattedAddress}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => { setSelectionStep("checkin"); setDate(undefined); setMobileDateOpen(true); }}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-border text-left active:bg-gray-50 dark:active:bg-muted/30 transition-colors"
              data-testid="button-date-mobile"
            >
              <CalendarDays className="w-5 h-5 text-gray-400 shrink-0" />
              <span className={cn("text-base", date?.from && date?.to ? "text-gray-800 dark:text-foreground" : "text-gray-400")}>
                {mobileDateLabel}
              </span>
            </button>
            <button
              onClick={() => setMobileGuestsOpen(true)}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-border text-left active:bg-gray-50 dark:active:bg-muted/30 transition-colors"
              data-testid="button-guests-mobile"
            >
              <Users className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-base text-gray-800 dark:text-foreground">{mobileGuestsLabel}</span>
            </button>
            <div className="p-4">
              <button
                onClick={handleSearch}
                className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
                data-testid="button-search"
              >
                <Search className="w-5 h-5" />
                {t("search.search")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP layout (md+) ── */}
      <div className="hidden md:block relative w-full h-[638px]">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img src={heroImage} alt="Luxury Hotel" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center h-full">
          <div className="mb-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-3 drop-shadow-lg leading-tight">
              Luxury Stays. Unbeatable Rates.
            </h1>
            <p className="text-white text-lg font-medium tracking-wide mb-4">Discover stays that redefine extraordinary</p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-white text-sm font-medium drop-shadow-md">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 opacity-90" />
                <span>2M+ Hotels Worldwide</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 opacity-90" />
                <span>190+ Countries</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>4.9/5 Guest Rating</span>
              </div>
            </div>
          </div>

          {/* Desktop search bar + calendar anchored together */}
          <div className="w-full max-w-4xl relative" ref={desktopSearchBarRef}>
            {/* Hidden Popover trigger pinned to the left edge for calendar alignment */}
            <Popover open={dateOpen && !isMobile} onOpenChange={(open) => {
              if (!open) { setDateOpen(false); return; }
              openCalendar();
            }}>
              <PopoverTrigger asChild>
                <span className="absolute inset-y-0 left-0 w-px pointer-events-none" aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent
                style={{ width: calendarWidth ?? "auto" }}
                className="p-0 border border-gray-200 dark:border-border shadow-2xl rounded-2xl z-[100] bg-white dark:bg-card overflow-hidden"
                align="start"
                sideOffset={8}
                onInteractOutside={() => setDateOpen(false)}
              >
                {desktopCalendarContent}
              </PopoverContent>
            </Popover>

            {/* Guests popover */}
            <Popover open={guestsOpen && !isMobile} onOpenChange={(open) => { setGuestsOpen(open); if (open) setDateOpen(false); }}>
              <PopoverTrigger asChild>
                <span className="absolute inset-y-0 right-16 w-px pointer-events-none" aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-3xl shadow-2xl border border-border bg-white dark:bg-card z-[100]" align="end" sideOffset={8}>
                {guestsContent}
              </PopoverContent>
            </Popover>

            {/* The visible search bar */}
            <div className="w-full bg-white dark:bg-card rounded-2xl shadow-2xl flex items-stretch border border-white/10">
              {/* Destination */}
              <div className="flex-[1.3] px-5 py-4 border-r border-gray-200 dark:border-border relative" ref={autocompleteRef}>
                <p className="text-xs font-semibold text-gray-500 dark:text-muted-foreground mb-0.5">Destination</p>
                <input
                  ref={desktopInputRef}
                  type="text"
                  placeholder="Enter a destination"
                  className="w-full text-sm text-gray-900 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 font-medium"
                  value={destination}
                  onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); setDateOpen(false); setGuestsOpen(false); }}
                  onFocus={() => { setShowAutocomplete(true); setDateOpen(false); setGuestsOpen(false); }}
                  onKeyDown={handleKeyDown}
                  data-testid="input-destination-desktop"
                />
                {autocompleteDropdown}
              </div>

              {/* Dates */}
              <button
                className="flex-1 px-5 py-4 hover:bg-gray-50 dark:hover:bg-muted/20 transition-colors text-left border-r border-gray-200 dark:border-border"
                onClick={openCalendar}
                data-testid="button-dates-desktop"
              >
                <p className="text-xs font-semibold text-gray-500 dark:text-muted-foreground mb-0.5">Dates</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{desktopDateLabel}</p>
              </button>

              {/* Guests */}
              <button
                className="flex-1 px-5 py-4 hover:bg-gray-50 dark:hover:bg-muted/20 transition-colors text-left"
                onClick={() => { setGuestsOpen(true); setDateOpen(false); setShowAutocomplete(false); }}
                data-testid="button-guests-desktop"
              >
                <p className="text-xs font-semibold text-gray-500 dark:text-muted-foreground mb-0.5">Guests</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{desktopGuestsLabel}</p>
              </button>

              {/* Search button */}
              <div className="flex items-center px-3">
                <button
                  onClick={handleSearch}
                  className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-md active:scale-95"
                  data-testid="button-search-desktop"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Search, MapPin, Sparkles, ChevronUp, ChevronDown, X, Plane, Building2, BedDouble, CalendarDays, Users, Star, LocateFixed } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Room {
  adults: number;
  children: number;
}

interface SearchHeroProps {
  initialDestination?: string;
  initialPlaceId?: string;
  initialAiSearch?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
  variant?: "hero" | "navbar";
}

function Counter({
  value,
  min,
  max,
  onChange,
  testIdPrefix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed"
        data-testid={`${testIdPrefix}-minus`}
      >−</button>
      <span className="w-4 text-center font-medium text-sm" data-testid={`${testIdPrefix}-count`}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed"
        data-testid={`${testIdPrefix}-plus`}
      >+</button>
    </div>
  );
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export function SearchHero({
  initialDestination,
  initialPlaceId,
  initialAiSearch,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  variant = "hero",
}: SearchHeroProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"destination" | "vibe">(initialAiSearch ? "vibe" : "destination");
  const [destination, setDestination] = useState(() => {
    // If we're on a hotel page or coming from one, initialDestination might be the hotel name
    // We want to detect if it's a hotel name and clear it if so.
    if (!initialDestination) return "";
    const isHotel = initialDestination.toLowerCase().includes("hotel") || 
                    initialDestination.toLowerCase().includes("resort") ||
                    initialDestination.toLowerCase().includes("villa");
    // Also check if we are currently on a hotel details page
    const isOnHotelPage = window.location.pathname.startsWith("/hotel/");
    if (isOnHotelPage && isHotel) return "";
    return initialDestination;
  });
  const [placeId, setPlaceId] = useState(initialPlaceId || "");
  const [aiSearch, setAiSearch] = useState(initialAiSearch || "");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const mobileAutocompleteRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [searchBarWidth, setSearchBarWidth] = useState(0);
  const [destSectionWidth, setDestSectionWidth] = useState(0);

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
      const inDesktop = autocompleteRef.current?.contains(e.target as Node);
      const inMobile = mobileAutocompleteRef.current?.contains(e.target as Node);
      if (!inDesktop && !inMobile) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const update = () => {
      if (searchBarRef.current) setSearchBarWidth(searchBarRef.current.offsetWidth);
      if (autocompleteRef.current) setDestSectionWidth(autocompleteRef.current.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (searchBarRef.current) ro.observe(searchBarRef.current);
    return () => ro.disconnect();
  }, []);

  const handleNearbyClick = () => {
    setShowAutocomplete(false);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "My Location";
          setDestination(city);
          setPlaceId("");
        } catch {
          setDestination("My Location");
          setPlaceId("");
        }
      },
      () => {
        setDestination("My Location");
        setPlaceId("");
      }
    );
  };

  const parseDate = (str?: string) => {
    if (!str) return undefined;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>(
    initialCheckIn ? { from: parseDate(initialCheckIn)!, to: parseDate(initialCheckOut) } : undefined
  );
  const [dateOpen, setDateOpen] = useState(false);
  const [selectionPhase, setSelectionPhase] = useState<"checkin" | "checkout">("checkin");
  const [stagedCheckIn, setStagedCheckIn] = useState<Date | undefined>(undefined);
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const initialAdults = parseInt(initialGuests || "2");
  const [rooms, setRooms] = useState<Room[]>([{ adults: initialAdults, children: 0 }]);
  const [expandedRooms, setExpandedRooms] = useState<boolean[]>([true]);

  const updateRoom = (idx: number, field: keyof Room, value: number) => {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRoom = () => {
    setRooms(prev => [...prev, { adults: 2, children: 0 }]);
    setExpandedRooms(prev => [...prev, true]);
  };

  const removeRoom = (idx: number) => {
    setRooms(prev => prev.filter((_, i) => i !== idx));
    setExpandedRooms(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleRoom = (idx: number) => {
    setExpandedRooms(prev => prev.map((v, i) => i === idx ? !v : v));
  };

  const totalAdults = rooms.reduce((s, r) => s + r.adults, 0);
  const totalChildren = rooms.reduce((s, r) => s + r.children, 0);
  const totalGuests = totalAdults + totalChildren;

  const guestsLabel = (() => {
    const roomPart = `${rooms.length} ${rooms.length !== 1 ? t("hotel.room_plural") : t("hotel.room")}`;
    const adultPart = `${totalAdults} ${totalAdults !== 1 ? t("search.adult_plural") : t("search.adult")}`;
    const childPart = totalChildren > 0 ? `, ${totalChildren} ${totalChildren !== 1 ? t("search.child_plural") : t("search.child")}` : "";
    return `${roomPart}, ${adultPart}${childPart}`;
  })();

  const handleSearch = () => {
    if (!date?.from || !date?.to) return;
    if (mode === "destination" && !destination) return;
    if (mode === "vibe" && !aiSearch) return;

    const checkIn = format(date.from, "yyyy-MM-dd");
    const checkOut = format(date.to, "yyyy-MM-dd");
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(totalAdults),
      children: String(totalChildren),
      roomConfig: JSON.stringify(rooms),
    });

    if (mode === "destination") {
      params.set("destination", destination);
      if (placeId) params.set("placeId", placeId);
    } else {
      params.set("aiSearch", aiSearch);
    }

    try {
      const existing = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const entry = { destination: mode === "destination" ? destination : aiSearch, checkIn, checkOut, guests: String(totalAdults) };
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
    : t("search.add_dates");

  const handleCalendarOpen = () => {
    setSelectionPhase("checkin");
    setStagedCheckIn(undefined);
    setHoveredDate(undefined);
  };

  const handleDayClick = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day < today) return;

    if (selectionPhase === "checkin") {
      setStagedCheckIn(day);
      setSelectionPhase("checkout");
      setHoveredDate(undefined);
    } else {
      if (!stagedCheckIn || day <= stagedCheckIn) return;
      setDate({ from: stagedCheckIn, to: day });
      setStagedCheckIn(undefined);
      setHoveredDate(undefined);
      setDateOpen(false);
      setSelectionPhase("checkin");
    }
  };

  const calendarSelected = (() => {
    if (selectionPhase === "checkin") {
      return date ? { from: date.from, to: date.to } : undefined;
    }
    if (stagedCheckIn) {
      const endDate = hoveredDate && hoveredDate > stagedCheckIn ? hoveredDate : stagedCheckIn;
      return { from: stagedCheckIn, to: endDate !== stagedCheckIn ? endDate : undefined };
    }
    return undefined;
  })();

  const calendarContent = (nMonths: number) => (
    <div data-testid="calendar-dropdown" className="bg-white dark:bg-card">
      <div className="pt-4 pb-2">
        <Calendar
          initialFocus
          mode="range"
          className="w-full"
          style={{ width: '100%' }}
          showOutsideDays={true}
          classNames={{
            months: "flex flex-row w-full divide-x divide-border",
            month: "flex-1 px-6 py-2",
            caption: "flex justify-center relative items-center mb-4 h-10",
            caption_label: "text-base font-bold text-foreground",
            nav: "flex items-center",
            nav_button: "h-8 w-8 bg-transparent p-0 hover:bg-muted rounded-md transition-colors flex items-center justify-center opacity-70 hover:opacity-100",
            nav_button_previous: "absolute left-0",
            nav_button_next: "absolute right-0",
            table: "w-full border-collapse",
            head_row: "flex w-full mb-2",
            head_cell: "text-muted-foreground text-xs font-semibold text-center flex-1 uppercase tracking-wide",
            row: "flex w-full mt-1",
            cell: "text-center text-sm relative p-0 flex-1 [&:has([aria-selected])]:bg-blue-100 dark:[&:has([aria-selected])]:bg-blue-900/30 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
            day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted/60 rounded-full transition-colors flex items-center justify-center mx-auto text-sm",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full font-semibold",
            day_today: "text-primary font-bold",
            day_outside: "text-muted-foreground opacity-40",
            day_disabled: "text-muted-foreground opacity-25 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-transparent aria-selected:text-blue-700 dark:aria-selected:text-blue-300 rounded-none",
            day_range_start: "rounded-full",
            day_range_end: "rounded-full",
            day_hidden: "invisible",
          }}
          defaultMonth={stagedCheckIn || date?.from || new Date()}
          selected={calendarSelected}
          onSelect={() => {}}
          onDayClick={handleDayClick}
          onDayMouseEnter={(day: Date) => {
            if (selectionPhase === "checkout" && stagedCheckIn && day > stagedCheckIn) {
              setHoveredDate(day);
            }
          }}
          onDayMouseLeave={() => {
            if (selectionPhase === "checkout") {
              setHoveredDate(undefined);
            }
          }}
          numberOfMonths={nMonths}
          disabled={(d) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (d < today) return true;
            if (selectionPhase === "checkout" && stagedCheckIn && d <= stagedCheckIn) return true;
            return false;
          }}
        />
      </div>
      {(stagedCheckIn || date?.from) && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground bg-primary/10 px-3 py-1 rounded-full">
              {format(stagedCheckIn || date!.from!, "MMM d, yyyy")}
            </span>
            {date?.to && !stagedCheckIn && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-foreground bg-primary/10 px-3 py-1 rounded-full">
                  {format(date.to, "MMM d, yyyy")}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => { setDate(undefined); setStagedCheckIn(undefined); setHoveredDate(undefined); setSelectionPhase("checkin"); }}
            className="text-primary hover:underline transition-colors font-bold"
            data-testid="button-clear-dates"
          >
            Clear dates
          </button>
        </div>
      )}
    </div>
  );

  const makeGuestsPopoverContent = (alignOffset = 0) => (
    <PopoverContent className="w-72 p-0" align="end" alignOffset={alignOffset}>
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <h3 className="font-bold text-base">{t("search.guests")}</h3>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {rooms.map((room, idx) => (
          <div key={idx} className="px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{t("hotel.room")} {idx + 1}</span>
              <div className="flex items-center gap-1">
                {rooms.length > 1 && (
                  <button
                    onClick={() => removeRoom(idx)}
                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded"
                    data-testid={`button-remove-room-${idx}`}
                    title="Remove room"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => toggleRoom(idx)}
                  className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
                  data-testid={`button-toggle-room-${idx}`}
                >
                  {expandedRooms[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {expandedRooms[idx] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{t("search.adults")}</div>
                  <Counter value={room.adults} min={1} max={10} onChange={(v) => updateRoom(idx, "adults", v)} testIdPrefix={`room-${idx}-adults`} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t("search.children")}</div>
                    <div className="text-xs text-muted-foreground">Ages 0 to 17</div>
                  </div>
                  <Counter value={room.children} min={0} max={6} onChange={(v) => updateRoom(idx, "children", v)} testIdPrefix={`room-${idx}-children`} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-5 py-4 border-t border-border">
        <button
          onClick={addRoom}
          disabled={rooms.length >= 5}
          className="flex-1 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="button-add-room"
        >
          + {t("hotel.room")}
        </button>
        <button
          onClick={() => setGuestsOpen(false)}
          className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          data-testid="button-done-guests"
        >
          {t("search.done")}
        </button>
      </div>
    </PopoverContent>
  );

  const autocompleteList = (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ maxHeight: "300px", overflowY: "auto" }}>
      <button
        className="w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-muted/40 border-b border-gray-100 dark:border-border"
        onClick={handleNearbyClick}
        data-testid="button-nearby-area"
      >
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
          <LocateFixed className="w-4 h-4 text-gray-500 dark:text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-normal text-gray-800 dark:text-foreground">Around my area</div>
        </div>
      </button>
      {(() => {
        const allPlaces = places as any[];
        const locationItems = allPlaces.filter((p: any) => !String(p.placeId).startsWith("hotel:"));
        const hotelItems = allPlaces.filter((p: any) => String(p.placeId).startsWith("hotel:"));
        return [...locationItems, ...hotelItems].map((place: any, idx: number) => {
          const types: string[] = place.types || [];
          const isHotelType = String(place.placeId).startsWith("hotel:") || types.some((t: string) => ["lodging", "hotel"].includes(t));
          const isAirport = types.includes("airport");
          const isLocality = types.some((t: string) => ["locality", "administrative_area_level_1", "country", "colloquial_area"].includes(t));
          const PlaceIcon = isAirport ? Plane : isHotelType ? BedDouble : isLocality ? Building2 : MapPin;
          const name: string = place.displayName || place.placeId;
          const query = destination.toLowerCase();
          const matchStart = name.toLowerCase().indexOf(query);
          const boldedName = matchStart >= 0 ? (
            <>{name.slice(0, matchStart)}<strong>{name.slice(matchStart, matchStart + query.length)}</strong>{name.slice(matchStart + query.length)}</>
          ) : name;
          return (
            <button
              key={place.placeId}
              className={`w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3 ${idx === 0 ? "bg-purple-50 dark:bg-muted/60" : "hover:bg-gray-50 dark:hover:bg-muted/40"}`}
              onClick={() => {
                if (place.hotelId) {
                  setLocation(`/hotel/${place.hotelId}`);
                  setShowAutocomplete(false);
                } else {
                  setDestination(name);
                  setPlaceId(place.placeId);
                  setShowAutocomplete(false);
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
                <PlaceIcon className="w-4 h-4 text-gray-500 dark:text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-normal text-gray-800 dark:text-foreground truncate">{boldedName}</div>
                {place.formattedAddress && (
                  <div className="text-xs text-gray-400 dark:text-muted-foreground truncate">{place.formattedAddress}</div>
                )}
              </div>
            </button>
          );
        });
      })()}
    </div>
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
            {showAutocomplete && places.length > 0 && (
              <div className="absolute top-full left-0 z-50 mt-1 bg-white dark:bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ minWidth: "240px", maxHeight: "340px", overflowY: "auto" }}>
                {(() => {
                  const allPlaces = places as any[];
                  const locationItems = allPlaces.filter((p: any) => !String(p.placeId).startsWith("hotel:"));
                  const hotelItems = allPlaces.filter((p: any) => String(p.placeId).startsWith("hotel:"));
                  return [...locationItems, ...hotelItems].map((place: any, idx: number) => {
                    const types: string[] = place.types || [];
                    const isHotelType = String(place.placeId).startsWith("hotel:") || types.some((t: string) => ["lodging", "hotel"].includes(t));
                    const isAirport = types.includes("airport");
                    const isLocality = types.some((t: string) => ["locality", "administrative_area_level_1", "country", "colloquial_area"].includes(t));
                    const PlaceIcon = isAirport ? Plane : isHotelType ? BedDouble : isLocality ? Building2 : MapPin;
                    const name: string = place.displayName || place.placeId;
                    const query = destination.toLowerCase();
                    const matchStart = name.toLowerCase().indexOf(query);
                    const boldedName = matchStart >= 0 ? (
                      <>{name.slice(0, matchStart)}<strong>{name.slice(matchStart, matchStart + query.length)}</strong>{name.slice(matchStart + query.length)}</>
                    ) : name;
                    return (
                      <button
                        key={place.placeId}
                        className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-3 ${idx === 0 ? "bg-purple-50 dark:bg-muted/60" : "hover:bg-gray-50 dark:hover:bg-muted/40"}`}
                        onClick={() => {
                          if (place.hotelId) { setLocation(`/hotel/${place.hotelId}`); setShowAutocomplete(false); }
                          else { setDestination(name); setPlaceId(place.placeId); setShowAutocomplete(false); }
                        }}
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
                          <PlaceIcon className="w-3.5 h-3.5 text-gray-500 dark:text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-normal text-gray-800 dark:text-foreground truncate">{boldedName}</div>
                          {place.formattedAddress && (
                            <div className="text-[10px] text-gray-400 dark:text-muted-foreground truncate">{place.formattedAddress}</div>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <Popover open={dateOpen} onOpenChange={(open) => { setDateOpen(open); if (open) handleCalendarOpen(); }}>
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

          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
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
            className="shrink-0 w-8 h-8 m-0.5 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow"
            data-testid="button-search-navbar"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="relative w-full rounded-2xl" style={{ minHeight: isMobile ? '70vh' : 638 }}>

        {/* Background Image — overflow-hidden only on the image layer so calendar dropdown can extend below */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ 
              backgroundImage: `url('${isMobile 
                ? "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80" 
                : "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80"}')`
            }} 
          />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center" style={{ minHeight: isMobile ? '70vh' : 638 }}>
          <div className="mb-8">
            <h1 className="text-3xl md:text-7xl font-bold text-white mb-3 drop-shadow-lg">
              Luxury Stays. Unbeatable Rates.
            </h1>
            <p className="text-white text-lg font-medium tracking-wide">Discover stays that redefine extraordinary</p>

            {/* Stats bar */}
            <div className="hidden md:flex mt-6 items-center justify-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white" />
                <span className="font-semibold">2M+</span>
                <span className="text-white">{t("search.stat_hotels")}</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white" />
                <span className="font-semibold">190+</span>
                <span className="text-white">{t("search.stat_countries")}</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-white fill-white" />
                <span className="font-semibold">4.8/5</span>
                <span className="text-white">{t("search.stat_rating")}</span>
              </div>
            </div>
          </div>

          {/* ── MOBILE search card (shown below md) ── */}
          <div className="md:hidden w-full max-w-sm bg-white dark:bg-card rounded-2xl shadow-2xl overflow-visible">

            {/* Destination / Vibe row */}
            <div className="relative px-4 py-3.5 border-b border-gray-100 dark:border-border" ref={mobileAutocompleteRef}>
              <div className="flex items-center gap-3">
                {mode === "destination"
                  ? <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                  : <Sparkles className="w-5 h-5 text-primary shrink-0" />
                }
                {mode === "destination" ? (
                  <input
                    type="text"
                    placeholder="Enter a destination"
                    className="flex-1 text-sm text-gray-800 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 min-w-0"
                    value={destination}
                    onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); }}
                    onFocus={() => setShowAutocomplete(true)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-destination"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. 'romantic beachfront resort'"
                    className="flex-1 text-sm text-gray-800 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 min-w-0"
                    value={aiSearch}
                    onChange={(e) => setAiSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-vibe"
                  />
                )}
              </div>
              {showAutocomplete && mode === "destination" && autocompleteList}
            </div>

            {/* Dates row — two side-by-side cells sharing one popover */}
            <Popover open={dateOpen && isMobile} onOpenChange={(open) => { setDateOpen(open); if (open) handleCalendarOpen(); }}>
              <div className="flex border-b border-gray-100 dark:border-border relative">
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 flex items-center gap-2 px-4 py-3 text-left border-r border-gray-100 dark:border-border active:bg-gray-50 transition-colors"
                    data-testid="button-checkin-mobile"
                  >
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{t("search.checkin")}</div>
                      <div className="text-sm text-gray-800 dark:text-foreground font-medium">
                        {date?.from ? format(date.from, "dd MMM") : t("search.add_dates")}
                      </div>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 flex items-center gap-2 px-4 py-3 text-left active:bg-gray-50 transition-colors"
                    data-testid="button-checkout-mobile"
                  >
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{t("search.checkout")}</div>
                      <div className="text-sm text-gray-800 dark:text-foreground font-medium">
                        {date?.to ? format(date.to, "dd MMM") : t("search.add_dates")}
                      </div>
                    </div>
                  </button>
                </PopoverTrigger>
              </div>
              <PopoverContent className="w-auto p-0 absolute left-1/2 -translate-x-1/2" align="center" side="bottom">
                {calendarContent(1)}
              </PopoverContent>
            </Popover>

            {/* Guests row */}
            <Popover open={guestsOpen && isMobile} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-border text-left active:bg-gray-50 transition-colors"
                  data-testid="button-guests-mobile"
                >
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 dark:text-foreground">{guestsLabel}</span>
                </button>
              </PopoverTrigger>
              {makeGuestsPopoverContent()}
            </Popover>

            {/* Vibe toggle row */}
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-border flex justify-center">
              <button
                onClick={() => setMode(mode === "destination" ? "vibe" : "destination")}
                className="flex items-center gap-1.5 text-primary text-xs font-medium transition-colors"
                data-testid="button-toggle-mode"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {mode === "destination" ? t("search.vibe_tab") : t("search.destination_tab")}
              </button>
            </div>

            {/* Search button */}
            <div className="p-3">
              <button
                onClick={handleSearch}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:bg-primary/80 transition-colors shadow"
                data-testid="button-search"
              >
                <Search className="w-4 h-4" />
                {t("search.search")}
              </button>
            </div>
          </div>

          {/* ── DESKTOP pill (shown at md+) ── */}
          <div className="hidden md:flex w-full max-w-2xl bg-white dark:bg-card rounded-2xl shadow-xl overflow-visible items-stretch px-1 py-0.5 gap-0 relative" ref={searchBarRef}>

            {/* Combined row */}
            <div className="flex-1 flex items-center gap-0">

              {/* Destination / Vibe section */}
              <div className="flex-[1.2] relative px-4 py-2 border-r border-border" ref={autocompleteRef}>
                <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  {mode === "destination" ? t("search.destination_tab") : t("search.vibe_tab")}
                </span>
                {mode === "destination" ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Where do you want to go?"
                      className="flex-1 text-sm text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate font-medium"
                      value={destination}
                      onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); }}
                      onFocus={() => setShowAutocomplete(true)}
                      onKeyDown={handleKeyDown}
                      data-testid="input-destination-desktop"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. 'romantic beachfront resort'"
                      className="flex-1 text-sm text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate font-medium"
                      value={aiSearch}
                      onChange={(e) => setAiSearch(e.target.value)}
                      onKeyDown={handleKeyDown}
                      data-testid="input-vibe-desktop"
                    />
                  </div>
                )}
                {showAutocomplete && mode === "destination" && autocompleteList}
              </div>

              {/* Dates section */}
              <Popover open={dateOpen && !isMobile} onOpenChange={(open) => { setDateOpen(open); if (open) handleCalendarOpen(); }}>
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 px-4 py-2 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left border-r border-border relative"
                    data-testid="button-dates-desktop"
                  >
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t("search.checkin")} / {t("search.checkout")}</span>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-foreground font-medium truncate">{dateLabel}</span>
                    </div>
                  </button>
                </PopoverTrigger>
              </Popover>

              {/* Guests section */}
              <Popover open={guestsOpen && !isMobile} onOpenChange={setGuestsOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 px-4 py-2 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left relative"
                    data-testid="button-guests-desktop"
                  >
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t("search.guests")}</span>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-foreground font-medium truncate">{guestsLabel}</span>
                    </div>
                  </button>
                </PopoverTrigger>
                {makeGuestsPopoverContent(-48)}
              </Popover>

            {/* Desktop Search Button */}
            <button
              onClick={handleSearch}
              className="shrink-0 w-12 h-12 m-1 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-md hover:shadow-lg"
              data-testid="button-search-desktop"
            >
              <Search className="w-6 h-6" />
            </button>
            </div>

            {dateOpen && !isMobile && (
              <div className="absolute left-0 right-0 z-50 bg-white dark:bg-card border border-border rounded-2xl shadow-xl overflow-hidden" style={{ top: 'calc(100% + 8px)' }}>
                {calendarContent(2)}
              </div>
            )}
          </div>

          {/* Vibe toggle — desktop only (mobile is inside the card) */}
          <button
            onClick={() => setMode(mode === "destination" ? "vibe" : "destination")}
            className="hidden md:flex mt-6 items-center gap-2 text-white hover:text-white/90 transition-colors"
            data-testid="button-toggle-mode-desktop"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span className="text-lg font-medium tracking-wide">
              {mode === "destination" ? "Search by Vibe" : "Search by Destination"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

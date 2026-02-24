import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Search, MapPin, Sparkles, ChevronUp, ChevronDown, X, Plane, Building2, BedDouble, CalendarDays, Users } from "lucide-react";
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

export function SearchHero({
  initialDestination,
  initialPlaceId,
  initialAiSearch,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: SearchHeroProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"destination" | "vibe">(initialAiSearch ? "vibe" : "destination");
  const [destination, setDestination] = useState(initialDestination || "");
  const [placeId, setPlaceId] = useState(initialPlaceId || "");
  const [aiSearch, setAiSearch] = useState(initialAiSearch || "");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const mobileAutocompleteRef = useRef<HTMLDivElement>(null);

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

  const calendarContent = (nMonths: number) => (
    <Calendar
      initialFocus
      mode="range"
      defaultMonth={date?.from}
      selected={date}
      onSelect={(range) => {
        const r = range as { from: Date; to?: Date } | undefined;
        if (!r?.from) return;
        if (selectionPhase === "checkin") {
          setDate({ from: r.from, to: undefined });
          setSelectionPhase("checkout");
        } else {
          if (r.to && r.to > r.from) {
            setDate(r);
            setDateOpen(false);
            setSelectionPhase("checkin");
          } else {
            setDate({ from: r.from, to: undefined });
            setSelectionPhase("checkout");
          }
        }
      }}
      numberOfMonths={nMonths}
      disabled={(d) => d < new Date()}
    />
  );

  const guestsPopoverContent = (
    <PopoverContent className="w-72 p-0" align="end">
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ minHeight: 460 }}>

        {/* Split photo background */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80')" }} />
          <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80')" }} />
        </div>
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Same Stays. Better Prices.
          </h1>
          <p className="text-white/80 text-base mb-6">2 Million Hotels Worldwide</p>

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
              {showAutocomplete && places.length > 0 && mode === "destination" && autocompleteList}
            </div>

            {/* Dates row — two side-by-side cells sharing one popover */}
            <Popover open={dateOpen} onOpenChange={(open) => { setDateOpen(open); if (!open) setSelectionPhase("checkin"); }}>
              <div className="flex border-b border-gray-100 dark:border-border">
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 flex items-center gap-2 px-4 py-3 text-left border-r border-gray-100 dark:border-border active:bg-gray-50 transition-colors"
                    onClick={() => setSelectionPhase("checkin")}
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
                    onClick={() => setSelectionPhase("checkout")}
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
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                {calendarContent(1)}
              </PopoverContent>
            </Popover>

            {/* Guests row */}
            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-border text-left active:bg-gray-50 transition-colors"
                  data-testid="button-guests-mobile"
                >
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 dark:text-foreground">{guestsLabel}</span>
                </button>
              </PopoverTrigger>
              {guestsPopoverContent}
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
          <div className="hidden md:flex w-full max-w-2xl bg-white dark:bg-card rounded-full shadow-xl items-stretch overflow-visible px-1 py-1 gap-0">

            {/* Where / Vibe input */}
            <div className="flex-[2] flex flex-col justify-center px-4 py-1.5 min-w-0 relative" ref={autocompleteRef}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide text-left">
                {mode === "destination" ? t("search.destination_tab") : t("search.vibe_tab")}
              </span>
              {mode === "destination" ? (
                <>
                  <input
                    type="text"
                    placeholder="Enter a destination"
                    className="text-sm text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate w-full"
                    value={destination}
                    onChange={(e) => { setDestination(e.target.value); setPlaceId(""); setShowAutocomplete(true); }}
                    onFocus={() => setShowAutocomplete(true)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-destination-desktop"
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
                  data-testid="input-vibe-desktop"
                />
              )}
            </div>

            <div className="w-px bg-gray-200 self-stretch my-2" />

            {/* Dates */}
            <Popover open={dateOpen} onOpenChange={(open) => { setDateOpen(open); if (open) setSelectionPhase("checkin"); }}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 flex flex-col justify-center px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left"
                  data-testid="button-dates"
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t("search.checkin")} / {t("search.checkout")}</span>
                  <span className="text-sm text-gray-700 dark:text-foreground truncate">{dateLabel}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                {calendarContent(2)}
              </PopoverContent>
            </Popover>

            <div className="w-px bg-gray-200 self-stretch my-2" />

            {/* Guests */}
            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 flex flex-col justify-center px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left"
                  data-testid="button-guests"
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t("search.guests")}</span>
                  <span className="text-sm text-gray-700 dark:text-foreground truncate">{guestsLabel}</span>
                </button>
              </PopoverTrigger>
              {guestsPopoverContent}
            </Popover>

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="shrink-0 w-11 h-11 m-0.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow"
              data-testid="button-search-desktop"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Vibe toggle — desktop only (mobile is inside the card) */}
          <button
            onClick={() => setMode(mode === "destination" ? "vibe" : "destination")}
            className="hidden md:flex mt-4 items-center gap-1.5 text-white/70 hover:text-white text-xs transition-colors"
            data-testid="button-toggle-mode-desktop"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {mode === "destination" ? t("search.vibe_tab") : t("search.destination_tab")}
          </button>
        </div>
      </div>
    </div>
  );
}

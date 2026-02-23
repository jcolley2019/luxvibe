import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Search, MapPin, Sparkles, ChevronUp, ChevronDown, X } from "lucide-react";
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
    const roomPart = `${rooms.length} Room${rooms.length !== 1 ? "s" : ""}`;
    const adultPart = `${totalAdults} Adult${totalAdults !== 1 ? "s" : ""}`;
    const childPart = totalChildren > 0 ? `, ${totalChildren} Child${totalChildren !== 1 ? "ren" : ""}` : "";
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
    : "Add dates";

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
                    <div className="absolute top-full left-0 z-50 mt-2 bg-white dark:bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ minWidth: "280px" }}>
                      {(places as any[]).map((place: any) => (
                        <button
                          key={place.placeId}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-start gap-3"
                          onClick={() => {
                            setDestination(place.displayName || place.placeId);
                            setPlaceId(place.placeId);
                            setShowAutocomplete(false);
                          }}
                        >
                          <MapPin className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{place.displayName || place.placeId}</div>
                            {place.formattedAddress && (
                              <div className="text-xs text-muted-foreground truncate">{place.formattedAddress}</div>
                            )}
                          </div>
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
            <Popover open={dateOpen} onOpenChange={(open) => {
              setDateOpen(open);
              if (open) setSelectionPhase("checkin");
            }}>
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
                  numberOfMonths={2}
                  disabled={(d) => d < new Date()}
                />
              </PopoverContent>
            </Popover>

            <div className="w-px bg-gray-200 self-stretch my-2" />

            {/* Guests — multi-room configurator */}
            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 flex flex-col justify-center px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left"
                  data-testid="button-guests"
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Guests</span>
                  <span className="text-sm text-gray-700 dark:text-foreground truncate">{guestsLabel}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                {/* Title */}
                <div className="px-5 pt-5 pb-3 border-b border-border">
                  <h3 className="font-bold text-base">Configuring Rooms</h3>
                </div>

                {/* Rooms list */}
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {rooms.map((room, idx) => (
                    <div key={idx} className="px-5 py-3">
                      {/* Room header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Room {idx + 1}</span>
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
                            {expandedRooms[idx]
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Room details (collapsible) */}
                      {expandedRooms[idx] && (
                        <div className="space-y-3">
                          {/* Adults */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">Adults</div>
                            </div>
                            <Counter
                              value={room.adults}
                              min={1}
                              max={10}
                              onChange={(v) => updateRoom(idx, "adults", v)}
                              testIdPrefix={`room-${idx}-adults`}
                            />
                          </div>
                          {/* Children */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">Children</div>
                              <div className="text-xs text-muted-foreground">Ages 0 to 17</div>
                            </div>
                            <Counter
                              value={room.children}
                              min={0}
                              max={6}
                              onChange={(v) => updateRoom(idx, "children", v)}
                              testIdPrefix={`room-${idx}-children`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer buttons */}
                <div className="flex gap-2 px-5 py-4 border-t border-border">
                  <button
                    onClick={addRoom}
                    disabled={rooms.length >= 5}
                    className="flex-1 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="button-add-room"
                  >
                    Add room
                  </button>
                  <button
                    onClick={() => setGuestsOpen(false)}
                    className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    data-testid="button-done-guests"
                  >
                    Done
                  </button>
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

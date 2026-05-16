import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ArrowLeftRight, Loader2, Users, ChevronDown, Search, CalendarDays } from "lucide-react";
import { format, addDays } from "date-fns";

interface AirportSuggestion {
  iataCode: string;
  name?: string;
  cityName?: string;
  countryCode?: string;
}

function AirportField({
  value, onChange, placeholder, label, testId,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; label: string; testId: string;
}) {
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [selected, setSelected] = useState<AirportSuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => { if (!value) setSelected(null); }, [value]);

  const handleChange = useCallback((raw: string) => {
    const v = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    onChange(v); setSelected(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (v.length >= 2) {
      setLoading(true);
      debounce.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/flights/airports?q=${encodeURIComponent(v)}`);
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
          setOpen(true);
        } catch { setSuggestions([]); }
        finally { setLoading(false); }
      }, 300);
    } else { setSuggestions([]); setOpen(false); }
  }, [onChange]);

  function handleSelect(s: AirportSuggestion) {
    onChange(s.iataCode); setSelected(s); setOpen(false); setSuggestions([]);
  }

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          maxLength={3}
          autoComplete="off"
          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground font-mono font-bold text-base tracking-widest uppercase placeholder:font-sans placeholder:font-normal placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          data-testid={testId}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      {selected && (
        <p className="text-[11px] text-muted-foreground mt-0.5 pl-1 truncate">
          {[selected.cityName, selected.countryCode].filter(Boolean).join(", ")}
        </p>
      )}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 w-full min-w-[240px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border last:border-0"
                data-testid={`flight-airport-${s.iataCode}`}
              >
                <span className="font-mono font-bold text-sm text-foreground w-8 shrink-0">{s.iataCode}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.cityName || s.name || s.iataCode}
                    {s.countryCode ? <span className="text-muted-foreground font-normal">, {s.countryCode}</span> : null}
                  </div>
                  {s.name && <div className="text-xs text-muted-foreground truncate">{s.name}</div>}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FlightSearchPanel({ variant = "hero" }: { variant?: "hero" | "mobile" }) {
  const [, navigate] = useLocation();
  const [tripType, setTripType] = useState<"round" | "one">("round");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [depart, setDepart] = useState(() => format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [returnDate, setReturnDate] = useState(() => format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [adults, setAdults] = useState(2);
  const [cabin, setCabin] = useState("economy");
  const [passOpen, setPassOpen] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (passRef.current && !passRef.current.contains(e.target as Node)) setPassOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function swap() { const o = origin; setOrigin(destination); setDestination(o); }

  function handleSearch() {
    const params = new URLSearchParams({
      origin, destination, depart,
      ...(tripType === "round" ? { return: returnDate } : {}),
      adults: String(adults), cabin, tripType,
    });
    navigate(`/flights?${params.toString()}`);
  }

  const cabinLabels: Record<string, string> = { economy: "Economy", premium_economy: "Premium Eco", business: "Business", first: "First" };

  if (variant === "mobile") {
    return (
      <div className="px-5 pb-4 pt-2 space-y-4" data-testid="flight-search-panel-mobile">
        {/* Trip type */}
        <div className="flex gap-2">
          {(["round", "one"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${tripType === t ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >{t === "round" ? "Round trip" : "One way"}</button>
          ))}
        </div>

        <AirportField value={origin} onChange={setOrigin} placeholder="JFK" label="From" testId="input-flight-origin-mobile" />

        <div className="flex justify-center">
          <button type="button" onClick={swap} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <AirportField value={destination} onChange={setDestination} placeholder="CDG" label="To" testId="input-flight-dest-mobile" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Depart</p>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="date" value={depart} onChange={e => setDepart(e.target.value)} min={format(new Date(), "yyyy-MM-dd")}
                className="w-full pl-9 pr-2 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="input-flight-depart-mobile" />
            </div>
          </div>
          {tripType === "round" && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Return</p>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={depart}
                  className="w-full pl-9 pr-2 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  data-testid="input-flight-return-mobile" />
              </div>
            </div>
          )}
        </div>

        <div ref={passRef} className="relative">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Passengers & Class</p>
          <button type="button" onClick={() => setPassOpen(o => !o)}
            className="w-full flex items-center gap-2 px-3 py-2.5 border border-border rounded-xl bg-background hover:border-primary/50 transition-all"
            data-testid="button-flight-passengers-mobile"
          >
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">{adults} Passenger{adults !== 1 ? "s" : ""} · {cabinLabels[cabin]}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {passOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Adults</p><p className="text-xs text-muted-foreground">12+</p></div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-lg hover:bg-muted disabled:opacity-30 transition-all" disabled={adults <= 1}>−</button>
                    <span className="w-4 text-center font-semibold text-sm">{adults}</span>
                    <button type="button" onClick={() => setAdults(Math.min(9, adults + 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-lg hover:bg-muted transition-all">+</button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cabin class</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(cabinLabels).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => { setCabin(k); setPassOpen(false); }}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${cabin === k ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"}`}
                      >{v}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="button" onClick={handleSearch} disabled={!origin || !destination}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-flight-search-mobile"
        >
          <Search className="w-5 h-5" />
          Search Flights
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl" data-testid="flight-search-panel-desktop">
      {/* Trip type + cabin mini bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1.5 bg-white/15 backdrop-blur-sm rounded-full p-1">
          {(["round", "one"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={`px-4 py-1 rounded-full text-sm font-semibold transition-all ${tripType === t ? "bg-white text-gray-900 shadow" : "text-white hover:bg-white/20"}`}
            >{t === "round" ? "Round trip" : "One way"}</button>
          ))}
        </div>
        <div className="relative">
          <select value={cabin} onChange={e => setCabin(e.target.value)}
            className="appearance-none bg-white/15 backdrop-blur-sm text-white text-sm font-semibold pl-3 pr-7 py-1.5 rounded-full border border-white/30 focus:outline-none cursor-pointer hover:bg-white/25 transition-colors"
            data-testid="select-flight-cabin"
          >
            {Object.entries(cabinLabels).map(([k, v]) => <option key={k} value={k} className="text-gray-900 bg-white">{v}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white pointer-events-none" />
        </div>
      </div>

      {/* Main search bar */}
      <div className="flex items-stretch bg-white dark:bg-card rounded-2xl shadow-2xl overflow-visible">
        {/* From */}
        <div className="flex-1 min-w-0 px-4 py-3.5 border-r border-gray-100 dark:border-border">
          <AirportField value={origin} onChange={setOrigin} placeholder="JFK" label="From" testId="input-flight-origin" />
        </div>

        {/* Swap */}
        <div className="flex items-center justify-center px-2 border-r border-gray-100 dark:border-border">
          <button type="button" onClick={swap}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            data-testid="button-flight-swap"
          >
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* To */}
        <div className="flex-1 min-w-0 px-4 py-3.5 border-r border-gray-100 dark:border-border">
          <AirportField value={destination} onChange={setDestination} placeholder="CDG" label="To" testId="input-flight-dest" />
        </div>

        {/* Depart */}
        <div className="px-4 py-3.5 border-r border-gray-100 dark:border-border min-w-[140px]">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Depart</p>
          <div className="relative">
            <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input type="date" value={depart} onChange={e => setDepart(e.target.value)} min={format(new Date(), "yyyy-MM-dd")}
              className="w-full pl-7 pr-1 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              data-testid="input-flight-depart" />
          </div>
        </div>

        {/* Return */}
        {tripType === "round" && (
          <div className="px-4 py-3.5 border-r border-gray-100 dark:border-border min-w-[140px]">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Return</p>
            <div className="relative">
              <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={depart}
                className="w-full pl-7 pr-1 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="input-flight-return" />
            </div>
          </div>
        )}

        {/* Passengers */}
        <div ref={passRef} className="relative px-4 py-3.5 border-r border-gray-100 dark:border-border min-w-[130px]">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Passengers</p>
          <button type="button" onClick={() => setPassOpen(o => !o)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
            data-testid="button-flight-passengers"
          >
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{adults} Adult{adults !== 1 ? "s" : ""}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {passOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 left-0 w-60 bg-card border border-border rounded-2xl shadow-2xl z-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Adults</p><p className="text-xs text-muted-foreground">12+</p></div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-lg hover:bg-muted disabled:opacity-30 transition-all">−</button>
                    <span className="w-4 text-center font-semibold text-sm">{adults}</span>
                    <button type="button" onClick={() => setAdults(Math.min(9, adults + 1))}
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-lg hover:bg-muted transition-all">+</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search button */}
        <button type="button" onClick={handleSearch} disabled={!origin || !destination}
          className="px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-r-2xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          data-testid="button-flight-search"
        >
          <Search className="w-5 h-5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
}

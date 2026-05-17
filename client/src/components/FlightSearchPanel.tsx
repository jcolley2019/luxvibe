import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ArrowLeftRight, Loader2, Users, ChevronDown, Search, CalendarDays, MapPin } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

interface Airport {
  iataCode: string;
  name?: string;
  cityName?: string;
  countryCode?: string;
}

function AirportField({
  iata, display, onSelect, placeholder, label, testId,
}: {
  iata: string;
  display: string;
  onSelect: (iata: string, display: string) => void;
  placeholder: string;
  label: string;
  testId: string;
}) {
  const [query, setQuery] = useState(display);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(display); }, [display]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (!iata) setQuery("");
        else setQuery(display);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [iata, display]);

  const handleChange = useCallback((raw: string) => {
    setQuery(raw);
    if (debounce.current) clearTimeout(debounce.current);
    if (raw.length >= 2) {
      setLoading(true);
      debounce.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/flights/airports?q=${encodeURIComponent(raw.toUpperCase())}`);
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
          setOpen(true);
        } catch { setSuggestions([]); }
        finally { setLoading(false); }
      }, 280);
    } else { setSuggestions([]); setOpen(false); }
  }, []);

  function handleSelect(s: Airport) {
    const label = s.cityName || s.name || s.iataCode;
    onSelect(s.iataCode, label);
    setQuery(label);
    setOpen(false);
    setSuggestions([]);
  }

  function handleFocus() {
    setQuery("");
    if (suggestions.length > 0) setOpen(true);
  }

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <div className="relative flex items-center gap-2">
        {iata ? (
          <span className="font-mono font-extrabold text-base text-foreground shrink-0">{iata}</span>
        ) : (
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent text-foreground text-sm font-medium placeholder:text-muted-foreground focus:outline-none truncate"
          data-testid={testId}
        />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />}
      </div>
      {iata && (
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{query}</p>
      )}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-2 w-full min-w-[260px] bg-card border border-border rounded-2xl shadow-2xl z-[60] overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0"
                data-testid={`flight-airport-${s.iataCode}`}
              >
                <span className="font-mono font-bold text-sm text-primary w-9 shrink-0">{s.iataCode}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {s.cityName || s.name || s.iataCode}
                    {s.countryCode ? <span className="font-normal text-muted-foreground">, {s.countryCode}</span> : null}
                  </p>
                  {s.name && s.cityName && (
                    <p className="text-xs text-muted-foreground truncate">{s.name}</p>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DateField({
  value, onChange, label, min, testId,
}: {
  value: string; onChange: (v: string) => void; label: string; min?: string; testId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formatted = value ? format(parseISO(value), "EEE, MMM d") : "Add date";

  return (
    <div className="relative cursor-pointer" onClick={() => inputRef.current?.showPicker?.()}>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className={`text-sm font-semibold ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {formatted}
        </span>
      </div>
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full cursor-pointer"
        data-testid={testId}
      />
    </div>
  );
}

export function FlightSearchPanel({ variant = "hero" }: { variant?: "hero" | "mobile" }) {
  const [, navigate] = useLocation();
  const [tripType, setTripType] = useState<"round" | "one">("round");
  const [originIata, setOriginIata] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [destIata, setDestIata] = useState("");
  const [destDisplay, setDestDisplay] = useState("");
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

  function swap() {
    const oi = originIata, od = originDisplay;
    setOriginIata(destIata); setOriginDisplay(destDisplay);
    setDestIata(oi); setDestDisplay(od);
  }

  function handleSearch() {
    if (!originIata || !destIata) return;
    const params = new URLSearchParams({
      origin: originIata, destination: destIata, depart,
      ...(tripType === "round" ? { return: returnDate } : {}),
      adults: String(adults), cabin, tripType,
    });
    navigate(`/flights?${params.toString()}`);
  }

  const cabinLabels: Record<string, string> = {
    economy: "Economy", premium_economy: "Premium Eco", business: "Business", first: "First",
  };

  if (variant === "mobile") {
    return (
      <div className="px-5 pb-4 pt-2 space-y-4" data-testid="flight-search-panel-mobile">
        <div className="flex gap-2">
          {(["round", "one"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${tripType === t ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >{t === "round" ? "Round trip" : "One way"}</button>
          ))}
        </div>
        <AirportField iata={originIata} display={originDisplay} onSelect={(i, d) => { setOriginIata(i); setOriginDisplay(d); }} placeholder="City or airport" label="From" testId="input-flight-origin-mobile" />
        <div className="flex justify-center">
          <button type="button" onClick={swap} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <AirportField iata={destIata} display={destDisplay} onSelect={(i, d) => { setDestIata(i); setDestDisplay(d); }} placeholder="City or airport" label="To" testId="input-flight-dest-mobile" />
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border rounded-xl px-3 py-2.5">
            <DateField value={depart} onChange={setDepart} label="Depart" min={format(new Date(), "yyyy-MM-dd")} testId="input-flight-depart-mobile" />
          </div>
          {tripType === "round" && (
            <div className="border border-border rounded-xl px-3 py-2.5">
              <DateField value={returnDate} onChange={setReturnDate} label="Return" min={depart} testId="input-flight-return-mobile" />
            </div>
          )}
        </div>
        <div ref={passRef} className="relative">
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
                className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 space-y-4"
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
        <button type="button" onClick={handleSearch} disabled={!originIata || !destIata}
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
    <div className="w-full max-w-5xl" data-testid="flight-search-panel-desktop">
      {/* Trip type + cabin mini bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1 bg-white/15 backdrop-blur-sm rounded-full p-1">
          {(["round", "one"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tripType === t ? "bg-white text-gray-900 shadow" : "text-white hover:bg-white/20"}`}
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
      <div className="flex items-stretch bg-white dark:bg-card rounded-2xl shadow-2xl">

        {/* From */}
        <div className="flex-[1.5] min-w-0 px-5 py-4 border-r border-gray-100 dark:border-border">
          <AirportField
            iata={originIata} display={originDisplay}
            onSelect={(i, d) => { setOriginIata(i); setOriginDisplay(d); }}
            placeholder="City or airport" label="From"
            testId="input-flight-origin"
          />
        </div>

        {/* Swap */}
        <div className="flex items-center justify-center px-2 border-r border-gray-100 dark:border-border shrink-0">
          <button type="button" onClick={swap}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            data-testid="button-flight-swap"
          >
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* To */}
        <div className="flex-[1.5] min-w-0 px-5 py-4 border-r border-gray-100 dark:border-border">
          <AirportField
            iata={destIata} display={destDisplay}
            onSelect={(i, d) => { setDestIata(i); setDestDisplay(d); }}
            placeholder="City or airport" label="To"
            testId="input-flight-dest"
          />
        </div>

        {/* Depart */}
        <div className="px-5 py-4 border-r border-gray-100 dark:border-border shrink-0">
          <DateField value={depart} onChange={setDepart} label="Depart" min={format(new Date(), "yyyy-MM-dd")} testId="input-flight-depart" />
        </div>

        {/* Return */}
        {tripType === "round" && (
          <div className="px-5 py-4 border-r border-gray-100 dark:border-border shrink-0">
            <DateField value={returnDate} onChange={setReturnDate} label="Return" min={depart} testId="input-flight-return" />
          </div>
        )}

        {/* Passengers */}
        <div ref={passRef} className="relative px-5 py-4 border-r border-gray-100 dark:border-border shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Passengers</p>
          <button type="button" onClick={() => setPassOpen(o => !o)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
            data-testid="button-flight-passengers"
          >
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">{adults} Adult{adults !== 1 ? "s" : ""}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
          <p className="text-[11px] text-muted-foreground mt-0.5">{cabinLabels[cabin]}</p>
          <AnimatePresence>
            {passOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 right-0 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 p-4 space-y-4"
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

        {/* Search button */}
        <button type="button" onClick={handleSearch} disabled={!originIata || !destIata}
          className="px-7 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-r-2xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          data-testid="button-flight-search"
        >
          <Search className="w-5 h-5" />
          <span className="hidden lg:inline">Search</span>
        </button>
      </div>
    </div>
  );
}

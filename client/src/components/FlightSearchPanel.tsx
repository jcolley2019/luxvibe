import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, ArrowLeftRight, Loader2, Users, ChevronDown, Search,
  ArrowRight, RefreshCw,
} from "lucide-react";
import { format, addDays } from "date-fns";

type TripType = "roundtrip" | "oneway";
type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

const CABIN_LABELS: Record<CabinClass, string> = {
  ECONOMY: "Economy",
  PREMIUM_ECONOMY: "Premium Economy",
  BUSINESS: "Business",
  FIRST: "First Class",
};

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
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          data-testid={testId}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      {iata && query && (
        <p className="mt-1 pl-1 text-xs text-muted-foreground truncate font-mono font-bold text-primary/70">{iata}</p>
      )}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 w-full min-w-[260px] bg-card border border-border rounded-xl shadow-xl z-[60] overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => handleSelect(s)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border last:border-0"
                data-testid={`flight-airport-${s.iataCode}`}
              >
                <span className="font-mono font-bold text-sm text-foreground w-9 shrink-0 mt-0.5">{s.iataCode}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
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

function PassengerSelector({
  adults, children, infants, onChange,
}: {
  adults: number; children: number; infants: number;
  onChange: (a: number, c: number, i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = adults + children + infants;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const Counter = ({ label, sub, value, onInc, onDec, min = 0 }: {
    label: string; sub: string; value: number; onInc: () => void; onDec: () => void; min?: number;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onDec} disabled={value <= min}
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg leading-none">−</button>
        <span className="w-4 text-center font-semibold text-sm">{value}</span>
        <button type="button" onClick={onInc} disabled={total >= 9}
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg leading-none">+</button>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Passengers</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-3 border border-border rounded-xl bg-background hover:border-primary/50 transition-all"
        data-testid="button-flight-passengers"
      >
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground">{total} Passenger{total !== 1 ? "s" : ""}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-xl z-[60] p-4"
          >
            <Counter label="Adults" sub="12+" value={adults} min={1}
              onInc={() => onChange(adults + 1, children, infants)}
              onDec={() => onChange(Math.max(1, adults - 1), children, infants)} />
            <Counter label="Children" sub="2–11" value={children}
              onInc={() => onChange(adults, children + 1, infants)}
              onDec={() => onChange(adults, Math.max(0, children - 1), infants)} />
            <Counter label="Infants" sub="Under 2" value={infants}
              onInc={() => onChange(adults, children, infants + 1)}
              onDec={() => onChange(adults, children, Math.max(0, infants - 1))} />
            <p className="text-xs text-muted-foreground mt-3">Max 9 passengers per booking</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FlightSearchPanel({ variant = "hero" }: { variant?: "hero" | "mobile" }) {
  const [, navigate] = useLocation();
  const today = new Date();
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [originIata, setOriginIata] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [destIata, setDestIata] = useState("");
  const [destDisplay, setDestDisplay] = useState("");
  const [depart, setDepart] = useState(() => format(addDays(today, 30), "yyyy-MM-dd"));
  const [returnDate, setReturnDate] = useState(() => format(addDays(today, 37), "yyyy-MM-dd"));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>("ECONOMY");
  const [cabinOpen, setCabinOpen] = useState(false);
  const cabinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cabinRef.current && !cabinRef.current.contains(e.target as Node)) setCabinOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function swap() {
    const oi = originIata, od = originDisplay;
    setOriginIata(destIata); setOriginDisplay(destDisplay);
    setDestIata(oi); setDestDisplay(od);
  }

  function handleSearch() {
    if (!originIata || !destIata) return;
    const params = new URLSearchParams({
      origin: originIata,
      destination: destIata,
      depart,
      adults: String(adults),
      children: String(children),
      infants: String(infants),
      cabinClass,
      tripType,
      ...(tripType === "roundtrip" ? { return: returnDate } : {}),
    });
    navigate(`/flights?${params.toString()}`);
  }

  if (variant === "mobile") {
    return (
      <div className="px-5 pb-4 pt-2 space-y-4" data-testid="flight-search-panel-mobile">
        <div className="flex gap-2">
          {(["roundtrip", "oneway"] as TripType[]).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${tripType === t ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >{t === "roundtrip" ? "Round trip" : "One way"}</button>
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
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Depart</label>
            <input type="date" value={depart} min={format(today, "yyyy-MM-dd")} onChange={e => setDepart(e.target.value)}
              className="w-full text-sm text-foreground bg-transparent focus:outline-none" data-testid="input-flight-depart-mobile" />
          </div>
          {tripType === "roundtrip" && (
            <div className="border border-border rounded-xl px-3 py-2.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Return</label>
              <input type="date" value={returnDate} min={depart} onChange={e => setReturnDate(e.target.value)}
                className="w-full text-sm text-foreground bg-transparent focus:outline-none" data-testid="input-flight-return-mobile" />
            </div>
          )}
        </div>
        <PassengerSelector adults={adults} children={children} infants={infants}
          onChange={(a, c, i) => { setAdults(a); setChildren(c); setInfants(i); }} />
        <div ref={cabinRef} className="relative">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cabin</label>
          <button type="button" onClick={() => setCabinOpen(o => !o)}
            className="w-full flex items-center gap-2 px-3 py-3 border border-border rounded-xl bg-background hover:border-primary/50 transition-all"
            data-testid="button-flight-cabin-mobile"
          >
            <span className="text-sm font-medium text-foreground flex-1 text-left">{CABIN_LABELS[cabinClass]}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {cabinOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute bottom-full mb-1 w-full bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {(Object.keys(CABIN_LABELS) as CabinClass[]).map(c => (
                  <button key={c} type="button" onClick={() => { setCabinClass(c); setCabinOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${cabinClass === c ? "text-primary font-semibold" : "text-foreground"}`}
                    data-testid={`cabin-option-${c}`}
                  >{CABIN_LABELS[c]}</button>
                ))}
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
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-6">

          {/* Trip type toggle */}
          <div className="flex items-center gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
            {(["oneway", "roundtrip"] as TripType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTripType(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tripType === t ? "bg-white dark:bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-trip-${t}`}
              >
                <span className="flex items-center gap-1.5">
                  {t === "oneway"
                    ? <><ArrowRight className="w-3.5 h-3.5" />One way</>
                    : <><RefreshCw className="w-3.5 h-3.5" />Round trip</>}
                </span>
              </button>
            ))}
          </div>

          {/* Row 1: From / swap / To */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <AirportField
              iata={originIata} display={originDisplay}
              onSelect={(i, d) => { setOriginIata(i); setOriginDisplay(d); }}
              placeholder="City or airport" label="From"
              testId="input-flight-origin"
            />

            <div className="flex items-end pb-1.5">
              <button type="button" onClick={swap}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 transition-all shrink-0"
                data-testid="button-flight-swap">
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <AirportField
              iata={destIata} display={destDisplay}
              onSelect={(i, d) => { setDestIata(i); setDestDisplay(d); }}
              placeholder="City or airport" label="To"
              testId="input-flight-dest"
            />
          </div>

          {/* Row 2: Dates / Passengers / Cabin */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className={tripType === "roundtrip" ? "col-span-1" : "col-span-2 sm:col-span-1"}>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Depart</label>
              <input
                type="date"
                value={depart}
                min={format(today, "yyyy-MM-dd")}
                onChange={e => setDepart(e.target.value)}
                className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                data-testid="input-flight-depart"
                required
              />
            </div>

            {tripType === "roundtrip" && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Return</label>
                <input
                  type="date"
                  value={returnDate}
                  min={depart}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  data-testid="input-flight-return"
                />
              </div>
            )}

            <PassengerSelector
              adults={adults} children={children} infants={infants}
              onChange={(a, c, i) => { setAdults(a); setChildren(c); setInfants(i); }}
            />

            <div ref={cabinRef} className="relative">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cabin</label>
              <button
                type="button"
                onClick={() => setCabinOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-3 border border-border rounded-xl bg-background hover:border-primary/50 transition-all text-left"
                data-testid="button-flight-cabin"
              >
                <span className="text-sm font-medium text-foreground flex-1 truncate">{CABIN_LABELS[cabinClass]}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
              <AnimatePresence>
                {cabinOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl z-[60] overflow-hidden"
                  >
                    {(Object.keys(CABIN_LABELS) as CabinClass[]).map(c => (
                      <button key={c} type="button"
                        onClick={() => { setCabinClass(c); setCabinOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${cabinClass === c ? "text-primary font-semibold" : "text-foreground"}`}
                        data-testid={`cabin-option-${c}`}
                      >
                        {CABIN_LABELS[c]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Search button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={!originIata || !destIata}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white text-base font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-flight-search"
          >
            <Search className="w-5 h-5" />
            Search Flights
          </button>

        </div>
      </div>
    </div>
  );
}

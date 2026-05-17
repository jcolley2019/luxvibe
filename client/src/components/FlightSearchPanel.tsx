import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, ArrowLeftRight, ArrowUpDown, Loader2, Users, ChevronDown, Search,
  ArrowRight, RefreshCw, Plus, X, LayoutList,
} from "lucide-react";
import { format, addDays } from "date-fns";

type TripType = "roundtrip" | "oneway" | "multicity";
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

interface MultiLeg {
  originIata: string;
  originDisplay: string;
  destIata: string;
  destDisplay: string;
  date: string;
}

function AirportField({
  iata, display, onSelect, placeholder, label, testId, card = false,
}: {
  iata: string;
  display: string;
  onSelect: (iata: string, display: string) => void;
  placeholder: string;
  label: string;
  testId: string;
  card?: boolean;
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

  const [editing, setEditing] = useState(!iata);
  const [airportName, setAirportName] = useState("");

  function handleSelect(s: Airport) {
    const city = s.cityName || s.name || s.iataCode;
    const lbl = city + (s.countryCode ? `, ${s.countryCode}` : "");
    onSelect(s.iataCode, lbl);
    setQuery(lbl);
    setOpen(false);
    setSuggestions([]);
    if (s.name && s.cityName) setAirportName(s.name);
    else setAirportName("");
  }

  function handleFocus() {
    setQuery("");
    if (suggestions.length > 0) setOpen(true);
  }
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (iata) setEditing(false); }, [iata]);

  function handleCardSelectedClick() {
    onSelect("", "");
    setQuery("");
    setAirportName("");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (card) {
    return (
      <div ref={ref} className="relative px-4 py-3 h-[78px]">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>

        {iata && !editing ? (
          /* Selected state — matches dropdown row: IATA + city/country + terminal name */
          <button
            type="button"
            onClick={handleCardSelectedClick}
            className="flex items-start gap-3 w-full text-left"
            data-testid={testId}
          >
            <span className="font-mono font-bold text-sm text-foreground w-9 shrink-0 mt-0.5">{iata}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{display}</p>
              {airportName && (
                <p className="text-xs text-muted-foreground truncate">{airportName}</p>
              )}
            </div>
          </button>
        ) : (
          /* Search state */
          <div className="flex items-center gap-2.5">
            <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleChange(e.target.value)}
              onFocus={handleFocus}
              placeholder={placeholder}
              autoComplete="off"
              className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
              data-testid={testId}
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          </div>
        )}

        <AnimatePresence>
          {open && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-[60] overflow-hidden"
            >
              {suggestions.map((s, i) => (
                <button key={i} type="button" onMouseDown={() => { handleSelect(s); setEditing(false); }}
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
        <p className="mt-1 pl-1 text-xs font-mono font-bold text-primary/60">{iata}</p>
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

function CabinDropdown({ value, onChange }: { value: CabinClass; onChange: (v: CabinClass) => void; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cabin</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-3 border border-border rounded-xl bg-background hover:border-primary/50 transition-all text-left"
        data-testid="button-flight-cabin"
      >
        <span className="text-sm font-medium text-foreground flex-1 truncate">{CABIN_LABELS[value]}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl z-[60] overflow-hidden"
          >
            {(Object.keys(CABIN_LABELS) as CabinClass[]).map(c => (
              <button key={c} type="button" onClick={() => { onChange(c); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${value === c ? "text-primary font-semibold" : "text-foreground"}`}
                data-testid={`cabin-option-${c}`}
              >{CABIN_LABELS[c]}</button>
            ))}
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

  const makeDefaultLegs = (): MultiLeg[] => [
    { originIata: "", originDisplay: "", destIata: "", destDisplay: "", date: format(addDays(today, 30), "yyyy-MM-dd") },
    { originIata: "", originDisplay: "", destIata: "", destDisplay: "", date: format(addDays(today, 37), "yyyy-MM-dd") },
  ];
  const [legs, setLegs] = useState<MultiLeg[]>(makeDefaultLegs);

  function updateLeg(i: number, patch: Partial<MultiLeg>) {
    setLegs(ls => {
      const next = ls.map((l, j) => j === i ? { ...l, ...patch } : l);
      if (patch.destIata && i + 1 < next.length && !next[i + 1].originIata) {
        next[i + 1] = { ...next[i + 1], originIata: patch.destIata, originDisplay: patch.destDisplay || patch.destIata };
      }
      return next;
    });
  }

  function addLeg() {
    setLegs(ls => {
      const last = ls[ls.length - 1];
      return [...ls, {
        originIata: last.destIata, originDisplay: last.destDisplay,
        destIata: "", destDisplay: "",
        date: last.date,
      }];
    });
  }

  function removeLeg(i: number) {
    setLegs(ls => ls.filter((_, j) => j !== i));
  }

  function swapLeg(i: number) {
    setLegs(ls => ls.map((l, j) => j === i ? {
      ...l,
      originIata: l.destIata, originDisplay: l.destDisplay,
      destIata: l.originIata, destDisplay: l.originDisplay,
    } : l));
  }

  function swap() {
    const oi = originIata, od = originDisplay;
    setOriginIata(destIata); setOriginDisplay(destDisplay);
    setDestIata(oi); setDestDisplay(od);
  }

  const multiReady = tripType === "multicity" && legs.filter(l => l.originIata && l.destIata).length >= 2;
  const singleReady = tripType !== "multicity" && originIata && destIata;

  function handleSearch() {
    if (tripType === "multicity") {
      const validLegs = legs.filter(l => l.originIata && l.destIata);
      if (validLegs.length < 2) return;
      const params = new URLSearchParams({ tripType: "multicity", adults: String(adults), children: String(children), infants: String(infants), cabinClass });
      validLegs.forEach((l, i) => {
        params.set(`leg${i}_origin`, l.originIata);
        params.set(`leg${i}_dest`, l.destIata);
        params.set(`leg${i}_date`, l.date);
      });
      navigate(`/flights?${params.toString()}`);
      return;
    }
    if (!originIata || !destIata) return;
    const params = new URLSearchParams({
      origin: originIata, destination: destIata, depart,
      adults: String(adults), children: String(children), infants: String(infants),
      cabinClass, tripType,
      ...(originDisplay ? { originDisplay } : {}),
      ...(destDisplay ? { destDisplay } : {}),
      ...(tripType === "roundtrip" ? { return: returnDate } : {}),
    });
    navigate(`/flights?${params.toString()}`);
  }

  const TRIP_TABS: { key: TripType; icon: typeof ArrowRight; label: string }[] = [
    { key: "oneway", icon: ArrowRight, label: "One way" },
    { key: "roundtrip", icon: RefreshCw, label: "Round trip" },
    { key: "multicity", icon: LayoutList, label: "Multi-city" },
  ];

  const dateInputClass = "w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  const cardDateClass = "w-full bg-transparent text-sm font-medium text-foreground focus:outline-none";

  if (variant === "mobile") {
    return (
      <div className="px-4 pb-5 pt-3 space-y-3.5" data-testid="flight-search-panel-mobile">

        {/* Trip type — full width */}
        <div className="flex gap-1 p-1 bg-muted/80 rounded-xl">
          {TRIP_TABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setTripType(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tripType === key ? "bg-white dark:bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >{label}</button>
          ))}
        </div>

        {tripType === "multicity" ? (
          <>
            {legs.map((leg, i) => (
              <div key={i} className="border border-border rounded-2xl bg-background">
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Flight {i + 1}</span>
                  {legs.length > 2 && (
                    <button type="button" onClick={() => removeLeg(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <AirportField card iata={leg.originIata} display={leg.originDisplay}
                  onSelect={(iata, disp) => updateLeg(i, { originIata: iata, originDisplay: disp })}
                  placeholder="City or airport" label="From" testId={`input-mc-origin-${i}-mobile`} />
                <div className="border-t border-border" />
                <AirportField card iata={leg.destIata} display={leg.destDisplay}
                  onSelect={(iata, disp) => updateLeg(i, { destIata: iata, destDisplay: disp })}
                  placeholder="City or airport" label="To" testId={`input-mc-dest-${i}-mobile`} />
                <div className="border-t border-border px-4 py-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Date</p>
                  <input type="date" value={leg.date} min={i > 0 ? legs[i - 1].date : format(today, "yyyy-MM-dd")}
                    onChange={e => updateLeg(i, { date: e.target.value })}
                    className={cardDateClass} data-testid={`input-mc-date-${i}-mobile`} />
                </div>
              </div>
            ))}
            {legs.length < 5 && (
              <button type="button" onClick={addLeg}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                data-testid="button-add-leg-mobile">
                <Plus className="w-4 h-4" /> Add another flight
              </button>
            )}
          </>
        ) : (
          <>
            {/* FROM / swap / TO — unified card */}
            <div className="border border-border rounded-2xl bg-background">
              <AirportField card iata={originIata} display={originDisplay}
                onSelect={(i, d) => { setOriginIata(i); setOriginDisplay(d); }}
                placeholder="City or airport" label="From" testId="input-flight-origin-mobile" />
              <div className="relative h-0 border-t border-border">
                <button type="button" onClick={swap}
                  className="absolute right-4 top-0 -translate-y-1/2 w-7 h-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors shadow-sm z-10"
                  data-testid="button-swap-mobile">
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <AirportField card iata={destIata} display={destDisplay}
                onSelect={(i, d) => { setDestIata(i); setDestDisplay(d); }}
                placeholder="City or airport" label="To" testId="input-flight-dest-mobile" />
            </div>

            {/* Dates — card style */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border rounded-2xl px-4 py-3 bg-background">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Depart</p>
                <input type="date" value={depart} min={format(today, "yyyy-MM-dd")}
                  onChange={e => setDepart(e.target.value)}
                  className={cardDateClass} data-testid="input-flight-depart-mobile" />
              </div>
              <div className={`border rounded-2xl px-4 py-3 bg-background transition-opacity ${tripType === "roundtrip" ? "border-border opacity-100" : "border-border opacity-30 pointer-events-none"}`}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Return</p>
                <input type="date" value={returnDate} min={depart}
                  onChange={e => setReturnDate(e.target.value)}
                  className={cardDateClass} data-testid="input-flight-return-mobile"
                  disabled={tripType !== "roundtrip"} />
              </div>
            </div>
          </>
        )}

        {/* Passengers + Cabin — side by side */}
        <div className="grid grid-cols-2 gap-3">
          <PassengerSelector adults={adults} children={children} infants={infants}
            onChange={(a, c, i) => { setAdults(a); setChildren(c); setInfants(i); }} />
          <CabinDropdown value={cabinClass} onChange={setCabinClass} />
        </div>

        {/* Search */}
        <button type="button" onClick={handleSearch} disabled={!multiReady && !singleReady}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-flight-search-mobile"
        >
          <Search className="w-5 h-5" /> Search Flights
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
            {TRIP_TABS.map(({ key, icon: Icon, label }) => (
              <button key={key} type="button" onClick={() => setTripType(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tripType === key ? "bg-white dark:bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-trip-${key}`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />{label}
                </span>
              </button>
            ))}
          </div>

          {tripType === "multicity" ? (
            <>
              {/* Multi-city leg rows */}
              <div className="space-y-3 mb-4">
                {legs.map((leg, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="hidden sm:flex items-center justify-center w-7 h-10 shrink-0 text-xs font-bold text-muted-foreground rounded-lg bg-muted">
                      {i + 1}
                    </div>
                    <AirportField iata={leg.originIata} display={leg.originDisplay}
                      onSelect={(iata, disp) => updateLeg(i, { originIata: iata, originDisplay: disp })}
                      placeholder="City or airport" label={`From${i > 0 ? "" : ""}`} testId={`input-mc-origin-${i}`} />
                    <div className="flex items-end pb-1.5 shrink-0">
                      <button type="button" onClick={() => swapLeg(i)}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 transition-all"
                        data-testid={`button-swap-leg-${i}`}>
                        <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <AirportField iata={leg.destIata} display={leg.destDisplay}
                      onSelect={(iata, disp) => updateLeg(i, { destIata: iata, destDisplay: disp })}
                      placeholder="City or airport" label="To" testId={`input-mc-dest-${i}`} />
                    <div className="shrink-0 w-full sm:w-44">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</label>
                      <input type="date" value={leg.date}
                        min={i > 0 ? legs[i - 1].date : format(today, "yyyy-MM-dd")}
                        onChange={e => updateLeg(i, { date: e.target.value })}
                        className={dateInputClass} data-testid={`input-mc-date-${i}`} />
                    </div>
                    {legs.length > 2 ? (
                      <button type="button" onClick={() => removeLeg(i)}
                        className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-destructive/40 hover:text-destructive transition-all shrink-0 mb-0.5"
                        data-testid={`button-remove-leg-${i}`}>
                        <X className="w-4 h-4" />
                      </button>
                    ) : <div className="w-10 shrink-0 hidden sm:block" />}
                  </div>
                ))}
              </div>

              {/* Add leg + Passengers + Cabin */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start">
                {legs.length < 5 && (
                  <button type="button" onClick={addLeg}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-3 px-1"
                    data-testid="button-add-leg">
                    <Plus className="w-4 h-4" /> Add another flight
                  </button>
                )}
                <div className="flex-1" />
                <div className="w-full sm:w-56">
                  <PassengerSelector adults={adults} children={children} infants={infants}
                    onChange={(a, c, i) => { setAdults(a); setChildren(c); setInfants(i); }} />
                </div>
                <div className="w-full sm:w-48">
                  <CabinDropdown value={cabinClass} onChange={setCabinClass} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* One-way / Round-trip: FROM / swap / TO */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <AirportField iata={originIata} display={originDisplay}
                  onSelect={(i, d) => { setOriginIata(i); setOriginDisplay(d); }}
                  placeholder="City or airport" label="From" testId="input-flight-origin" />
                <div className="flex items-end pb-1.5">
                  <button type="button" onClick={swap}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 transition-all shrink-0"
                    data-testid="button-flight-swap">
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <AirportField iata={destIata} display={destDisplay}
                  onSelect={(i, d) => { setDestIata(i); setDestDisplay(d); }}
                  placeholder="City or airport" label="To" testId="input-flight-dest" />
              </div>

              {/* Dates / Passengers / Cabin */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className={tripType === "roundtrip" ? "col-span-1" : "col-span-2 sm:col-span-1"}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Depart</label>
                  <input type="date" value={depart} min={format(today, "yyyy-MM-dd")}
                    onChange={e => setDepart(e.target.value)} className={dateInputClass}
                    data-testid="input-flight-depart" required />
                </div>
                {tripType === "roundtrip" && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Return</label>
                    <input type="date" value={returnDate} min={depart}
                      onChange={e => setReturnDate(e.target.value)} className={dateInputClass}
                      data-testid="input-flight-return" />
                  </div>
                )}
                <PassengerSelector adults={adults} children={children} infants={infants}
                  onChange={(a, c, i) => { setAdults(a); setChildren(c); setInfants(i); }} />
                <CabinDropdown value={cabinClass} onChange={setCabinClass} />
              </div>
            </>
          )}

          {/* Search button */}
          <button type="button" onClick={handleSearch}
            disabled={tripType === "multicity" ? !multiReady : !singleReady}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white text-base font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-flight-search"
          >
            <Search className="w-5 h-5" /> Search Flights
          </button>

        </div>
      </div>
    </div>
  );
}

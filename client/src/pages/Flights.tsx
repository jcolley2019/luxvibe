import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetClose } from "@/components/ui/sheet";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import {
  Plane, ArrowLeftRight, ArrowUpDown, ArrowRight, ChevronDown, ChevronUp, Users, Search,
  Loader2, AlertCircle, Luggage, X, SlidersHorizontal, Clock,
  Check, RefreshCw, Wifi, Tv, Zap, Coffee, Armchair, Info,
  CreditCard, ShieldCheck, Plus, LayoutList, BedDouble,
} from "lucide-react";
import { usePreferences } from "@/context/preferences";
import { TravelModeTabs } from "@/components/TravelModeTabs";

type TripType = "oneway" | "roundtrip" | "multicity";
type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortMode = "best" | "price" | "duration" | "stops";

interface AirportSuggestion {
  iataCode: string;
  name?: string;
  cityName?: string;
  countryCode?: string;
  state?: string;
}

interface MultiCityLeg { origin: string; destination: string; date: string; }

interface FlightDuration { iso8601: string; minutes: number; }
interface FlightCarrier {
  marketingCode: string; marketingLogo: string; marketingName: string;
  operatingCode: string; operatingLogo: string; operatingName: string;
}
interface FlightSegment {
  segmentKey: string; originCode: string; originName: string;
  destinationCode: string; destinationName: string;
  departureTime: string; arrivalTime: string; direction: string;
  duration: FlightDuration;
  flight: { marketingNumber: string; operatingNumber: string; };
  carrier: FlightCarrier;
}
interface FlightBaggageItem {
  bagType: "cabin" | "checked"; description: string;
  passengerType: string; pieces: number; weightKg: number;
  pricing: { display: { amount: number; currency: string; }; };
}
interface FlightOffer {
  offerId: string; expiration: string;
  pricing: { display: { total: number; currency: string; base: number; fees: number; taxes: number; perPassenger: { adult: { total: number; currency: string; }; }; }; };
  fare: { family: string; mixedCabin: boolean; seatsRemaining: number; };
  terms: { changeable: boolean; refundable: boolean; summary: { level: string; message: string; }[]; changeFee: any; refundFee: any; };
  baggage: { hasCarryOnBag: boolean; hasCheckedBag: boolean; included: FlightBaggageItem[]; };
  provider: { code: string; logo: string; };
  segmentFares: { segmentKey: string; bookingCode: string; cabin: string; fareFamily: string; seatsRemaining: number; }[];
  segmentAmenities?: { segmentKey: string; aircraftType: string; amenities: { available: boolean; category: string; chargeable: boolean | null; name: string; details: string | null; }[]; }[];
}
interface FlightConnection {
  arrivalAirportCode: string; arrivalAirportName: string; arrivalTime: string;
  departureAirportCode: string; departureAirportName: string; departureTime: string;
  direction: string; duration: FlightDuration; changeAirport: boolean; overnight: boolean;
}
interface FlightJourney {
  journeyKey: string; isCheapest: boolean; timestamp: string;
  totalDuration: FlightDuration;
  legDurations: { direction: string; duration: FlightDuration; dayChange: number; overnightFlight: boolean; }[];
  parameters: { adults: number; children: number; infants: number; };
  segments: FlightSegment[];
  offers: FlightOffer[];
  connections?: FlightConnection[];
  cheapestOffer?: FlightOffer;
}
interface SortMeta { journeyKey: string | null; offerId?: string | null; price?: number; currency?: string; }
interface FlightSearchResponse {
  data: { journeys: FlightJourney[]; sortMetadata: { best: SortMeta; price: SortMeta; duration: SortMeta; stops: SortMeta; }; }[];
  error?: { message: string; description?: string; };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTime(isoString: string): string {
  try {
    const [, timePart] = isoString.split("T");
    if (!timePart) return isoString;
    return timePart.slice(0, 5);
  } catch { return isoString; }
}

function formatDate(isoString: string): string {
  try {
    const [datePart] = isoString.split("T");
    const [, month, day] = datePart.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
  } catch { return isoString; }
}

function getStopsLabel(count: number): string {
  if (count === 0) return "Nonstop";
  if (count === 1) return "1 stop";
  return `${count} stops`;
}

function getStopsColor(count: number): string {
  if (count === 0) return "text-green-600 dark:text-green-400";
  if (count === 1) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

function AirportCardField({
  iata, display, airportName, onSelect, placeholder, label, testId,
}: {
  iata: string; display: string; airportName?: string;
  onSelect: (iata: string, display: string, name: string) => void;
  placeholder: string; label: string; testId: string;
}) {
  const [query, setQuery] = useState(display);
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!iata);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(display); }, [display]);
  useEffect(() => { if (iata) setEditing(false); else setEditing(true); }, [iata]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (!iata) setQuery(""); else setQuery(display);
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

  function handleSelect(s: AirportSuggestion) {
    const city = s.cityName || s.name || s.iataCode;
    const lbl = city + (s.countryCode ? `, ${s.countryCode}` : "");
    const name = s.name && s.cityName ? s.name : "";
    onSelect(s.iataCode, lbl, name);
    setQuery(lbl);
    setEditing(false);
    setOpen(false);
    setSuggestions([]);
  }

  function handleCardClick() {
    onSelect("", "", "");
    setQuery("");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={ref} className="relative px-4 py-3 min-h-[72px]">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      {iata && !editing ? (
        <button type="button" onClick={handleCardClick}
          className="flex items-start gap-3 w-full text-left"
          data-testid={testId}>
          <span className="font-mono font-bold text-sm text-foreground w-9 shrink-0 mt-0.5">{iata}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{display}</p>
            {airportName && (
              <p className="text-xs text-muted-foreground truncate">{airportName}</p>
            )}
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-2.5">
          <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => { setQuery(""); if (suggestions.length > 0) setOpen(true); }}
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
              <button key={i} type="button" onMouseDown={() => handleSelect(s)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border last:border-0"
                data-testid={`airport-option-${s.iataCode}`}>
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

function AirportInput({
  value, onChange, placeholder, label, testId,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; label: string; testId: string;
}) {
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<AirportSuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { if (!value) setSelectedAirport(null); }, [value]);

  const handleChange = useCallback((raw: string) => {
    const v = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    onChange(v);
    setSelectedAirport(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (v.length >= 2) {
      setLoading(true);
      debounce.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/flights/airports?q=${encodeURIComponent(v)}`);
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
          setOpen(true);
        } catch { setSuggestions([]); }
        finally { setLoading(false); }
      }, 300);
    } else { setSuggestions([]); setOpen(false); }
  }, [onChange]);

  function handleSelect(s: AirportSuggestion) {
    onChange(s.iataCode);
    setSelectedAirport(s);
    setOpen(false);
    setSuggestions([]);
  }

  const subtitle = selectedAirport
    ? [selectedAirport.cityName, selectedAirport.countryCode].filter(Boolean).join(", ")
    : null;

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          maxLength={3}
          className="w-full pl-9 pr-3 py-3 border border-border rounded-xl bg-background text-foreground font-mono font-semibold text-lg tracking-widest uppercase placeholder:font-sans placeholder:font-normal placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          data-testid={testId}
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      {subtitle && <p className="mt-1 pl-1 text-xs text-muted-foreground truncate">{subtitle}</p>}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 w-full min-w-[260px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => handleSelect(s)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border last:border-0"
                data-testid={`airport-option-${s.iataCode}`}>
                <span className="font-mono font-bold text-sm text-foreground w-8 shrink-0 mt-0.5">{s.iataCode}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {s.cityName || s.name || s.iataCode}
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

function PassengerSelector({
  adults, children, infants,
  onChange,
}: {
  adults: number; children: number; infants: number;
  onChange: (adults: number, children: number, infants: number) => void;
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
        <button type="button" onClick={onDec} disabled={value <= min} aria-label={`Decrease ${label}`}
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg leading-none">−</button>
        <span className="w-4 text-center font-semibold text-sm">{value}</span>
        <button type="button" onClick={onInc} disabled={total >= 9} aria-label={`Increase ${label}`}
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
        data-testid="button-passengers"
      >
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground">{total} Passenger{total !== 1 ? "s" : ""}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-4"
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

function FlightCard({ journey, currency, adults, onSelect }: { journey: FlightJourney; currency: string; adults: number; onSelect: () => void; }) {
  const [expanded, setExpanded] = useState(false);
  const offer = journey.offers[0];
  if (!offer) return null;

  const outSegments = journey.segments.filter(s => s.direction === "OUTBOUND" || journey.segments.every(x => !x.direction));
  const inSegments = journey.segments.filter(s => s.direction === "INBOUND");
  const outConnections = journey.connections?.filter(c => c.direction === "OUTBOUND") || [];
  const inConnections = journey.connections?.filter(c => c.direction === "INBOUND") || [];

  const outDuration = journey.legDurations.find(l => l.direction === "OUTBOUND")?.duration.minutes
    || (outSegments.length > 0 ? outSegments.reduce((a, s) => a + s.duration.minutes, 0) : journey.totalDuration.minutes);
  const inDuration = journey.legDurations.find(l => l.direction === "INBOUND")?.duration.minutes;
  const outStops = outSegments.length - 1;
  const inStops = inSegments.length - 1;

  const outFirst = outSegments[0];
  const outLast = outSegments[outSegments.length - 1];
  const inFirst = inSegments[0];
  const inLast = inSegments[inSegments.length - 1];

  const dayChange = journey.legDurations.find(l => l.direction === "OUTBOUND")?.dayChange || 0;
  const inDayChange = journey.legDurations.find(l => l.direction === "INBOUND")?.dayChange || 0;

  const pricePerAdult = offer.pricing.display.perPassenger?.adult?.total || offer.pricing.display.total / adults;
  const totalPrice = offer.pricing.display.total;
  const cur = offer.pricing.display.currency || currency;

  const formatPrice = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(amount);

  function SegmentRow({ segments, connections, direction, duration, dayChangeVal }: {
    segments: FlightSegment[]; connections: FlightConnection[]; direction: string; duration?: number; dayChangeVal: number;
  }) {
    if (!segments.length) return null;
    const first = segments[0];
    const last = segments[segments.length - 1];
    const stops = segments.length - 1;
    const mainCarrier = first.carrier;

    return (
      <div className="flex items-center gap-4 py-3">
        <div className="flex items-center gap-2 w-32 shrink-0">
          <img
            src={mainCarrier.marketingLogo}
            alt={mainCarrier.marketingName}
            className="w-7 h-7 rounded-md object-contain bg-white border border-border p-0.5"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{mainCarrier.marketingName}</div>
            <div className="text-xs text-muted-foreground">{mainCarrier.marketingCode}{first.flight.marketingNumber}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground tabular-nums">{formatTime(first.departureTime)}</div>
            <div className="text-xs font-semibold text-foreground">{first.originCode}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[70px]">{first.originName?.split(" ").slice(0, 2).join(" ")}</div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs text-muted-foreground">{duration ? formatDuration(duration) : formatDuration(segments.reduce((a,s)=>a+s.duration.minutes,0))}</div>
            <div className="relative w-full flex items-center">
              <div className="absolute inset-y-0 left-0 right-0 border-t border-dashed border-border top-1/2" />
              {stops > 0 && connections.slice(0, stops).map((c, i) => (
                <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 border border-amber-500 z-10"
                  style={{ left: `${((i + 1) / (stops + 1)) * 100}%`, transform: "translate(-50%, -50%)" }}
                  title={`${c.arrivalAirportCode} (${formatDuration(c.duration.minutes)} layover)`} />
              ))}
            </div>
            <div className={`text-xs font-medium ${getStopsColor(stops)}`}>{getStopsLabel(stops)}</div>
            {stops > 0 && connections.length > 0 && (
              <div className="text-xs text-muted-foreground">via {connections.slice(0, stops).map(c => c.arrivalAirportCode).join(", ")}</div>
            )}
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-foreground tabular-nums">
              {formatTime(last.arrivalTime)}
              {dayChangeVal > 0 && <sup className="text-xs text-amber-500 ml-0.5">+{dayChangeVal}</sup>}
            </div>
            <div className="text-xs font-semibold text-foreground">{last.destinationCode}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[70px]">{last.destinationName?.split(" ").slice(0, 2).join(" ")}</div>
          </div>
        </div>

        <div className="hidden sm:block text-xs text-muted-foreground shrink-0">
          {direction}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
      data-testid={`flight-card-${journey.journeyKey}`}
    >
      <div className="px-4 sm:px-6">
        <SegmentRow segments={outSegments} connections={outConnections} direction="Outbound" duration={outDuration} dayChangeVal={dayChange} />
        {inSegments.length > 0 && (
          <>
            <div className="border-t border-dashed border-border" />
            <SegmentRow segments={inSegments} connections={inConnections} direction="Return" duration={inDuration} dayChangeVal={inDayChange} />
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-muted/30 border-t border-border gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {offer.baggage.hasCarryOnBag && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Luggage className="w-3.5 h-3.5" /> Carry-on
            </span>
          )}
          {offer.baggage.hasCheckedBag && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
              <Check className="w-3.5 h-3.5" /> Checked bag
            </span>
          )}
          {!offer.baggage.hasCheckedBag && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <X className="w-3.5 h-3.5" /> No checked bag
            </span>
          )}
          {offer.terms.refundable ? (
            <Badge variant="outline" className="text-xs border-green-400 text-green-600 dark:text-green-400 py-0">Refundable</Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground py-0">Non-refundable</Badge>
          )}
          {offer.fare.seatsRemaining <= 5 && offer.fare.seatsRemaining > 0 && (
            <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 dark:text-amber-400 py-0">
              {offer.fare.seatsRemaining} seats left
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{offer.fare.family}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xl font-bold text-primary">{formatPrice(totalPrice)}</div>
            {adults > 1 && (
              <div className="text-xs text-muted-foreground">{formatPrice(pricePerAdult)}/person</div>
            )}
          </div>
          <Button
            size="sm"
            onClick={onSelect}
            className="rounded-full px-5 font-semibold"
            data-testid={`button-select-flight-${journey.journeyKey}`}
          >
            Select
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors border-t border-border"
        data-testid={`button-expand-${journey.journeyKey}`}
      >
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less details</> : <><ChevronDown className="w-3.5 h-3.5" /> More details</>}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 sm:px-6 py-4 space-y-4">
              {journey.segments.map((seg, i) => (
                <div key={seg.segmentKey} className="flex gap-4 text-sm">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2 h-2 rounded-full border-2 border-primary" />
                    <div className="w-px flex-1 border-l border-dashed border-border my-1" />
                    <div className="w-2 h-2 rounded-full border-2 border-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="font-semibold text-foreground">
                        {formatTime(seg.departureTime)} · {seg.originCode} — {seg.originName}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(seg.departureTime)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <img src={seg.carrier.marketingLogo} alt={seg.carrier.marketingName}
                        className="w-5 h-5 rounded object-contain bg-white border border-border p-px"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      {seg.carrier.marketingName} · {seg.carrier.marketingCode}{seg.flight.marketingNumber} · {formatDuration(seg.duration.minutes)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {formatTime(seg.arrivalTime)} · {seg.destinationCode} — {seg.destinationName}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(seg.arrivalTime)}</div>
                    </div>
                    {journey.connections?.[i] && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                          {formatDuration(journey.connections[i].duration.minutes)} layover · {journey.connections[i].arrivalAirportCode}
                          {journey.connections[i].changeAirport && " · ⚠ Airport change"}
                          {journey.connections[i].overnight && " · Overnight"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t border-border pt-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Price breakdown</div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base fare</span>
                  <span className="text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(offer.pricing.display.base)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxes & fees</span>
                  <span className="text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(offer.pricing.display.taxes + offer.pricing.display.fees)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(offer.pricing.display.total)}</span>
                </div>
              </div>

              {offer.terms.summary.length > 0 && (
                <div className="border-t border-border pt-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fare conditions</div>
                  <div className="space-y-1">
                    {offer.terms.summary.map((t, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs ${t.level === "danger" ? "text-red-500" : t.level === "warning" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        {t.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-foreground text-sm">{question}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

function FlightCheckoutSheet({
  journey, offer, adults, children, infants, currency, open, onClose,
}: {
  journey: FlightJourney; offer: FlightOffer; adults: number; children: number; infants: number;
  currency: string; open: boolean; onClose: () => void;
}) {
  type CheckoutStep = "verifying" | "form" | "payment";
  const [step, setStep] = useState<CheckoutStep>("verifying");
  const [verifyData, setVerifyData] = useState<any>(null);
  const [prebookData, setPrebookData] = useState<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkInit, setSdkInit] = useState(false);

  const passengerTypes = [
    ...Array(adults).fill(null).map((_, i) => ({ type: "ADT" as const, label: `Adult ${adults > 1 ? i + 1 : ""}`.trim() })),
    ...Array(children).fill(null).map((_, i) => ({ type: "CHD" as const, label: `Child ${children > 1 ? i + 1 : ""}`.trim() })),
    ...Array(infants).fill(null).map((_, i) => ({ type: "INF" as const, label: `Infant ${infants > 1 ? i + 1 : ""}`.trim() })),
  ];

  const [passengers, setPassengers] = useState(() =>
    passengerTypes.map(p => ({
      type: p.type, firstName: "", lastName: "", birthday: "",
      nationality: "", gender: "M" as "M" | "F",
      documentType: "passport", documentNumber: "", documentIssueCountry: "", documentExpiry: "",
    }))
  );
  const [contact, setContact] = useState({ firstName: "", email: "" });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [alsoNeedHotel, setAlsoNeedHotel] = useState(false);

  const verify = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/flights/verify", { offerId: offer.offerId });
      return res.json();
    },
    onSuccess: (data) => {
      const journey = data.data?.[0]?.journey || data.data?.journey || data.journey;
      setVerifyData(journey);
      setStep("form");
    },
    onError: () => setStep("form"),
  });

  const prebook = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/flights/prebook", {
        offerId: offer.offerId,
        passengers: passengers.map(p => ({
          type: p.type, firstName: p.firstName, lastName: p.lastName,
          birthday: p.birthday, gender: p.gender, nationality: p.nationality,
          documentType: p.documentType, documentNumber: p.documentNumber,
          documentIssueCountry: p.documentIssueCountry || p.nationality,
          documentExpiry: p.documentExpiry,
        })),
        contact,
      });
      const data = await res.json();
      if (data.error || data.message) throw new Error(data.message || data.error?.message || "Prebook failed");
      return data;
    },
    onSuccess: (data) => {
      setPrebookData(data);
      sessionStorage.setItem("flightPassengers", JSON.stringify(passengers));
      sessionStorage.setItem("flightContact", JSON.stringify(contact));
      const inboundSegs = journey.segments.filter(s => s.direction === "INBOUND");
      sessionStorage.setItem("flightData", JSON.stringify({
        origin: journey.segments[0]?.originCode,
        destination: journey.segments[journey.segments.length - 1]?.destinationCode,
        departTime: journey.segments[0]?.departureTime,
        returnDate: inboundSegs[0]?.departureTime?.split("T")[0] || null,
        adults,
        alsoNeedHotel,
        price: offer.pricing.display.total,
        currency: offer.pricing.display.currency || currency,
      }));
      if (!document.querySelector('script[src*="liteAPIPayment"]')) {
        const s = document.createElement("script");
        s.src = "https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1";
        s.async = true;
        s.onload = () => setSdkLoaded(true);
        document.body.appendChild(s);
      } else if ((window as any).LiteAPIPayment) {
        setSdkLoaded(true);
      }
      setStep("payment");
    },
  });

  useEffect(() => {
    if (sdkLoaded && prebookData && !sdkInit) {
      setSdkInit(true);
      try {
        const payment = new (window as any).LiteAPIPayment({
          publicKey: prebookData.paymentEnv === "live" ? "live" : "sandbox",
          secretKey: prebookData.secretKey,
          returnUrl: `${window.location.origin}/flight-confirmation?prebookId=${prebookData.prebookId}`,
          targetElement: "#flight-payment-sdk",
          appearance: { theme: "flat", variables: { colorPrimary: "#1d4ed8" } },
          options: { business: { name: "Luxvibe" } },
        });
        payment.handlePayment();
      } catch (err) { console.error("Flight SDK error:", err); }
    }
  }, [sdkLoaded, prebookData, sdkInit]);

  useEffect(() => {
    if (open) { verify.mutate(); }
    else {
      setStep("verifying"); setVerifyData(null); setPrebookData(null);
      setSdkLoaded(false); setSdkInit(false); setFormErrors([]);
      setAlsoNeedHotel(false);
      prebook.reset(); verify.reset();
    }
  }, [open]);

  function validate() {
    const errs: string[] = [];
    passengers.forEach((p, i) => {
      const n = i + 1;
      if (!p.firstName.trim()) errs.push(`Passenger ${n}: first name required`);
      if (!p.lastName.trim()) errs.push(`Passenger ${n}: last name required`);
      if (!p.birthday) errs.push(`Passenger ${n}: date of birth required`);
      if (!p.nationality.trim() || p.nationality.length !== 2) errs.push(`Passenger ${n}: 2-letter nationality required (e.g. US)`);
      if (!p.documentNumber.trim()) errs.push(`Passenger ${n}: passport number required`);
      if (!p.documentExpiry) errs.push(`Passenger ${n}: passport expiry required`);
    });
    if (!contact.firstName.trim()) errs.push("Contact first name required");
    if (!contact.email.includes("@")) errs.push("Valid contact email required");
    return errs;
  }

  function handleProceed() {
    const errs = validate();
    if (errs.length) { setFormErrors(errs); return; }
    setFormErrors([]);
    prebook.mutate();
  }

  const cur = offer.pricing.display.currency || currency;
  const formatPrice = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
  const outSegs = journey.segments.filter(s => s.direction === "OUTBOUND" || journey.segments.every(x => !x.direction));
  const inSegs = journey.segments.filter(s => s.direction === "INBOUND");
  const outFirst = outSegs[0]; const outLast = outSegs[outSegs.length - 1];
  const inFirst = inSegs[0]; const inLast = inSegs[inSegs.length - 1];
  const carrier = outFirst?.carrier;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:!max-w-2xl p-0 overflow-hidden flex flex-col [&>button]:top-4 [&>button]:right-4">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-bold flex-1">Complete your booking</SheetTitle>
          <p className="text-xs text-muted-foreground hidden sm:block">Secure payment via LiteAPI</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              {carrier && (
                <img src={carrier.marketingLogo} alt={carrier.marketingName}
                  className="w-8 h-8 rounded-lg object-contain bg-white border border-border p-0.5"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{carrier?.marketingName}</p>
                <p className="text-xs text-muted-foreground">{outSegs.length - 1 === 0 ? "Nonstop" : `${outSegs.length - 1} stop${outSegs.length > 2 ? "s" : ""}`}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-lg text-foreground">{formatPrice(offer.pricing.display.total)}</p>
                <p className="text-xs text-muted-foreground">{adults + children + infants} passenger{adults + children + infants !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {outFirst && outLast && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold font-mono">{outFirst.originCode}</span>
                <span className="text-muted-foreground text-xs">{formatTime(outFirst.departureTime)}</span>
                <div className="flex-1 border-t border-dashed border-border mx-1" />
                <span className="text-xs text-muted-foreground">{formatDuration(journey.legDurations.find(l => l.direction === "OUTBOUND")?.duration.minutes || journey.totalDuration.minutes)}</span>
                <div className="flex-1 border-t border-dashed border-border mx-1" />
                <span className="text-muted-foreground text-xs">{formatTime(outLast.arrivalTime)}</span>
                <span className="font-bold font-mono">{outLast.destinationCode}</span>
              </div>
            )}
            {inFirst && inLast && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="font-bold font-mono">{inFirst.originCode}</span>
                <span className="text-muted-foreground text-xs">{formatTime(inFirst.departureTime)}</span>
                <div className="flex-1 border-t border-dashed border-border mx-1" />
                <span className="text-xs text-muted-foreground">{formatDuration(journey.legDurations.find(l => l.direction === "INBOUND")?.duration.minutes || 0)}</span>
                <div className="flex-1 border-t border-dashed border-border mx-1" />
                <span className="text-muted-foreground text-xs">{formatTime(inLast.arrivalTime)}</span>
                <span className="font-bold font-mono">{inLast.destinationCode}</span>
              </div>
            )}
          </div>

          {step === "verifying" && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Verifying latest price…</p>
              <p className="text-xs text-muted-foreground">Confirming availability with the airline</p>
            </div>
          )}

          {step === "form" && (
            <div className="px-6 py-5 space-y-6">
              {verifyData?.pricing && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Price confirmed: <span className="font-bold">{formatPrice(verifyData.pricing.display.total)}</span>
                    {verifyData.terms?.summary?.[0] && <span className="ml-2 opacity-70">· {verifyData.terms.summary[0].message}</span>}
                  </p>
                </div>
              )}

              {passengerTypes.map((pt, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">{pt.label || (pt.type === "ADT" ? "Adult" : pt.type === "CHD" ? "Child" : "Infant")}</h3>
                    <Badge variant="outline" className="text-xs py-0 ml-auto">{pt.type === "ADT" ? "Adult" : pt.type === "CHD" ? "Child" : "Infant"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</label>
                      <Input value={passengers[i].firstName}
                        onChange={e => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, firstName: e.target.value } : p))}
                        placeholder="As on passport" className="mt-1 rounded-xl" data-testid={`input-pax-${i}-fn`} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name *</label>
                      <Input value={passengers[i].lastName}
                        onChange={e => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, lastName: e.target.value } : p))}
                        placeholder="As on passport" className="mt-1 rounded-xl" data-testid={`input-pax-${i}-ln`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth *</label>
                      <Input type="date" value={passengers[i].birthday}
                        onChange={e => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, birthday: e.target.value } : p))}
                        className="mt-1 rounded-xl" data-testid={`input-pax-${i}-dob`} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nationality *</label>
                      <Input value={passengers[i].nationality} maxLength={2}
                        onChange={e => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, nationality: e.target.value.toUpperCase().slice(0, 2) } : p))}
                        placeholder="US" className="mt-1 rounded-xl font-mono uppercase tracking-widest" data-testid={`input-pax-${i}-nat`} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gender *</label>
                      <div className="flex gap-1.5 mt-1">
                        {(["M", "F"] as const).map(g => (
                          <button key={g} type="button"
                            onClick={() => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, gender: g } : p))}
                            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${passengers[i].gender === g ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                            data-testid={`btn-gender-${i}-${g}`}
                          >
                            {g === "M" ? "M" : "F"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passport No. *</label>
                      <Input value={passengers[i].documentNumber}
                        onChange={e => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, documentNumber: e.target.value.toUpperCase() } : p))}
                        placeholder="AB1234567" className="mt-1 rounded-xl font-mono uppercase" data-testid={`input-pax-${i}-docnum`} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiry *</label>
                      <Input type="date" value={passengers[i].documentExpiry}
                        onChange={e => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, documentExpiry: e.target.value } : p))}
                        className="mt-1 rounded-xl" data-testid={`input-pax-${i}-docexp`} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Country</label>
                      <Input value={passengers[i].documentIssueCountry} maxLength={2}
                        onChange={e => setPassengers(ps => ps.map((p, j) => j === i ? { ...p, documentIssueCountry: e.target.value.toUpperCase().slice(0, 2) } : p))}
                        placeholder={passengers[i].nationality || "US"} className="mt-1 rounded-xl font-mono uppercase tracking-widest" data-testid={`input-pax-${i}-issuecc`} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="space-y-3 border-t border-border pt-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Contact Details</h3>
                </div>
                <p className="text-xs text-muted-foreground">E-ticket and booking confirmation will be sent to this email.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</label>
                    <Input value={contact.firstName} onChange={e => setContact(c => ({ ...c, firstName: e.target.value }))}
                      placeholder="John" className="mt-1 rounded-xl" data-testid="input-contact-name" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email *</label>
                    <Input type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                      placeholder="you@example.com" className="mt-1 rounded-xl" data-testid="input-contact-email" />
                  </div>
                </div>
              </div>

              {formErrors.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl space-y-1">
                  {formErrors.map((e, i) => <p key={i} className="text-xs text-destructive">{e}</p>)}
                </div>
              )}

              {prebook.isError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-xs text-destructive">{(prebook.error as Error)?.message || "Failed to reserve this flight. Please try again."}</p>
                </div>
              )}

              <div
                className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                onClick={() => setAlsoNeedHotel(v => !v)}
                data-testid="checkbox-also-need-hotel"
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${alsoNeedHotel ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                  {alsoNeedHotel && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-primary" /> I also need a hotel for this trip
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">After your flight is booked, we'll take you to hotel search with your dates pre-filled.</p>
                </div>
              </div>

              <div className="pb-8">
                <Button onClick={handleProceed} disabled={prebook.isPending} className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                  data-testid="button-proceed-payment">
                  {prebook.isPending
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Reserving flight…</>
                    : <><CreditCard className="w-5 h-5" /> Proceed to Payment — {formatPrice(verifyData?.pricing?.display?.total ?? offer.pricing.display.total)}</>
                  }
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure checkout. Card charged only after booking confirms.
                </p>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="px-6 py-5">
              {!sdkLoaded && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading payment form…
                </div>
              )}
              <div id="flight-payment-sdk" className="min-h-[300px]" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Flights() {
  const { currency } = usePreferences();
  const today = new Date();
  const defaultDepart = format(addDays(today, 30), "yyyy-MM-dd");
  const defaultReturn = format(addDays(today, 37), "yyyy-MM-dd");

  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [origin, setOrigin] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [originAirportName, setOriginAirportName] = useState("");
  const [destination, setDestination] = useState("");
  const [destDisplay, setDestDisplay] = useState("");
  const [destAirportName, setDestAirportName] = useState("");
  const [departDate, setDepartDate] = useState(defaultDepart);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>("ECONOMY");
  const [cabinOpen, setCabinOpen] = useState(false);
  const cabinRef = useRef<HTMLDivElement>(null);
  const [multiLegs, setMultiLegs] = useState<MultiCityLeg[]>([
    { origin: "", destination: "", date: defaultDepart },
    { origin: "", destination: "", date: defaultReturn },
  ]);

  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [filterMaxStops, setFilterMaxStops] = useState<number>(-1);
  const [filterRefundable, setFilterRefundable] = useState(false);
  const [filterCheckedBag, setFilterCheckedBag] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(10000);
  const [filterAirlines, setFilterAirlines] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<FlightSearchResponse | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<{ journey: FlightJourney; offer: FlightOffer } | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cabinRef.current && !cabinRef.current.contains(e.target as Node)) setCabinOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("POST", "/api/flights/search", body);
      return res.json() as Promise<FlightSearchResponse>;
    },
    onSuccess: data => setResults(data),
  });

  const autoSearchFiredRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tt = params.get("tripType");
    if (tt === "multicity") {
      setTripType("multicity");
      const parsed: MultiCityLeg[] = [];
      for (let i = 0; i < 5; i++) {
        const o = params.get(`leg${i}_origin`);
        const d = params.get(`leg${i}_dest`);
        const dt = params.get(`leg${i}_date`);
        if (o && d) parsed.push({ origin: o, destination: d, date: dt || defaultDepart });
      }
      if (parsed.length >= 2) {
        setMultiLegs(parsed);
        const validLegs = parsed.filter(l => l.origin && l.destination);
        const a = Number(params.get("adults") || "1");
        const c = Number(params.get("children") || "0");
        const inf = Number(params.get("infants") || "0");
        const cab = (params.get("cabinClass") || "ECONOMY") as CabinClass;
        if (validLegs.length >= 2) {
          mutation.mutate({ legs: validLegs.map(l => ({ origin: l.origin, destination: l.destination, date: l.date })), adults: a, children: c, infants: inf, cabinClass: cab, currency: currency || "USD", country: "US" });
        }
      }
    } else if (tt === "oneway" || tt === "roundtrip") {
      setTripType(tt as TripType);
    }
    const o = params.get("origin"); const d = params.get("destination");
    if (o) setOrigin(o); if (d) setDestination(d);
    const od = params.get("originDisplay"); if (od) setOriginDisplay(od);
    const dd = params.get("destDisplay"); if (dd) setDestDisplay(dd);
    const on = params.get("originAirportName"); if (on) setOriginAirportName(on);
    const dn = params.get("destAirportName"); if (dn) setDestAirportName(dn);
    const dep = params.get("depart") || defaultDepart;
    if (params.get("depart")) setDepartDate(dep);
    const ret = params.get("return"); if (ret) setReturnDate(ret);
    const a = params.get("adults"); if (a) setAdults(Number(a));
    const c = params.get("children"); if (c) setChildren(Number(c));
    const inf = params.get("infants"); if (inf) setInfants(Number(inf));
    const cab = params.get("cabinClass"); if (cab && cab in CABIN_LABELS) setCabinClass(cab as CabinClass);

    // Auto-search when navigating from homepage — use raw URL values to avoid async state delay
    if (o && d && tt !== "multicity" && !autoSearchFiredRef.current) {
      autoSearchFiredRef.current = true;
      const autoAdults = Number(params.get("adults") || "1");
      const autoChildren = Number(params.get("children") || "0");
      const autoInfants = Number(params.get("infants") || "0");
      const autoCabinClass = (params.get("cabinClass") || "ECONOMY") as CabinClass;
      const tripTypeVal = tt || "roundtrip";
      const legs: any[] = [{ origin: o, destination: d, date: dep, direction: "OUTBOUND" }];
      if (tripTypeVal === "roundtrip" && ret) {
        legs.push({ origin: d, destination: o, date: ret, direction: "INBOUND" });
      }
      mutation.mutate({ legs, adults: autoAdults, children: autoChildren, infants: autoInfants, cabinClass: autoCabinClass, currency: currency || "USD", country: "US" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (tripType === "multicity") {
      const validLegs = multiLegs.filter(l => l.origin && l.destination);
      if (validLegs.length < 2) return;
      mutation.mutate({ legs: validLegs.map(l => ({ origin: l.origin, destination: l.destination, date: l.date })), adults, children, infants, cabinClass, currency: currency || "USD", country: "US" });
      setResults(null);
      return;
    }
    if (!origin || !destination) return;
    const legs: any[] = [{ origin, destination, date: departDate, direction: "OUTBOUND" }];
    if (tripType === "roundtrip" && returnDate) {
      legs.push({ origin: destination, destination: origin, date: returnDate, direction: "INBOUND" });
    }
    mutation.mutate({ legs, adults, children, infants, cabinClass, currency: currency || "USD", country: "US" });
    setResults(null);
  }

  function swapAirports() {
    setOrigin(destination); setDestination(origin);
    setOriginDisplay(destDisplay); setDestDisplay(originDisplay);
    setOriginAirportName(destAirportName); setDestAirportName(originAirportName);
  }

  const allJourneys: FlightJourney[] = [];
  if (results?.data) {
    const seen = new Map<string, FlightJourney>();
    for (const batch of results.data) {
      for (const j of batch.journeys) {
        const existing = seen.get(j.journeyKey);
        const price = j.offers[0]?.pricing.display.total ?? Infinity;
        const existingPrice = existing?.offers[0]?.pricing.display.total ?? Infinity;
        if (!existing || price < existingPrice) seen.set(j.journeyKey, j);
      }
    }
    allJourneys.push(...seen.values());
  }

  const sortedMeta = results?.data?.[0]?.sortMetadata;

  const uniqueAirlines: { iataCode: string; name: string; logo: string }[] = [];
  {
    const seen = new Set<string>();
    for (const j of allJourneys) {
      const outFirst = j.segments.find(s => s.direction === "OUTBOUND" || j.segments.every(x => !x.direction));
      const c = outFirst?.carrier;
      if (c && c.marketingCode && !seen.has(c.marketingCode)) {
        seen.add(c.marketingCode);
        uniqueAirlines.push({ iataCode: c.marketingCode, name: c.marketingName, logo: c.marketingLogo });
      }
    }
    uniqueAirlines.sort((a, b) => a.name.localeCompare(b.name));
  }

  const filtered = allJourneys.filter(j => {
    const offer = j.offers[0];
    if (!offer) return false;
    if (filterRefundable && !offer.terms.refundable) return false;
    if (filterCheckedBag && !offer.baggage.hasCheckedBag) return false;
    if (filterMaxStops !== -1) {
      const outStops = j.segments.filter(s => s.direction === "OUTBOUND" || j.segments.every(x => !x.direction)).length - 1;
      if (outStops > filterMaxStops) return false;
    }
    if (offer.pricing.display.total > filterMaxPrice) return false;
    if (filterAirlines.size > 0) {
      const outFirst = j.segments.find(s => s.direction === "OUTBOUND" || j.segments.every(x => !x.direction));
      if (!outFirst || !filterAirlines.has(outFirst.carrier.marketingCode)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ao = a.offers[0], bo = b.offers[0];
    if (sortMode === "price") return (ao?.pricing.display.total ?? 999999) - (bo?.pricing.display.total ?? 999999);
    if (sortMode === "duration") return a.totalDuration.minutes - b.totalDuration.minutes;
    if (sortMode === "stops") return a.segments.length - b.segments.length;
    if (sortMode === "best") {
      if (sortedMeta?.best?.journeyKey === a.journeyKey) return -1;
      if (sortedMeta?.best?.journeyKey === b.journeyKey) return 1;
      return (ao?.pricing.display.total ?? 999999) - (bo?.pricing.display.total ?? 999999);
    }
    return 0;
  });

  const maxResultPrice = allJourneys.reduce((max, j) => Math.max(max, j.offers[0]?.pricing.display.total ?? 0), 0);

  const CABIN_LABELS: Record<CabinClass, string> = {
    ECONOMY: "Economy", PREMIUM_ECONOMY: "Premium Economy", BUSINESS: "Business", FIRST: "First Class",
  };

  const SORT_TABS: { key: SortMode; label: string }[] = [
    { key: "best", label: "Best" },
    { key: "price", label: "Cheapest" },
    { key: "duration", label: "Fastest" },
    { key: "stops", label: "Fewest stops" },
  ];

  document.title = "Flights — Luxvibe";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero — title + search card both inside the image */}
      <div className="relative overflow-hidden flex flex-col">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1800&q=80"
          alt="Airplane above clouds"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/55 via-slate-900/35 to-slate-900/75" />

        {/* Title — upper portion */}
        <div className="relative text-center px-4 pt-16 pb-10 md:pt-24 md:pb-14">
          <h1 className="text-[42px] md:text-5xl lg:text-7xl font-bold text-white mb-3 drop-shadow-lg leading-tight">
            Fly Further.<br className="hidden sm:block" /> Spend Smarter.
          </h1>
          <p className="text-white/90 text-base md:text-lg font-medium tracking-wide mb-5 drop-shadow-md">
            Real-time fares from 500+ airlines — book your perfect journey in seconds
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-white text-sm font-medium drop-shadow-md">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 opacity-90" />
              <span>500+ Airlines</span>
            </div>
            <div className="w-px h-4 bg-white/30 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 opacity-90" />
              <span>190+ Countries</span>
            </div>
            <div className="w-px h-4 bg-white/30 hidden sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 opacity-90" />
              <span>Best Price Guarantee</span>
            </div>
          </div>
        </div>

        {/* Search card — lower portion, inside the hero */}
        <div className="relative z-10 px-4 pb-10 md:pb-14">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden">
            <TravelModeTabs active="flights" variant="card" className="px-4 sm:px-6" />
            <div className="p-4 sm:p-6">
            <div className="flex items-center gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
              {(["oneway", "roundtrip", "multicity"] as TripType[]).map(t => (
                <button key={t} type="button" onClick={() => setTripType(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tripType === t ? "bg-white dark:bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-trip-${t}`}
                >
                  <span className="flex items-center gap-1.5">
                    {t === "oneway" && <><ArrowRight className="w-3.5 h-3.5" />One way</>}
                    {t === "roundtrip" && <><RefreshCw className="w-3.5 h-3.5" />Round trip</>}
                    {t === "multicity" && <><LayoutList className="w-3.5 h-3.5" />Multi-city</>}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch}>
              {tripType === "multicity" ? (
                <>
                  <div className="space-y-3 mb-4">
                    {multiLegs.map((leg, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="hidden sm:flex items-center justify-center w-7 h-10 shrink-0 text-xs font-bold text-muted-foreground rounded-lg bg-muted">{i + 1}</div>
                        <AirportInput value={leg.origin}
                          onChange={v => setMultiLegs(ls => ls.map((l, j) => j === i ? { ...l, origin: v } : l))}
                          placeholder="JFK" label="From" testId={`input-mc-origin-${i}`} />
                        <AirportInput value={leg.destination}
                          onChange={v => {
                            const next = multiLegs.map((l, j) => j === i ? { ...l, destination: v } : l);
                            if (i + 1 < next.length && !next[i + 1].origin) next[i + 1] = { ...next[i + 1], origin: v };
                            setMultiLegs(next);
                          }}
                          placeholder="CDG" label="To" testId={`input-mc-dest-${i}`} />
                        <div className="shrink-0 w-full sm:w-44">
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</label>
                          <input type="date" value={leg.date}
                            min={i > 0 ? multiLegs[i - 1].date : format(today, "yyyy-MM-dd")}
                            onChange={e => setMultiLegs(ls => ls.map((l, j) => j === i ? { ...l, date: e.target.value } : l))}
                            className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            data-testid={`input-mc-date-${i}`} />
                        </div>
                        {multiLegs.length > 2 ? (
                          <button type="button" onClick={() => setMultiLegs(ls => ls.filter((_, j) => j !== i))}
                            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-destructive/40 hover:text-destructive transition-all shrink-0 mb-0.5"
                            data-testid={`button-remove-leg-${i}`}>
                            <X className="w-4 h-4" />
                          </button>
                        ) : <div className="w-10 shrink-0 hidden sm:block" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start">
                    {multiLegs.length < 5 && (
                      <button type="button"
                        onClick={() => setMultiLegs(ls => [...ls, { origin: ls[ls.length - 1].destination || "", destination: "", date: ls[ls.length - 1].date || defaultDepart }])}
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
                    <div ref={cabinRef} className="relative w-full sm:w-48">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cabin</label>
                      <button type="button" onClick={() => setCabinOpen(o => !o)}
                        className="w-full flex items-center gap-2 px-3 py-3 border border-border rounded-xl bg-background hover:border-primary/50 transition-all text-left"
                        data-testid="button-cabin-class">
                        <span className="text-sm font-medium text-foreground flex-1 truncate">{CABIN_LABELS[cabinClass]}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                      <AnimatePresence>
                        {cabinOpen && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                            {(Object.keys(CABIN_LABELS) as CabinClass[]).map(c => (
                              <button key={c} type="button" onClick={() => { setCabinClass(c); setCabinOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${cabinClass === c ? "text-primary font-semibold" : "text-foreground"}`}
                                data-testid={`cabin-option-${c}`}>{CABIN_LABELS[c]}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* FROM / swap / TO — unified card matching homepage style */}
                  <div className="relative border border-border rounded-2xl bg-background mb-4">
                    <AirportCardField
                      iata={origin} display={originDisplay} airportName={originAirportName}
                      onSelect={(i, d, n) => { setOrigin(i); setOriginDisplay(d); setOriginAirportName(n); }}
                      placeholder="City or airport" label="From" testId="input-origin" />
                    <div className="relative h-0 border-t border-border">
                      <button type="button" onClick={swapAirports}
                        className="absolute right-4 top-0 -translate-y-1/2 w-7 h-7 rounded-full border border-border bg-white dark:bg-card flex items-center justify-center hover:bg-muted transition-colors shadow-sm z-10"
                        data-testid="button-swap-airports">
                        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <AirportCardField
                      iata={destination} display={destDisplay} airportName={destAirportName}
                      onSelect={(i, d, n) => { setDestination(i); setDestDisplay(d); setDestAirportName(n); }}
                      placeholder="City or airport" label="To" testId="input-destination" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className={tripType === "roundtrip" ? "col-span-1" : "col-span-2 sm:col-span-1"}>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Depart</label>
                      <input type="date" value={departDate} min={format(today, "yyyy-MM-dd")}
                        onChange={e => setDepartDate(e.target.value)}
                        className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        data-testid="input-depart-date" required />
                    </div>
                    {tripType === "roundtrip" && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Return</label>
                        <input type="date" value={returnDate} min={departDate}
                          onChange={e => setReturnDate(e.target.value)}
                          className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          data-testid="input-return-date" />
                      </div>
                    )}
                    <PassengerSelector adults={adults} children={children} infants={infants}
                      onChange={(a, c, i) => { setAdults(a); setChildren(c); setInfants(i); }} />
                    <div ref={cabinRef} className="relative">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cabin</label>
                      <button type="button" onClick={() => setCabinOpen(o => !o)}
                        className="w-full flex items-center gap-2 px-3 py-3 border border-border rounded-xl bg-background hover:border-primary/50 transition-all text-left"
                        data-testid="button-cabin-class">
                        <span className="text-sm font-medium text-foreground flex-1 truncate">{CABIN_LABELS[cabinClass]}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                      <AnimatePresence>
                        {cabinOpen && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                            {(Object.keys(CABIN_LABELS) as CabinClass[]).map(c => (
                              <button key={c} type="button" onClick={() => { setCabinClass(c); setCabinOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${cabinClass === c ? "text-primary font-semibold" : "text-foreground"}`}
                                data-testid={`cabin-option-${c}`}>{CABIN_LABELS[c]}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={mutation.isPending || (tripType === "multicity" ? multiLegs.filter(l => l.origin && l.destination).length < 2 : (!origin || !destination))}
                className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                data-testid="button-search-flights"
              >
                {mutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching flights…</> : <><Search className="w-5 h-5" /> Search Flights</>}
              </Button>
            </form>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Trust bar ── */}
      <div className="bg-muted/40 border-b border-border">
        <div className="container mx-auto max-w-5xl px-4 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Compare 500+ airlines</p>
                <p className="text-xs text-muted-foreground mt-0.5">More deals, more sites — one search</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">12,000,000+ journeys booked</p>
                <p className="text-xs text-muted-foreground mt-0.5">Trusted by travellers worldwide</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <span className="text-amber-500 text-sm font-bold">★</span>
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">4.9 / 5 traveller rating</p>
                <p className="text-xs text-muted-foreground mt-0.5">1M+ reviews on the app</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        {mutation.isPending && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <Plane className="w-12 h-12 text-primary animate-bounce" />
            </div>
            <p className="text-muted-foreground font-medium">Searching across multiple airlines…</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds</p>
          </div>
        )}

        {mutation.isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="font-semibold text-foreground">Search failed</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {mutation.error instanceof Error ? mutation.error.message : "Could not reach the flights service. Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => mutation.reset()} className="mt-2 gap-2">
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          </div>
        )}

        {results && !mutation.isPending && (
          <>
            {results.error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <p className="font-semibold text-foreground">No flights available</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {results.error.description || results.error.message || "No results found for your search. Try different dates or airports."}
                </p>
                {results.error.message?.toLowerCase().includes("key") || results.error.message?.toLowerCase().includes("auth") ? (
                  <p className="text-xs text-muted-foreground bg-muted rounded-lg px-4 py-2 mt-2 max-w-md text-center">
                    The LiteAPI Flights sandbox key is not yet configured. Add your <code className="font-mono text-xs">LITEAPI_KEY</code> with flights access to see live results.
                  </p>
                ) : null}
              </div>
            ) : allJourneys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Plane className="w-10 h-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No flights found</p>
                <p className="text-sm text-muted-foreground">Try different dates or airports.</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                <aside className="hidden lg:block lg:w-64 shrink-0">
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-5">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stops</div>
                      {[{ label: "Any", value: -1 }, { label: "Nonstop only", value: 0 }, { label: "1 stop or fewer", value: 1 }, { label: "2 stops or fewer", value: 2 }].map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                          <div
                            onClick={() => setFilterMaxStops(opt.value)}
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${filterMaxStops === opt.value ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"}`}
                          >
                            {filterMaxStops === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm text-foreground">{opt.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Price (max)</div>
                      <Slider
                        min={0} max={Math.max(maxResultPrice, 2000)} step={50}
                        value={[filterMaxPrice]}
                        onValueChange={([v]) => setFilterMaxPrice(v)}
                        className="w-full"
                        data-testid="slider-max-price"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>$0</span>
                        <span className="font-medium text-foreground">${filterMaxPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preferences</div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterRefundable} onChange={e => setFilterRefundable(e.target.checked)}
                          className="rounded" data-testid="check-refundable" />
                        <span className="text-sm text-foreground">Refundable only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterCheckedBag} onChange={e => setFilterCheckedBag(e.target.checked)}
                          className="rounded" data-testid="check-checked-bag" />
                        <span className="text-sm text-foreground">Checked bag included</span>
                      </label>
                    </div>

                    {uniqueAirlines.length > 1 && (
                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Airlines</div>
                        {uniqueAirlines.map(airline => {
                          const checked = filterAirlines.has(airline.iataCode);
                          return (
                            <label key={airline.iataCode} className="flex items-center gap-2 cursor-pointer group" data-testid={`check-airline-${airline.iataCode}`}>
                              <div
                                onClick={() => setFilterAirlines(prev => {
                                  const next = new Set(prev);
                                  if (next.has(airline.iataCode)) next.delete(airline.iataCode);
                                  else next.add(airline.iataCode);
                                  return next;
                                })}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${checked ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"}`}
                              >
                                {checked && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              {airline.logo && (
                                <img src={airline.logo} alt={airline.name} className="w-5 h-5 object-contain shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              )}
                              <span className="text-sm text-foreground truncate">{airline.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {(filterMaxStops !== -1 || filterRefundable || filterCheckedBag || filterAirlines.size > 0) && (
                      <button
                        type="button"
                        onClick={() => { setFilterMaxStops(-1); setFilterRefundable(false); setFilterCheckedBag(false); setFilterMaxPrice(10000); setFilterAirlines(new Set()); }}
                        className="w-full text-xs text-primary hover:underline text-left"
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </aside>

                <div className="flex-1 min-w-0">
                  {/* Sticky toolbar: sort pills + mobile filter button */}
                  <div className="sticky top-0 z-20 -mx-4 px-4 lg:mx-0 lg:px-0 lg:static bg-background/95 backdrop-blur-sm border-b border-border lg:border-0 py-2.5 lg:py-0 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
                        {SORT_TABS.map(tab => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setSortMode(tab.key)}
                            className={`flex-none px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${sortMode === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                            data-testid={`tab-sort-${tab.key}`}
                          >
                            {tab.label}
                            {tab.key === "price" && sortedMeta?.price?.price && (
                              <span className="ml-1 text-xs opacity-75">
                                {new Intl.NumberFormat("en-US", { style: "currency", currency: sortedMeta.price.currency || "USD", maximumFractionDigits: 0 }).format(sortedMeta.price.price)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFilters(true)}
                        className="lg:hidden shrink-0 relative flex items-center gap-1.5 text-sm font-medium text-foreground border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-all"
                        data-testid="button-toggle-filters"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {[filterMaxStops !== -1, filterRefundable, filterCheckedBag, filterAirlines.size > 0].filter(Boolean).length > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                            {[filterMaxStops !== -1, filterRefundable, filterCheckedBag, filterAirlines.size > 0].filter(Boolean).length}
                          </span>
                        )}
                      </button>
                      <span className="hidden lg:block text-sm text-muted-foreground shrink-0">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sorted.map(journey => (
                      <FlightCard key={journey.journeyKey} journey={journey} currency={currency || "USD"} adults={adults}
                        onSelect={() => { const offer = journey.offers[0]; if (offer) setSelectedFlight({ journey, offer }); }} />
                    ))}
                    {sorted.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground font-medium">No results match your filters</p>
                        <button
                          type="button"
                          onClick={() => { setFilterMaxStops(-1); setFilterRefundable(false); setFilterCheckedBag(false); setFilterMaxPrice(10000); }}
                          className="text-sm text-primary hover:underline"
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {selectedFlight && (
          <FlightCheckoutSheet
            journey={selectedFlight.journey}
            offer={selectedFlight.offer}
            adults={adults} children={children} infants={infants}
            currency={currency || "USD"}
            open={!!selectedFlight}
            onClose={() => setSelectedFlight(null)}
          />
        )}

        {/* ── Mobile filter bottom sheet ── */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="bottom" className="lg:hidden rounded-t-2xl max-h-[82vh] flex flex-col p-0">
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0 flex flex-row items-center justify-between">
              <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
              <SheetClose asChild>
                <button type="button" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors" data-testid="button-close-filters">
                  <X className="w-4 h-4" />
                </button>
              </SheetClose>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stops</div>
                {[{ label: "Any", value: -1 }, { label: "Nonstop only", value: 0 }, { label: "1 stop or fewer", value: 1 }, { label: "2 stops or fewer", value: 2 }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 py-2 cursor-pointer group">
                    <div
                      onClick={() => setFilterMaxStops(opt.value)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${filterMaxStops === opt.value ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"}`}
                    >
                      {filterMaxStops === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Price (max)</div>
                <Slider
                  min={0} max={Math.max(maxResultPrice, 2000)} step={50}
                  value={[filterMaxPrice]}
                  onValueChange={([v]) => setFilterMaxPrice(v)}
                  className="w-full"
                  data-testid="slider-max-price-mobile"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>$0</span>
                  <span className="font-medium text-foreground">${filterMaxPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preferences</div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={filterRefundable} onChange={e => setFilterRefundable(e.target.checked)}
                    className="rounded w-4 h-4" data-testid="check-refundable-mobile" />
                  <span className="text-sm text-foreground">Refundable only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={filterCheckedBag} onChange={e => setFilterCheckedBag(e.target.checked)}
                    className="rounded w-4 h-4" data-testid="check-checked-bag-mobile" />
                  <span className="text-sm text-foreground">Checked bag included</span>
                </label>
              </div>

              {uniqueAirlines.length > 1 && (
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Airlines</div>
                  {uniqueAirlines.map(airline => {
                    const checked = filterAirlines.has(airline.iataCode);
                    return (
                      <label key={airline.iataCode} className="flex items-center gap-3 cursor-pointer group py-1" data-testid={`check-airline-mobile-${airline.iataCode}`}>
                        <div
                          onClick={() => setFilterAirlines(prev => {
                            const next = new Set(prev);
                            if (next.has(airline.iataCode)) next.delete(airline.iataCode);
                            else next.add(airline.iataCode);
                            return next;
                          })}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${checked ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"}`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {airline.logo && (
                          <img src={airline.logo} alt={airline.name} className="w-5 h-5 object-contain shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="text-sm text-foreground">{airline.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border shrink-0 flex gap-3">
              {(filterMaxStops !== -1 || filterRefundable || filterCheckedBag || filterAirlines.size > 0) && (
                <button
                  type="button"
                  onClick={() => { setFilterMaxStops(-1); setFilterRefundable(false); setFilterCheckedBag(false); setFilterMaxPrice(10000); setFilterAirlines(new Set()); }}
                  className="flex-1 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-colors"
                  data-testid="button-clear-filters-mobile"
                >
                  Clear all
                </button>
              )}
              <Button onClick={() => setShowFilters(false)} className="flex-1 rounded-xl" data-testid="button-apply-filters">
                Show {sorted.length} result{sorted.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {!results && !mutation.isPending && !mutation.isError && (
          <div className="space-y-14">

            {/* ── Popular deals ── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Popular flight deals</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Hand-picked routes travellers love right now</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { from: "New York", fromCode: "JFK", to: "London", toCode: "LHR", price: "from $389", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80" },
                  { from: "Los Angeles", fromCode: "LAX", to: "Paris", toCode: "CDG", price: "from $512", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80" },
                  { from: "Miami", fromCode: "MIA", to: "Cancún", toCode: "CUN", price: "from $179", img: "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=600&q=80" },
                  { from: "New York", fromCode: "JFK", to: "Tokyo", toCode: "NRT", price: "from $698", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
                ].map(deal => (
                  <button
                    key={deal.toCode}
                    type="button"
                    onClick={() => { setOrigin(deal.fromCode); setDestination(deal.toCode); }}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] text-left hover:shadow-xl transition-all"
                  >
                    <img src={deal.img} alt={deal.to} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-bold text-base leading-tight">{deal.to}</p>
                      <p className="text-white/80 text-xs mt-0.5">{deal.from} → {deal.to}</p>
                      <p className="text-white font-semibold text-sm mt-1">{deal.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* ── Why book with Luxvibe ── */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <ShieldCheck className="w-6 h-6 text-green-600" />, bg: "bg-green-50 dark:bg-green-900/20", title: "Free cancellation options", desc: "Keep your plans flexible — many fares include free changes." },
                { icon: <CreditCard className="w-6 h-6 text-blue-600" />, bg: "bg-blue-50 dark:bg-blue-900/20", title: "No hidden fees", desc: "The price you see is the price you pay. Always." },
                { icon: <Clock className="w-6 h-6 text-purple-600" />, bg: "bg-purple-50 dark:bg-purple-900/20", title: "Book in minutes", desc: "Streamlined checkout — from search to confirmed in seconds." },
                { icon: <Luggage className="w-6 h-6 text-amber-600" />, bg: "bg-amber-50 dark:bg-amber-900/20", title: "Bags & extras included", desc: "See exactly what's included before you book — no surprises." },
              ].map(item => (
                <div key={item.title} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
                  <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center`}>{item.icon}</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* ── FAQ ── */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-5">Frequently asked questions</h2>
              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
                {[
                  { q: "How do I get the cheapest flights?", a: "Book early (6–8 weeks ahead for domestic, 3–6 months for international), be flexible on dates, and compare multiple airlines. Flying mid-week and avoiding peak seasons also helps significantly." },
                  { q: "What's the best day of the week to fly?", a: "Tuesday and Wednesday are typically the cheapest days to fly. Avoid Fridays and Sundays which tend to have the highest fares due to business traveller and leisure demand." },
                  { q: "How can I find cheap international flights?", a: "Use Luxvibe's flight search to compare across 500+ airlines at once. Setting flexible date ranges and considering nearby airports can unlock significantly lower fares." },
                  { q: "What does Economy, Premium Economy, Business, and First Class mean?", a: "Economy is the standard cabin. Premium Economy offers more legroom and recline. Business Class includes lie-flat seats on long-haul flights. First Class is the most premium experience with private suites on select airlines." },
                  { q: "Can I book a one-way flight?", a: "Absolutely. Toggle to 'One way' in the search form. One-way tickets are often cheaper for short trips or when you have flexible return plans." },
                  { q: "What happens if my flight is cancelled?", a: "If your flight is cancelled, the airline is required to rebook you on the next available flight or offer a refund. Refundable fares offer additional protection — look for the green 'Refundable' badge on results." },
                ].map((item, i) => (
                  <FaqItem key={i} question={item.q} answer={item.a} />
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import {
  Plane, ArrowLeftRight, ChevronDown, ChevronUp, Users, Search,
  Loader2, AlertCircle, Luggage, X, SlidersHorizontal, Clock,
  Check, RefreshCw, Wifi, Tv, Zap, Coffee, Armchair, Info,
} from "lucide-react";
import { usePreferences } from "@/context/preferences";

type TripType = "oneway" | "roundtrip";
type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortMode = "best" | "price" | "duration" | "stops";

interface AirportSuggestion {
  iataCode: string;
  name?: string;
  cityName?: string;
  countryCode?: string;
}

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

function AirportInput({
  value, onChange, placeholder, label, testId,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; label: string; testId: string;
}) {
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
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

  const handleChange = useCallback((raw: string) => {
    const v = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    onChange(v);
    if (debounce.current) clearTimeout(debounce.current);
    if (v.length >= 2) {
      setLoading(true);
      debounce.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/flights/airports?q=${v}`);
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
          setOpen(true);
        } catch { setSuggestions([]); }
        finally { setLoading(false); }
      }, 300);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [onChange]);

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
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 w-full min-w-[220px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => { onChange(s.iataCode); setOpen(false); setSuggestions([]); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
              >
                <span className="font-mono font-bold text-sm text-foreground w-8 shrink-0">{s.iataCode}</span>
                <span className="text-sm text-muted-foreground truncate">
                  {s.cityName || s.name || s.iataCode}
                  {s.countryCode ? `, ${s.countryCode}` : ""}
                </span>
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
        <button type="button" onClick={onDec} disabled={value <= min}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg leading-none">−</button>
        <span className="w-4 text-center font-semibold text-sm">{value}</span>
        <button type="button" onClick={onInc} disabled={total >= 9}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg leading-none">+</button>
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

function FlightCard({ journey, currency, adults }: { journey: FlightJourney; currency: string; adults: number; }) {
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
            <div className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</div>
            {adults > 1 && (
              <div className="text-xs text-muted-foreground">{formatPrice(pricePerAdult)}/person</div>
            )}
          </div>
          <Button
            size="sm"
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

export default function Flights() {
  const { currency } = usePreferences();
  const today = new Date();
  const defaultDepart = format(addDays(today, 30), "yyyy-MM-dd");
  const defaultReturn = format(addDays(today, 37), "yyyy-MM-dd");

  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState(defaultDepart);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>("ECONOMY");
  const [cabinOpen, setCabinOpen] = useState(false);
  const cabinRef = useRef<HTMLDivElement>(null);

  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [filterMaxStops, setFilterMaxStops] = useState<number>(-1);
  const [filterRefundable, setFilterRefundable] = useState(false);
  const [filterCheckedBag, setFilterCheckedBag] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(10000);
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<FlightSearchResponse | null>(null);

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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) return;
    const legs: any[] = [{ origin, destination, date: departDate, direction: "OUTBOUND" }];
    if (tripType === "roundtrip" && returnDate) {
      legs.push({ origin: destination, destination: origin, date: returnDate, direction: "INBOUND" });
    }
    mutation.mutate({
      legs,
      adults,
      children,
      infants,
      cabinClass,
      currency: currency || "USD",
      country: "US",
    });
    setResults(null);
  }

  function swapAirports() {
    setOrigin(destination);
    setDestination(origin);
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

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plane className="w-5 h-5 text-white/80" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Find Your Flight
              </h1>
            </div>
            <p className="text-slate-400 text-sm">Real-time prices from multiple airlines</p>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-4 sm:p-6">
            <div className="flex items-center gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
              {(["oneway", "roundtrip"] as TripType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTripType(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tripType === t ? "bg-white dark:bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-trip-${t}`}
                >
                  {t === "oneway" ? "One way" : "Round trip"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <AirportInput value={origin} onChange={setOrigin} placeholder="JFK" label="From" testId="input-origin" />

                <div className="flex items-end pb-1.5">
                  <button type="button" onClick={swapAirports}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 transition-all shrink-0"
                    data-testid="button-swap-airports">
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <AirportInput value={destination} onChange={setDestination} placeholder="CDG" label="To" testId="input-destination" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className={tripType === "roundtrip" ? "col-span-1" : "col-span-2 sm:col-span-1"}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Depart</label>
                  <input
                    type="date"
                    value={departDate}
                    min={format(today, "yyyy-MM-dd")}
                    onChange={e => setDepartDate(e.target.value)}
                    className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    data-testid="input-depart-date"
                    required
                  />
                </div>

                {tripType === "roundtrip" && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Return</label>
                    <input
                      type="date"
                      value={returnDate}
                      min={departDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      data-testid="input-return-date"
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
                    data-testid="button-cabin-class"
                  >
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{CABIN_LABELS[cabinClass]}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  <AnimatePresence>
                    {cabinOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
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

              <Button
                type="submit"
                disabled={mutation.isPending || !origin || !destination}
                className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                data-testid="button-search-flights"
              >
                {mutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching flights…</> : <><Search className="w-5 h-5" /> Search Flights</>}
              </Button>
            </form>
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
                <aside className="lg:w-64 shrink-0">
                  <div className="flex items-center justify-between mb-3 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setShowFilters(o => !o)}
                      className="flex items-center gap-2 text-sm font-medium text-foreground border border-border px-3 py-2 rounded-xl hover:bg-muted transition-all"
                      data-testid="button-toggle-filters"
                    >
                      <SlidersHorizontal className="w-4 h-4" /> Filters
                      {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <span className="text-sm text-muted-foreground">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div className={`${showFilters ? "block" : "hidden"} lg:block bg-card border border-border rounded-2xl p-4 space-y-5`}>
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

                    {(filterMaxStops !== -1 || filterRefundable || filterCheckedBag) && (
                      <button
                        type="button"
                        onClick={() => { setFilterMaxStops(-1); setFilterRefundable(false); setFilterCheckedBag(false); setFilterMaxPrice(10000); }}
                        className="w-full text-xs text-primary hover:underline text-left"
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </aside>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 flex-wrap">
                      {SORT_TABS.map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setSortMode(tab.key)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${sortMode === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
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
                    <span className="hidden lg:block text-sm text-muted-foreground">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div className="space-y-3">
                    {sorted.map(journey => (
                      <FlightCard key={journey.journeyKey} journey={journey} currency={currency || "USD"} adults={adults} />
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

        {!results && !mutation.isPending && !mutation.isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Plane className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg mb-1">Search for flights above</p>
              <p className="text-muted-foreground text-sm">Enter your airports and dates to see real-time prices from multiple airlines</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

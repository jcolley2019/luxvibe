import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Plane, CheckCircle2, XCircle, Loader2, Mail, Home, Users,
  ArrowRight, AlertCircle, Calendar, BedDouble,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";

function formatTime(iso: string) {
  try {
    const timePart = iso.split("T")[1];
    if (!timePart) return iso;
    const [h, m] = timePart.slice(0, 5).split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  } catch { return iso; }
}
function formatDateShort(iso: string) {
  try { return format(new Date(iso.split("T")[0]), "EEE, MMM d"); } catch { return iso; }
}

function SegmentRow({ segs, label }: { segs: any[]; label: string }) {
  if (!segs.length) return null;
  const first = segs[0];
  const last = segs[segs.length - 1];
  const carrier = first?.carrier;
  const stops = segs.length - 1;
  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3">
        {carrier?.marketingLogo && (
          <img src={carrier.marketingLogo} alt={carrier.marketingName}
            className="w-6 h-6 rounded object-contain bg-white border border-border p-0.5"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {stops > 0 && <span className="text-xs text-muted-foreground ml-auto">{stops} stop{stops > 1 ? "s" : ""}</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[56px]">
          <p className="text-xl font-bold font-mono text-foreground">{first.originCode}</p>
          <p className="text-sm text-muted-foreground">{formatTime(first.departureTime)}</p>
          <p className="text-xs text-muted-foreground">{formatDateShort(first.departureTime)}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full border-t border-dashed border-border relative">
            <Plane className="w-3.5 h-3.5 text-muted-foreground absolute -top-1.5 left-1/2 -translate-x-1/2 bg-card" />
          </div>
          <p className="text-xs text-muted-foreground">
            {carrier?.marketingName} · {segs.map(s => s.flight?.marketingNumber ? `${carrier?.marketingCode}${s.flight.marketingNumber}` : "").filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="text-center min-w-[56px]">
          <p className="text-xl font-bold font-mono text-foreground">{last.destinationCode}</p>
          <p className="text-sm text-muted-foreground">{formatTime(last.arrivalTime)}</p>
          <p className="text-xs text-muted-foreground">{formatDateShort(last.arrivalTime)}</p>
        </div>
      </div>
    </div>
  );
}

export default function FlightConfirmation() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const prebookId = params.get("prebookId");
  const transactionId = params.get("transactionId");

  const [ssPassengers, setSsPassengers] = useState<any[]>([]);
  const [ssContact, setSsContact] = useState<{ firstName: string; email: string }>({ firstName: "", email: "" });
  const [ssFlightData, setSsFlightData] = useState<any>(null);

  useEffect(() => {
    document.title = "Flight Confirmation — Luxvibe";
    try {
      const p = sessionStorage.getItem("flightPassengers");
      if (p) setSsPassengers(JSON.parse(p));
      const c = sessionStorage.getItem("flightContact");
      if (c) setSsContact(JSON.parse(c));
      const f = sessionStorage.getItem("flightData");
      if (f) setSsFlightData(JSON.parse(f));
    } catch { /* ignore */ }
  }, []);

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/flights/book", { prebookId, transactionId });
      return res.json();
    },
  });

  useEffect(() => {
    if (prebookId && transactionId && bookMutation.status === "idle") {
      bookMutation.mutate();
    }
  }, [prebookId, transactionId]);

  if (!prebookId || !transactionId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="font-semibold text-foreground">Invalid confirmation link</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/flights")}>Back to Flights</Button>
          </div>
        </div>
      </div>
    );
  }

  const bookingData = bookMutation.data?.booking;
  const isSuccess = bookMutation.isSuccess && !!bookingData?.bookingId;
  const errorMsg = bookMutation.data?.message || bookMutation.data?.error?.message || (bookMutation.error as Error)?.message;

  const segments: any[] = bookingData?.journey?.segments || [];
  const outSegs = segments.filter((s: any) => s.direction === "OUTBOUND" || segments.every((x: any) => !x.direction));
  const inSegs = segments.filter((s: any) => s.direction === "INBOUND");

  const price = bookingData?.journey?.price?.total ?? bookingData?.journey?.pricing?.display?.total ?? ssFlightData?.price;
  const currency = bookingData?.journey?.price?.currency ?? bookingData?.journey?.pricing?.display?.currency ?? ssFlightData?.currency ?? "USD";
  const displayPassengers: any[] = bookingData?.passengers?.length ? bookingData.passengers : ssPassengers;
  const displayContact = bookingData?.contact || ssContact;

  const airlineBookings: any[] = bookingData?.order?.reference?.airlineBookings || [];
  const bookingRef = bookingData?.bookingId || bookingData?.bookingRef || bookingData?.order?.reference?.orderId;
  const terms = bookingData?.journey?.terms;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto max-w-2xl px-4 py-12">
        {bookMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="font-semibold text-foreground text-lg">Confirming your booking…</p>
            <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
          </div>
        )}

        {(bookMutation.isError || (bookMutation.isSuccess && !isSuccess)) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Booking could not be completed</h1>
              <p className="text-muted-foreground max-w-md">{errorMsg || "An unexpected error occurred. Your payment may not have been captured."}</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/flights")}>
              <Plane className="w-4 h-4 mr-2" /> Search Again
            </Button>
            <div className="mt-2 p-4 bg-muted rounded-xl text-left max-w-md w-full">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prebook Reference</p>
              <p className="text-sm font-mono text-foreground break-all">{prebookId}</p>
              <p className="text-xs text-muted-foreground mt-1">Save this reference when contacting support.</p>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                You're all set!
              </h1>
              <p className="text-muted-foreground">Your flight has been booked successfully.</p>
              {displayContact.email && (
                <p className="text-sm text-muted-foreground mt-1">
                  Confirmation sent to <span className="font-medium text-foreground">{displayContact.email}</span>
                </p>
              )}
            </div>

            {/* Booking reference card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-muted/30 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Booking Reference</p>
                    <p className="font-mono font-bold text-xl text-foreground">{bookingRef}</p>
                    {airlineBookings.map((ab, i) => ab.airlinePnr || ab.pnr ? (
                      <p key={i} className="text-xs text-muted-foreground mt-0.5">
                        Airline PNR: <span className="font-mono font-semibold text-foreground">{ab.airlinePnr || ab.pnr}</span>
                        {(ab.airlineName || ab.airlineCode) && <span className="ml-1 opacity-70">· {ab.airlineName || ab.airlineCode}</span>}
                      </p>
                    ) : null)}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                      {bookingData?.status || "Confirmed"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itinerary from real booking data */}
              {segments.length > 0 ? (
                <div className="px-5 divide-y divide-border">
                  <SegmentRow segs={outSegs} label="Outbound" />
                  {inSegs.length > 0 && <SegmentRow segs={inSegs} label="Return" />}
                </div>
              ) : ssFlightData && (
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Flight</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold font-mono">{ssFlightData.origin}</p>
                      {ssFlightData.departTime && <p className="text-sm text-muted-foreground">{formatTime(ssFlightData.departTime)}</p>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-1" />
                    <div className="text-center">
                      <p className="text-xl font-bold font-mono">{ssFlightData.destination}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fare rules */}
              {terms?.summary?.length > 0 && (
                <div className="px-5 py-3 border-t border-border flex flex-wrap gap-2">
                  {terms.summary.map((t: any, i: number) => (
                    <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      t.level === "danger" ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" :
                      t.level === "warning" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" :
                      "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                    }`}>
                      <AlertCircle className="w-3 h-3" /> {t.message}
                    </span>
                  ))}
                </div>
              )}

              {/* Pricing */}
              {price != null && (
                <div className="px-5 py-3 border-t border-border flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total paid</span>
                  <span className="font-bold text-foreground">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price)}
                  </span>
                </div>
              )}

              {/* Passengers */}
              {displayPassengers.length > 0 && (
                <div className="px-5 py-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Passengers</span>
                  </div>
                  <div className="space-y-1.5">
                    {displayPassengers.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">{p.firstName} {p.lastName}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.type === "ADT" || p.type === "" ? "Adult" : p.type === "CHD" ? "Child" : p.type === "INF" ? "Infant" : p.type}
                          {p.documentNumber && <span className="ml-1 font-mono opacity-60">· {p.documentNumber}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              {displayContact.email && (
                <div className="px-5 py-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" /> {displayContact.email}
                  </div>
                </div>
              )}
            </div>

            {/* What happens next */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">What's next</p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                    Check your email for your e-ticket. Use your airline PNR to check in online 24–48 hours before departure. Carry a valid passport matching the name on your booking.
                  </p>
                </div>
              </div>
            </div>

            {ssFlightData && (() => {
              const dest = ssFlightData.destination;
              const checkIn = ssFlightData.departTime?.split("T")[0];
              const checkOut = ssFlightData.returnDate;
              const guestCount = ssFlightData.adults || 1;
              const alsoNeedHotel = ssFlightData.alsoNeedHotel;
              const hotelUrl = `/?destination=${dest || ""}&checkIn=${checkIn || ""}&checkOut=${checkOut || ""}&adults=${guestCount}`;
              return (
                <div className={`rounded-2xl border overflow-hidden ${alsoNeedHotel ? "border-primary shadow-md shadow-primary/10" : "border-border"}`}>
                  <div className={`px-5 py-4 border-b border-border flex items-center gap-2 ${alsoNeedHotel ? "bg-primary/5" : "bg-muted/30"}`}>
                    <BedDouble className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-semibold text-foreground flex-1">Complete your trip — find a hotel</p>
                    {alsoNeedHotel && <span className="text-xs text-primary font-semibold">You requested this</span>}
                  </div>
                  <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Find a hotel in <span className="font-medium text-foreground">{dest}</span> to match your flight dates
                      </p>
                      {checkIn && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Check-in {format(new Date(checkIn), "MMM d")}{checkOut ? ` · Check-out ${format(new Date(checkOut), "MMM d")}` : ""} · {guestCount} guest{guestCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <Link href={hotelUrl}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${alsoNeedHotel ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"}`}
                      data-testid="link-find-hotels"
                    >
                      Search Hotels <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-3">
              <Button className="flex-1 rounded-xl gap-2" onClick={() => navigate("/")}>
                <Home className="w-4 h-4" /> Back to Hotels
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={() => navigate("/flights")}>
                <Plane className="w-4 h-4" /> Search More Flights
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

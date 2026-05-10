import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookings } from "@/hooks/use-bookings";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Search,
  ArrowUpDown,
  ExternalLink,
  XCircle,
  RefreshCw,
  Plane,
  Hotel,
  ArrowRight,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { addDays, differenceInDays, format, parseISO, isPast } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SortKey = "hotelName" | "id" | "checkIn" | "totalPrice" | "status" | "createdAt";
type SortDir = "asc" | "desc";
type Tab = "hotels" | "flights";

function statusClass(status: string) {
  if (status === "confirmed" || status === "CONFIRMED")
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (status === "cancelled" || status === "CANCELLED")
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
}

function statusBorderClass(status: string) {
  if (status === "confirmed" || status === "CONFIRMED") return "border-l-4 border-l-green-500";
  if (status === "cancelled" || status === "CANCELLED") return "border-l-4 border-l-red-500";
  return "border-l-4 border-l-yellow-400";
}

function fmtDate(val: string | null | undefined) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
  } catch {
    return val;
  }
}

function formatDateShort(iso: string) {
  try { return format(new Date(iso.split("T")[0]), "EEE, MMM d, yyyy"); } catch { return iso; }
}
function formatTime(iso: string) {
  try { return iso.split("T")[1]?.slice(0, 5) || iso; } catch { return iso; }
}

function FlightBookingCard({ b }: { b: any }) {
  const segments: any[] = b.journey?.segments || [];
  const outSegs = segments.filter((s: any) => s.direction === "OUTBOUND" || segments.every((x: any) => !x.direction));
  const inSegs = segments.filter((s: any) => s.direction === "INBOUND");

  const firstOut = outSegs[0];
  const lastOut = outSegs[outSegs.length - 1];
  const firstIn = inSegs[0];
  const lastIn = inSegs[inSegs.length - 1];

  const carrier = firstOut?.carrier;
  const origin = firstOut?.originCode || "—";
  const destination = lastOut?.destinationCode || (firstIn?.originCode ?? "—");
  const depTime = firstOut?.departureTime;
  const retDepTime = firstIn?.departureTime;

  const price = b.journey?.price?.total;
  const currency = b.journey?.price?.currency || "USD";
  const pnrList: any[] = b.order?.reference?.airlineBookings || [];
  const pnr = pnrList.find((a: any) => a.pnr || a.airlinePnr);

  const passengerNames = (b.passengers || [])
    .map((p: any) => `${p.firstName} ${p.lastName}`.trim())
    .filter(Boolean);

  return (
    <div
      className={`bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow ${statusBorderClass(b.status)}`}
      data-testid={`card-flight-booking-${b.bookingId}`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Route */}
          <div className="flex items-center gap-2 mb-1">
            {carrier?.marketingLogo && (
              <img
                src={carrier.marketingLogo}
                alt={carrier.marketingName}
                className="w-5 h-5 rounded object-contain bg-white border border-border p-0.5 shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className="text-sm font-medium text-muted-foreground truncate">
              {carrier?.marketingName || "Flight"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{origin}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-2xl font-bold font-mono text-foreground">{destination}</span>
            {inSegs.length > 0 && (
              <>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-2xl font-bold font-mono text-foreground">{origin}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass(b.status)}`}>
            {(b.status === "CONFIRMED" || b.status === "confirmed") && <CheckCircle2 className="w-3 h-3" />}
            {b.status}
          </span>
          {price != null && (
            <span className="text-base font-bold text-foreground">
              {new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price)}
            </span>
          )}
        </div>
      </div>

      {/* Flight legs */}
      <div className="px-5 py-3 divide-y divide-border/60">
        {/* Outbound */}
        {firstOut && (
          <div className="py-2.5 flex items-center gap-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 shrink-0">
              {inSegs.length > 0 ? "Outbound" : "Flight"}
            </div>
            <div className="flex items-center gap-3 flex-1">
              <div className="text-center">
                <p className="font-mono font-semibold text-foreground">{origin}</p>
                {depTime && <p className="text-xs text-muted-foreground">{formatTime(depTime)}</p>}
              </div>
              <div className="flex-1 border-t border-dashed border-border" />
              <div className="text-center">
                <p className="font-mono font-semibold text-foreground">{destination}</p>
                {lastOut?.arrivalTime && <p className="text-xs text-muted-foreground">{formatTime(lastOut.arrivalTime)}</p>}
              </div>
            </div>
            {depTime && (
              <span className="text-xs text-muted-foreground shrink-0">{formatDateShort(depTime)}</span>
            )}
          </div>
        )}

        {/* Return */}
        {firstIn && (
          <div className="py-2.5 flex items-center gap-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 shrink-0">Return</div>
            <div className="flex items-center gap-3 flex-1">
              <div className="text-center">
                <p className="font-mono font-semibold text-foreground">{firstIn.originCode}</p>
                {retDepTime && <p className="text-xs text-muted-foreground">{formatTime(retDepTime)}</p>}
              </div>
              <div className="flex-1 border-t border-dashed border-border" />
              <div className="text-center">
                <p className="font-mono font-semibold text-foreground">{lastIn?.destinationCode || origin}</p>
                {lastIn?.arrivalTime && <p className="text-xs text-muted-foreground">{formatTime(lastIn.arrivalTime)}</p>}
              </div>
            </div>
            {retDepTime && (
              <span className="text-xs text-muted-foreground shrink-0">{formatDateShort(retDepTime)}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-medium text-foreground/70">Booking ID: </span>
            <span className="font-mono">{b.bookingId?.slice(0, 8)}…</span>
          </div>
          {pnr && (
            <div>
              <span className="font-medium text-foreground/70">PNR: </span>
              <span className="font-mono font-semibold text-foreground">{pnr.pnr || pnr.airlinePnr}</span>
            </div>
          )}
          {passengerNames.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{passengerNames.join(", ")}</span>
            </div>
          )}
        </div>
        {b.timestamp && (
          <span className="text-xs text-muted-foreground">Booked {formatDateShort(b.timestamp)}</span>
        )}
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: bookings, isLoading: isBookingsLoading } = useBookings();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("hotels");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pendingCancel, setPendingCancel] = useState<{ id: string; hotelName: string } | null>(null);

  const { data: flightBookingsData, isLoading: isFlightBookingsLoading } = useQuery({
    queryKey: ["/api/flights/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/flights/bookings");
      return res.json() as Promise<{ bookings: any[] }>;
    },
    enabled: isAuthenticated,
  });
  const flightBookings: any[] = flightBookingsData?.bookings || [];

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) =>
      apiRequest("POST", `/api/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      toast({ title: "Your booking has been cancelled." });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setPendingCancel(null);
    },
    onError: (err: any) => {
      toast({
        title: "Cancellation failed",
        description: err?.message || "Please try again or contact support.",
        variant: "destructive",
      });
      setPendingCancel(null);
    },
  });

  if (isAuthLoading || isBookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = (bookings ?? []).filter((b) => {
    const q = search.toLowerCase();
    return !q || b.hotelName?.toLowerCase().includes(q) || String(b.id).toLowerCase().includes(q) || b.status?.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: any = a[sortKey as keyof typeof a] ?? "";
    let bv: any = b[sortKey as keyof typeof b] ?? "";
    if (sortKey === "totalPrice") { av = Number(av); bv = Number(bv); }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function SortBtn({ col }: { col: SortKey }) {
    return (
      <button onClick={() => handleSort(col)} className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowUpDown className="w-3 h-3" />
      </button>
    );
  }

  const isCancelled = (status: string) => status === "cancelled" || status === "CANCELLED";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <AlertDialog open={!!pendingCancel} onOpenChange={(open) => { if (!open) setPendingCancel(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your stay at <strong>{pendingCancel?.hotelName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-keep">Keep booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingCancel && cancelMutation.mutate(pendingCancel.id)}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-dialog-confirm"
            >
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Yes, cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 container mx-auto px-4 py-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">My bookings</h1>
          {activeTab === "hotels" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for a booking"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
                data-testid="input-bookings-search"
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab("hotels")}
            data-testid="tab-hotels"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "hotels"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hotel className="w-4 h-4" />
            Hotels
            {bookings && bookings.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                {bookings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("flights")}
            data-testid="tab-flights"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "flights"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plane className="w-4 h-4" />
            Flights
            {flightBookings.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                {flightBookings.length}
              </span>
            )}
          </button>
        </div>

        {/* Hotels tab */}
        {activeTab === "hotels" && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap w-[200px]">
                      Hotel <SortBtn col="hotelName" />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap min-w-[100px]">
                      Booking ID <SortBtn col="id" />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap hidden md:table-cell w-[90px]">
                      Room Type
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-foreground whitespace-nowrap hidden lg:table-cell w-[50px]">
                      Guests
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap w-[150px]">
                      Dates <SortBtn col="checkIn" />
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-foreground whitespace-nowrap w-[80px]">
                      Amount <SortBtn col="totalPrice" />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap w-[100px]">
                      Status <SortBtn col="status" />
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-foreground whitespace-nowrap hidden lg:table-cell w-[90px]">
                      Booking Date <SortBtn col="createdAt" />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap min-w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="text-center py-12">
                          <Hotel className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-muted-foreground mb-2">No hotel bookings found.</p>
                          <p className="text-sm text-muted-foreground">
                            Have a booking ID? Use{" "}
                            <a href="/manage-booking" className="text-primary underline">Manage My Booking</a>
                            {" "}to look it up directly.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sorted.map((booking) => (
                      <tr
                        key={booking.id}
                        className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors odd:bg-background even:bg-muted/20 ${statusBorderClass(booking.status)}`}
                        data-testid={`row-booking-${booking.id}`}
                      >
                        <td className="px-4 py-4 font-medium text-foreground w-[200px] leading-snug">{booking.hotelName}</td>
                        <td title={booking.id} className="px-4 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap min-w-[100px] cursor-help">
                          {booking.id.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-4 text-muted-foreground hidden md:table-cell whitespace-nowrap w-[90px]">{booking.roomType}</td>
                        <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell whitespace-nowrap w-[50px] text-center">{booking.guests}</td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap w-[150px]">
                          {fmtDate(booking.checkIn as string)} – {fmtDate(booking.checkOut as string)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-foreground whitespace-nowrap w-[80px] text-center">
                          {booking.totalPrice != null ? `$${Number(booking.totalPrice).toFixed(2)}` : <span className="text-muted-foreground font-normal">—</span>}
                        </td>
                        <td className="px-4 py-4 w-[100px]">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(booking.status)}`} data-testid={`status-booking-${booking.id}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell whitespace-nowrap w-[90px] text-center">
                          {fmtDate((booking as any).createdAt)}
                        </td>
                        <td className="px-4 py-4 min-w-[80px] whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/hotel/${booking.hotelId}?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&guests=${booking.guests}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" data-testid={`button-view-hotel-${booking.id}`}>
                                <ExternalLink className="w-3 h-3" /> View
                              </Button>
                            </Link>
                            {(() => {
                              if (!booking.checkOut || !booking.hotelId) return null;
                              const outDate = parseISO(booking.checkOut as string);
                              if (!isPast(outDate)) return null;
                              const nights = differenceInDays(outDate, parseISO(booking.checkIn as string)) || 1;
                              const newCheckIn = format(addDays(new Date(), 30), "yyyy-MM-dd");
                              const newCheckOut = format(addDays(new Date(), 30 + nights), "yyyy-MM-dd");
                              return (
                                <Link href={`/hotel/${booking.hotelId}?checkIn=${newCheckIn}&checkOut=${newCheckOut}&guests=${booking.guests || 2}`}>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/5" data-testid={`button-book-again-${booking.id}`}>
                                    <RefreshCw className="w-3 h-3" /> Book again
                                  </Button>
                                </Link>
                              );
                            })()}
                            {!isCancelled(booking.status) && (booking as any).cancellable === true && (
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setPendingCancel({ id: booking.id, hotelName: booking.hotelName })}
                                data-testid={`button-cancel-booking-${booking.id}`}>
                                <XCircle className="w-3 h-3" /> Cancel
                              </Button>
                            )}
                            {!isCancelled(booking.status) && (booking as any).cancellable === false && (
                              <Badge variant="secondary" className="text-[10px] text-muted-foreground bg-muted border border-border cursor-default" data-testid={`badge-nonrefundable-${booking.id}`}>
                                Non-refundable
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Flights tab */}
        {activeTab === "flights" && (
          <div>
            {isFlightBookingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : flightBookings.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-xl">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground mb-1">No flight bookings yet</p>
                <p className="text-sm text-muted-foreground mb-4">Your confirmed flight reservations will appear here.</p>
                <Link href="/flights">
                  <Button variant="outline" className="gap-2" data-testid="button-search-flights-empty">
                    <Plane className="w-4 h-4" /> Search flights
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {flightBookings.map((b: any) => (
                  <FlightBookingCard key={b.bookingId} b={b} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookings } from "@/hooks/use-bookings";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";

type SortKey = "hotelName" | "id" | "checkIn" | "totalPrice" | "status" | "createdAt";
type SortDir = "asc" | "desc";

function statusVariant(status: string) {
  if (status === "confirmed" || status === "CONFIRMED") return "default";
  if (status === "cancelled" || status === "CANCELLED") return "destructive";
  return "secondary";
}

function fmtDate(val: string | null | undefined) {
  if (!val) return "—";
  try { return format(parseISO(val), "dd MMM yyyy"); } catch { return val; }
}

export default function MyBookings() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: bookings, isLoading: isBookingsLoading } = useBookings();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
    return (
      !q ||
      b.hotelName?.toLowerCase().includes(q) ||
      String(b.id).toLowerCase().includes(q) ||
      b.status?.toLowerCase().includes(q)
    );
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
      <button
        onClick={() => handleSort(col)}
        className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowUpDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">My bookings</h1>
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
        </div>

        {/* Table */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    Hotel <SortBtn col="hotelName" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    Booking ID <SortBtn col="id" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap hidden md:table-cell">
                    Room Type
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap hidden lg:table-cell">
                    Guests
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    Dates <SortBtn col="checkIn" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    Amount <SortBtn col="totalPrice" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    Status <SortBtn col="status" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap hidden lg:table-cell">
                    Booking Date <SortBtn col="createdAt" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="text-center py-12">
                        <p className="text-muted-foreground mb-2">No bookings found for your account.</p>
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
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      data-testid={`row-booking-${booking.id}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">
                        {booking.hotelName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        #{booking.id}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap max-w-[140px] truncate">
                        {booking.roomType}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {booking.guests}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmtDate(booking.checkIn as string)} – {fmtDate(booking.checkOut as string)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        ${Number(booking.totalPrice ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={statusVariant(booking.status)}
                          className="capitalize text-xs"
                          data-testid={`status-booking-${booking.id}`}
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {fmtDate((booking as any).createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/hotel/${booking.hotelId}?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&guests=${booking.guests}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              data-testid={`button-view-hotel-${booking.id}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/manage-booking?bookingId=${booking.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground"
                              data-testid={`button-manage-booking-${booking.id}`}
                            >
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

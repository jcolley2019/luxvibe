import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookings } from "@/hooks/use-bookings";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Link } from "wouter";

type SortKey =
  | "hotelName"
  | "id"
  | "checkIn"
  | "totalPrice"
  | "status"
  | "createdAt";
type SortDir = "asc" | "desc";

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
    return new Date(val).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  } catch {
    return val;
  }
}

export default function MyBookings() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: bookings, isLoading: isBookingsLoading } = useBookings();
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
    if (sortKey === "totalPrice") {
      av = Number(av);
      bv = Number(bv);
    }
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

      <main className="flex-1 container mx-auto px-4 py-10 max-w-7xl">
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
                        <p className="text-muted-foreground mb-2">
                          No bookings found for your account.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Have a booking ID? Use{" "}
                          <a
                            href="/manage-booking"
                            className="text-primary underline"
                          >
                            Manage My Booking
                          </a>{" "}
                          to look it up directly.
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
                      <td className="px-4 py-4 font-medium text-foreground w-[200px] leading-snug">
                        {booking.hotelName}
                      </td>
                    <td title={booking.id} className="px-4 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap min-w-[100px] cursor-help">
                      {booking.id.slice(0, 8)}…
                    </td>
                      <td className="px-4 py-4 text-muted-foreground hidden md:table-cell whitespace-nowrap w-[90px]">
                        {booking.roomType}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell whitespace-nowrap w-[50px] text-center">
                        {booking.guests}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap w-[150px]">
                        {fmtDate(booking.checkIn as string)} –{" "}
                        {fmtDate(booking.checkOut as string)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground whitespace-nowrap w-[80px] text-center">
                        {booking.totalPrice != null ? (
                          `$${Number(booking.totalPrice).toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 w-[100px]">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(booking.status)}`}
                          data-testid={`status-booking-${booking.id}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell whitespace-nowrap w-[90px] text-center">
                        {fmtDate((booking as any).createdAt)}
                      </td>
                      <td className="px-4 py-4 min-w-[80px] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/hotel/${booking.hotelId}?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&guests=${booking.guests}`}
                          >
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
                          <Link
                            href={`/manage-booking?bookingId=${booking.id}`}
                          >
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

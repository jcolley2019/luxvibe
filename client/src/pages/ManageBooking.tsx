import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import {
  ChevronLeft,
  KeyRound,
  CheckCircle2,
  Calendar,
  MapPin,
  BedDouble,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";

export default function ManageBooking() {
  const [, navigate] = useLocation();
  const [lastName, setLastName] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !bookingRef.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiRequest(
        "GET",
        `/api/bookings/lookup?id=${encodeURIComponent(bookingRef.trim())}&lastName=${encodeURIComponent(lastName.trim())}`,
      );
      const data = await res.json();
      if (data && data.id) {
        setResult(data);
      } else {
        setError(
          "No booking found. Please check your Booking ID and last name.",
        );
      }
    } catch {
      setError("No booking found. Please check your Booking ID and last name.");
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return format(parseISO(d), "MMM d, yyyy");
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left panel */}
        <div className="flex-1 flex flex-col px-4 sm:px-8 md:px-16 lg:px-24 py-8 sm:py-10 max-w-2xl w-full mx-auto">
          <Link href="/my-bookings">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 sm:mb-10"
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </Link>

          {result ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    Booking Found
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Here are your reservation details.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                    Hotel
                  </p>
                  <p className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 leading-tight">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    {result.hotelName}
                  </p>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                      Check-in
                    </p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      {fmtDate(result.checkIn)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                      Check-out
                    </p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      {fmtDate(result.checkOut)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                    Room
                  </p>
                  <p className="text-sm font-medium flex items-center gap-2 leading-tight">
                    <BedDouble className="w-4 h-4 text-primary shrink-0" />
                    {result.roomType ||
                      result.roomName ||
                      "See confirmation email"}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${result.status === "confirmed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                      Total
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {result.totalPrice
                        ? `$${parseFloat(result.totalPrice).toFixed(2)}`
                        : result.amount
                          ? `$${parseFloat(result.amount).toFixed(2)}`
                          : "See confirmation email"}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-6 w-full h-11 rounded-full text-xs font-bold uppercase tracking-wider"
                onClick={() => {
                  setResult(null);
                  setLastName("");
                  setBookingRef("");
                }}
                data-testid="button-lookup-another"
              >
                Look up another booking
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="animate-in fade-in duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                <KeyRound className="w-6 h-6 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold">
                  Enter Booking Details
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
                Enter your details to access the booking. This information can
                be found in your confirmation email.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 pl-1">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all h-12"
                    data-testid="input-last-name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 pl-1">
                    Booking ID or Confirmation No{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your booking ID or confirmation number"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all h-12"
                    data-testid="input-booking-ref"
                  />
                </div>

                {error && (
                  <p
                    className="text-xs sm:text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl font-medium"
                    data-testid="text-lookup-error"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !lastName.trim() || !bookingRef.trim()}
                  className="w-full h-12 rounded-full text-sm font-bold shadow-lg shadow-primary/20 mt-2"
                  data-testid="button-continue"
                >
                  {loading ? "Looking up…" : "Continue"}
                </Button>
              </div>

              <p className="text-[11px] sm:text-xs text-muted-foreground mt-8 text-center uppercase tracking-widest font-medium">
                Have an account?{" "}
                <Link
                  href="/my-bookings"
                  className="text-primary hover:underline"
                >
                  View all your bookings
                </Link>
              </p>
            </form>
          )}
        </div>

        {/* Right panel — hotel photo */}
        <div className="hidden lg:block flex-1 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80"
            alt="Luxury hotel room"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/10" />
        </div>
      </div>
    </div>
  );
}

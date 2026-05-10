import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Plane, CheckCircle2, XCircle, Loader2, Calendar, Mail,
  ArrowRight, Download, Home, Users,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function formatTime(iso: string) {
  try { return iso.split("T")[1]?.slice(0, 5) || iso; } catch { return iso; }
}
function formatDateLong(iso: string) {
  try { return format(new Date(iso.split("T")[0]), "MMM d, yyyy"); } catch { return iso; }
}

export default function FlightConfirmation() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const prebookId = params.get("prebookId");
  const transactionId = params.get("transactionId");

  const [passengers, setPassengers] = useState<any[]>([]);
  const [contact, setContact] = useState<{ firstName: string; email: string }>({ firstName: "", email: "" });
  const [flightData, setFlightData] = useState<any>(null);

  useEffect(() => {
    document.title = "Flight Confirmation — Luxvibe";
    try {
      const p = sessionStorage.getItem("flightPassengers");
      if (p) setPassengers(JSON.parse(p));
      const c = sessionStorage.getItem("flightContact");
      if (c) setContact(JSON.parse(c));
      const f = sessionStorage.getItem("flightData");
      if (f) setFlightData(JSON.parse(f));
    } catch { /* ignore */ }
  }, []);

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/flights/book", {
        prebookId,
        transactionId,
      });
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

  const bookingData = bookMutation.data?.data || bookMutation.data;
  const isSuccess = bookMutation.isSuccess && !bookMutation.data?.error;
  const errorMsg = bookMutation.data?.error?.message || bookMutation.data?.message || (bookMutation.error as Error)?.message;

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

        {(bookMutation.isError || (bookMutation.isSuccess && bookMutation.data?.error)) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Booking could not be completed</h1>
              <p className="text-muted-foreground max-w-md">{errorMsg || "An unexpected error occurred. Your payment may not have been captured."}</p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => navigate("/flights")}>
                <Plane className="w-4 h-4 mr-2" /> Search Again
              </Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-xl text-left max-w-md w-full">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reference</p>
              <p className="text-sm font-mono text-foreground break-all">{prebookId}</p>
              <p className="text-xs text-muted-foreground mt-1">Save this reference when contacting support.</p>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                You're all set!
              </h1>
              <p className="text-muted-foreground">Your flight has been booked successfully.</p>
              {contact.email && (
                <p className="text-sm text-muted-foreground mt-1">
                  Confirmation sent to <span className="font-medium text-foreground">{contact.email}</span>
                </p>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Booking Reference</p>
                    <p className="font-mono font-bold text-lg text-foreground">
                      {bookingData?.bookingId || bookingData?.booking?.bookingId || prebookId?.slice(0, 12).toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">Confirmed</span>
                  </div>
                </div>
              </div>

              {flightData && (
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Plane className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Flight Details</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground font-mono">{flightData.origin}</div>
                      {flightData.departTime && (
                        <div className="text-sm text-muted-foreground">{formatTime(flightData.departTime)}</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      {flightData.departTime && (
                        <div className="text-xs text-muted-foreground">{formatDateLong(flightData.departTime)}</div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground font-mono">{flightData.destination}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground">Total paid</span>
                    <span className="font-bold text-foreground">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: flightData.currency || "USD", maximumFractionDigits: 0 }).format(flightData.price)}
                    </span>
                  </div>
                </div>
              )}

              {passengers.length > 0 && (
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Passengers</span>
                  </div>
                  <div className="space-y-1.5">
                    {passengers.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{p.firstName} {p.lastName}</span>
                        <span className="text-xs text-muted-foreground">{p.type === "ADT" ? "Adult" : p.type === "CHD" ? "Child" : "Infant"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contact.email && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" /> {contact.email}
                  </div>
                </div>
              )}
            </div>

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

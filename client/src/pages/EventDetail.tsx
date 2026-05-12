import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Ticket, ArrowLeft, ExternalLink, Plane,
  Hotel, Sparkles, ChevronDown, ChevronUp, Loader2, Clock,
  DollarSign, Share2, Heart,
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

type EventDetail = {
  id: string;
  name: string;
  url: string;
  images: string[];
  date: string | null;
  time: string | null;
  status: string;
  artist: string | null;
  artistImage: string | null;
  category: string;
  genre: string | null;
  description: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  ticketUrl: string;
};

function formatDate(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return "Date TBD";
  try {
    const d = new Date(`${dateStr}T${timeStr || "00:00:00"}`);
    return format(d, "EEEE, MMMM d, yyyy · h:mm a");
  } catch {
    return dateStr;
  }
}

function TripPlanner({ event }: { event: EventDetail }) {
  const [origin, setOrigin] = useState("");
  const [checkIn, setCheckIn] = useState(event.date || "");
  const [checkOut, setCheckOut] = useState(
    event.date ? format(addDays(parseISO(event.date), 1), "yyyy-MM-dd") : ""
  );
  const [, navigate] = useLocation();

  const searchHotels = () => {
    if (!event.city) return;
    const params = new URLSearchParams({
      destination: [event.venue, event.city, event.state].filter(Boolean).join(", "),
      checkIn,
      checkOut,
      adults: "2",
      children: "0",
    });
    navigate(`/?${params}`);
  };

  const searchFlights = () => {
    const params = new URLSearchParams({
      origin: origin || "",
      destination: event.city || "",
      departDate: checkIn,
      returnDate: checkOut,
      adults: "1",
    });
    navigate(`/flights?${params}`);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Flying from
          </label>
          <div className="relative">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Your city or airport"
              className="pl-9"
              data-testid="input-planner-origin"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Flying to
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={[event.city, event.state].filter(Boolean).join(", ")}
              readOnly
              className="pl-9 bg-muted/50 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Check-in
          </label>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            data-testid="input-planner-checkin"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Check-out
          </label>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            data-testid="input-planner-checkout"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          onClick={searchFlights}
          variant="outline"
          className="flex items-center gap-2 h-11"
          data-testid="button-search-flights"
        >
          <Plane className="w-4 h-4" />
          Search Flights
        </Button>
        <Button
          onClick={searchHotels}
          className="flex items-center gap-2 h-11 sm:col-span-2"
          data-testid="button-search-hotels"
        >
          <Hotel className="w-4 h-4" />
          Find Hotels Near {event.venue || event.city || "Venue"}
        </Button>
      </div>

      {event.ticketUrl && (
        <div className="pt-1 space-y-2">
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-semibold text-sm hover:bg-primary/10 hover:border-primary/50 transition-all"
            data-testid="link-buy-tickets"
          >
            <Ticket className="w-4 h-4" />
            Buy Official Tickets on Ticketmaster
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
            Tickets sold and fulfilled by Ticketmaster. LuxVibe does not sell or guarantee tickets. LuxVibe may earn a commission on eligible purchases.
          </p>
        </div>
      )}
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [savedToHeart, setSavedToHeart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: event, isLoading, isError } = useQuery<EventDetail>({
    queryKey: ["/api/events", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Event not found");
      }
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold mb-2">Event not found</p>
            <Button variant="outline" onClick={() => navigate("/events")}>
              Browse Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const heroImage = event.images?.[activeImage] || event.images?.[0];
  const priceLabel = event.priceMin
    ? event.priceMax && event.priceMax !== event.priceMin
      ? `$${event.priceMin.toFixed(0)} – $${event.priceMax.toFixed(0)}`
      : `From $${event.priceMin.toFixed(0)}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative h-[50vh] min-h-[320px] max-h-[520px] overflow-hidden bg-slate-900 mt-16">
        {heroImage && (
          <img
            src={heroImage}
            alt={event.name}
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/events")}
            className="bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm"
            data-testid="button-back-events"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Events
          </Button>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setSavedToHeart((s) => !s)}
            className="bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm h-9 w-9"
            data-testid="button-save-event"
          >
            <Heart className={`w-4 h-4 ${savedToHeart ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => navigator.share?.({ title: event.name, url: window.location.href }).catch(() => {})}
            className="bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm h-9 w-9"
            data-testid="button-share-event"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {event.images?.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {event.images.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImage ? "bg-white w-3" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            {event.genre && (
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm text-xs">
                {event.genre}
              </Badge>
            )}
            {event.status === "onsale" && (
              <Badge className="bg-green-500/20 text-green-300 border-green-400/20 backdrop-blur-sm text-xs">
                🟢 On Sale
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {event.name}
          </h1>
          {event.artist && event.artist !== event.name && (
            <p className="text-white/70 text-base mt-1">{event.artist}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Date & Time</p>
              <p className="text-sm font-semibold text-foreground">{formatDate(event.date, event.time)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Venue</p>
              <p className="text-sm font-semibold text-foreground">{event.venue || "TBD"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[event.address, event.city, event.state].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
            <DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Ticket Prices</p>
              <p className="text-sm font-semibold text-foreground">{priceLabel || "See Ticketmaster"}</p>
              {event.status === "onsale" && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 font-medium">Tickets on sale now</p>
              )}
            </div>
          </div>
        </div>

        {event.description && (
          <div className="mb-8 p-5 rounded-xl border border-border bg-card">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About this event</h2>
            <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
          </div>
        )}

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
          <button
            onClick={() => setPlannerOpen((o) => !o)}
            className="w-full flex items-center justify-between p-5 hover:bg-primary/5 transition-colors"
            data-testid="button-toggle-planner"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Plan This Trip</p>
                <p className="text-sm text-muted-foreground">
                  Find flights & hotels for {event.city || "this event"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!plannerOpen && event.date && (
                <Badge variant="secondary" className="text-xs hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(parseISO(event.date), "MMM d")}
                </Badge>
              )}
              {plannerOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {plannerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-primary/10 pt-5">
                  <TripPlanner event={event} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.dispatchEvent(new Event("open-luxe"))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
            data-testid="button-ask-luxe-event"
          >
            <Sparkles className="w-4 h-4" />
            Ask Luxe about this event or trip
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music, Trophy, Smile, PartyPopper, Search, Loader2,
  MapPin, Calendar, Ticket, ChevronRight, Sparkles, Users, Drama,
} from "lucide-react";
import { format, addDays } from "date-fns";

const HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&q=80&auto=format&fit=crop",
    label: "Live concert",
  },
  {
    url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&q=80&auto=format&fit=crop",
    label: "Concert stage",
  },
  {
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&q=80&auto=format&fit=crop",
    label: "Sports stadium",
  },
  {
    url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1600&q=80&auto=format&fit=crop",
    label: "Music festival",
  },
  {
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80&auto=format&fit=crop",
    label: "Arena show",
  },
];

export type LuxEvent = {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
  date: string | null;
  time: string | null;
  status: string;
  artist: string | null;
  category: string;
  genre: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
};

type EventsResponse = {
  events: LuxEvent[];
  total: number;
  page: number;
  totalPages: number;
};

const CATEGORIES = [
  { id: "all", label: "All Events", icon: Sparkles },
  { id: "Music", label: "Concerts", icon: Music },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Arts & Theatre", label: "Comedy & Theatre", icon: Drama },
  { id: "Family", label: "Family", icon: Users },
  { id: "Miscellaneous", label: "Festivals", icon: PartyPopper },
];

function formatDate(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return "Date TBD";
  try {
    const d = new Date(`${dateStr}T${timeStr || "00:00:00"}`);
    return format(d, "EEE, MMM d · h:mm a");
  } catch {
    return dateStr;
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "Music": return "bg-violet-500/10 text-violet-600 border-violet-200";
    case "Sports": return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "Arts & Theatre": return "bg-amber-500/10 text-amber-600 border-amber-200";
    case "Family": return "bg-green-500/10 text-green-600 border-green-200";
    default: return "bg-primary/10 text-primary border-primary/20";
  }
}

function EventCard({ event }: { event: LuxEvent }) {
  const label = event.genre || event.category;
  return (
    <Link href={`/events/${event.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200"
        data-testid={`card-event-${event.id}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Ticket className="w-12 h-12 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {label && (
            <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryColor(event.category)}`}>
              {label}
            </span>
          )}
          {event.priceMin && (
            <span className="absolute top-3 right-3 text-xs font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
              From ${event.priceMin.toFixed(0)}
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {event.name}
          </h3>
          {event.artist && event.artist !== event.name && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{event.artist}</p>
          )}

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>{formatDate(event.date, event.time)}</span>
            </div>
            {(event.venue || event.city) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="line-clamp-1">
                  {[event.venue, event.city, event.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {event.status === "onsale" ? "🟢 On sale" : event.status === "offsale" ? "🔴 Off sale" : "Tickets available"}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-1.5 transition-all">
              Plan trip <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="space-y-2 mt-2">
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const [search, setSearch] = useState({ keyword: "", city: "", category: "all" });

  const today = format(new Date(), "yyyy-MM-dd");
  const future = format(addDays(new Date(), 180), "yyyy-MM-dd");

  const { data, isLoading, isError } = useQuery<EventsResponse>({
    queryKey: ["/api/events", search],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: today, endDate: future });
      if (search.keyword) params.set("keyword", search.keyword);
      if (search.city) params.set("city", search.city);
      if (search.category !== "all") params.set("category", search.category);
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load events");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch({ keyword, city, category });
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setSearch((s) => ({ ...s, category: cat }));
  };

  const isSetupNeeded = isError && !isLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative overflow-hidden pt-24 pb-16 px-4 min-h-[340px] flex items-center">
        {/* Rotating background images */}
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img.url}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${img.url})`,
              opacity: i === heroIdx ? 1 : 0,
            }}
            aria-hidden="true"
          />
        ))}
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Subtle gradient at bottom to blend into page */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />

        <div className="max-w-4xl mx-auto relative z-10 text-center w-full">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-sm">
            <Ticket className="w-3 h-3 mr-1" /> Live Events Travel Planner
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-serif drop-shadow-md">
            Plan Around What Matters
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto drop-shadow">
            Concerts, sports, theater, and festivals — discover events and find luxury hotels nearby. Official tickets purchased on Ticketmaster.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Artist, team, event name..."
                className="pl-9 bg-white/95 border-0 shadow-lg h-11"
                data-testid="input-events-keyword"
              />
            </div>
            <div className="relative sm:w-44">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="pl-9 bg-white/95 border-0 shadow-lg h-11"
                data-testid="input-events-city"
              />
            </div>
            <Button type="submit" className="h-11 px-6 shadow-lg" data-testid="button-events-search">
              Search
            </Button>
          </form>

          {/* Image indicator dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === heroIdx ? "bg-white w-4" : "bg-white/40"}`}
                aria-label={`View ${HERO_IMAGES[i].label}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleCategorySelect(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                category === id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-muted/40"
              }`}
              data-testid={`button-category-${id}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 mb-6 px-4 py-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
          <Ticket className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
          <span>
            Event tickets are sold and fulfilled by Ticketmaster. LuxVibe does not sell, resell, hold, or guarantee tickets — hotel bookings and ticket purchases are completed separately. LuxVibe may earn a commission on eligible Ticketmaster purchases.
          </span>
        </div>

        {isSetupNeeded ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Events Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              The Events Travel Planner is built and ready — it needs a Ticketmaster API key to go live.
              Get a free key at{" "}
              <a
                href="https://developer.ticketmaster.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                developer.ticketmaster.com
              </a>
              {" "}and add it as <code className="bg-muted px-1 rounded text-xs">TICKETMASTER_API_KEY</code> in environment secrets.
            </p>
            <Badge variant="outline" className="text-xs">
              Free tier: 5,000 API calls/day
            </Badge>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : !data?.events?.length ? (
          <div className="text-center py-16 px-6 bg-muted/20 rounded-2xl border border-dashed border-border">
            <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try a different city, date range, or browse all categories.
            </p>
            <button
              onClick={() => window.dispatchEvent(new Event("open-luxe"))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
              data-testid="button-ask-luxe-events"
            >
              <Sparkles className="w-4 h-4" />
              Ask Luxe to find an event
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {data.total.toLocaleString()} events found
                {search.city ? ` in ${search.city}` : ""}
              </p>
            </div>
            <AnimatePresence mode="wait">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {data.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

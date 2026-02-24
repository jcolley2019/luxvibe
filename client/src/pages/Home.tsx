import { useState, useMemo, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { SearchHero } from "@/components/SearchHero";
import { HotelCard, type DealBadge } from "@/components/HotelCard";
import { useSearchHotels, useFeaturedHotels, useNearbyHotels } from "@/hooks/use-hotels";
import { Loader2, ArrowUpDown, LocateFixed, ChevronLeft, ChevronRight, MapPin, Heart, Tag, ThumbsUp, Star, SlidersHorizontal, X, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type SortOption = "recommended" | "price_asc" | "price_desc" | "rating";

function getRatingLabel(rating: number | null): string {
  if (!rating) return "New";
  if (rating >= 9.0) return "Exceptional";
  if (rating >= 8.5) return "Fabulous";
  if (rating >= 8.0) return "Wonderful";
  if (rating >= 7.0) return "Very Good";
  if (rating >= 6.0) return "Good";
  return "Reviewed";
}

function getNights(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

function StarRow({ stars }: { stars: number | null }) {
  if (!stars) return null;
  const full = Math.floor(stars);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < full ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
];

function getFallbackImage(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

interface ListHotel {
  id: string;
  name: string;
  address: string;
  city?: string;
  stars?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  price?: number | null;
  imageUrl?: string | null;
}

function HotelListCard({
  hotel,
  checkIn,
  checkOut,
  guests,
  dealBadge,
  nights,
}: {
  hotel: ListHotel;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  dealBadge?: DealBadge;
  nights: number;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  useEffect(() => {
    setWishlisted(localStorage.getItem(`wishlist_${hotel.id}`) === "1");
  }, [hotel.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !wishlisted;
    setWishlisted(next);
    if (next) localStorage.setItem(`wishlist_${hotel.id}`, "1");
    else localStorage.removeItem(`wishlist_${hotel.id}`);
  };

  const params = new URLSearchParams();
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests) params.set("guests", guests);
  const detailsUrl = `/hotel/${hotel.id}?${params.toString()}`;

  const price = hotel.price && hotel.price > 0 ? hotel.price : null;
  const totalPrice = price ? price * nights : null;
  const label = getRatingLabel(hotel.rating ?? null);

  const discountPct = dealBadge === "great-deal" ? 12 : dealBadge === "good-value" ? 7 : null;

  return (
    <Link href={detailsUrl} data-testid={`card-hotel-${hotel.id}`}>
      <div className="group bg-white dark:bg-card border border-border rounded-xl overflow-hidden flex hover:shadow-md transition-all duration-200 cursor-pointer">

        {/* Photo */}
        <div className="relative w-[220px] shrink-0 overflow-hidden bg-muted">
          <img
            src={hotel.imageUrl || getFallbackImage(hotel.id)}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(hotel.id); }}
          />
          <button
            onClick={toggleWishlist}
            className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            data-testid={`button-wishlist-${hotel.id}`}
          >
            <Heart className={`w-4 h-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
          </button>
          {dealBadge && (
            <div className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-white text-[11px] font-bold ${dealBadge === "great-deal" ? "bg-emerald-500" : "bg-sky-500"}`}>
              {dealBadge === "great-deal" ? "Great Deal" : "Good Value"}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-4 flex flex-col min-w-0">
          <StarRow stars={hotel.stars ?? null} />
          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors mt-1 mb-1 line-clamp-1">
            {hotel.name}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3 mr-1 shrink-0" />
            <span className="line-clamp-1">{hotel.address}</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="w-[200px] shrink-0 p-4 flex flex-col items-end justify-between border-l border-border">
          {/* Rating badge top right */}
          <div className="flex items-center gap-2 mb-2 self-end">
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{label}</div>
              {hotel.reviewCount ? (
                <div className="text-xs text-muted-foreground">{hotel.reviewCount.toLocaleString()} reviews</div>
              ) : null}
            </div>
            {hotel.rating ? (
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {hotel.rating % 1 === 0 ? hotel.rating.toFixed(0) : hotel.rating.toFixed(1)}
              </div>
            ) : null}
          </div>

          <div className="text-right mt-auto">
            {discountPct && (
              <div className="inline-block bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded mb-1">
                {discountPct}% off
              </div>
            )}
            {price ? (
              <>
                <div className="text-xl font-bold text-foreground">US${price.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">/ night</div>
                {totalPrice && nights > 1 && (
                  <div className="text-xs text-muted-foreground">US${totalPrice.toLocaleString()} total</div>
                )}
                <div className="text-xs text-muted-foreground">incl. taxes & fees</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Check rates</div>
            )}
            <div className="mt-3">
              <div className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
                See availability
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const TIPS = [
  {
    icon: "🔍",
    title: "Pick from the dropdown for best results",
    text: "When you type a destination, select a suggestion from the list that appears — this gives the search engine a precise location and finds far more hotels.",
  },
  {
    icon: "🎰",
    title: "Searching Las Vegas? Try \"Las Vegas Strip\"",
    text: "Type \"Las Vegas Strip\" and pick that option from the dropdown to focus results on the famous Strip resorts like Bellagio, MGM Grand, and Caesars Palace.",
  },
  {
    icon: "✨",
    title: "Use Vibe search for inspiration",
    text: "Switch to the Vibe tab in the search bar and describe the kind of stay you want — like \"romantic beachfront resort\" or \"luxury casino in Las Vegas\" — and AI will find matching hotels.",
  },
  {
    icon: "⭐",
    title: "Only 4 & 5-star hotels shown by default",
    text: "Results are filtered to luxury properties by default. Use the star filter on the left to show 3-star or budget options too.",
  },
];

function SearchTips() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("luxvibe_tips_v1") === "dismissed"; } catch { return false; }
  });
  const [expanded, setExpanded] = useState<number | null>(null);

  const dismiss = () => {
    try { localStorage.setItem("luxvibe_tips_v1", "dismissed"); } catch {}
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 mb-2"
      >
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
              <Lightbulb className="w-4 h-4 shrink-0" />
              Search tips
            </div>
            <button
              onClick={dismiss}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 transition-colors p-0.5"
              data-testid="button-dismiss-tips"
              aria-label="Dismiss tips"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIPS.map((tip, i) => (
              <button
                key={i}
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="text-left bg-white/60 dark:bg-amber-900/20 rounded-lg px-3 py-2 hover:bg-white dark:hover:bg-amber-900/40 transition-colors border border-amber-100 dark:border-amber-800/40"
                data-testid={`tip-item-${i}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>{tip.icon}</span>
                    {tip.title}
                  </span>
                  {expanded === i
                    ? <ChevronUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  }
                </div>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1.5 leading-relaxed overflow-hidden"
                    >
                      {tip.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>

          <button
            onClick={dismiss}
            className="mt-3 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            data-testid="button-got-it"
          >
            Got it, don't show again
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const destination = searchParams.get("destination");
  const placeId = searchParams.get("placeId");
  const aiSearch = searchParams.get("aiSearch");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests") || "2";

  const isSearchActive = !!((destination || placeId || aiSearch) && checkIn && checkOut);
  const nights = getNights(checkIn || undefined, checkOut || undefined);

  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [nameFilter, setNameFilter] = useState("");
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [starFilter, setStarFilter] = useState<number[]>([4, 5]);
  const [includeUnrated, setIncludeUnrated] = useState(false);
  const [guestRatingMin, setGuestRatingMin] = useState<number | null>(null);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);

  const { data: hotels, isLoading, error } = useSearchHotels({
    destination: destination || undefined,
    placeId: placeId || undefined,
    aiSearch: aiSearch || undefined,
    checkIn: checkIn || "",
    checkOut: checkOut || "",
    guests,
  });

  const { data: featured, isLoading: featuredLoading } = useFeaturedHotels();

  const carouselRef = useRef<HTMLDivElement>(null);
  const nearbyCarouselRef = useRef<HTMLDivElement>(null);
  const recentCarouselRef = useRef<HTMLDivElement>(null);

  type RecentHotel = { id: string; name: string; address: string; city: string; stars: number | null; rating: number | null; reviewCount: number | null; price: number | null; imageUrl: string | null };
  const [recentHotels, setRecentHotels] = useState<RecentHotel[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentlyViewedHotels") || "[]");
      setRecentHotels(stored);
    } catch {}
  }, []);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, dir: "left" | "right") => {
    if (!ref.current) return;
    const cardWidth = ref.current.firstElementChild?.clientWidth ?? 300;
    ref.current.scrollBy({ left: dir === "right" ? cardWidth + 20 : -(cardWidth + 20), behavior: "smooth" });
  };

  type GeoStatus = "idle" | "loading" | "granted" | "denied";
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) { setGeoStatus("denied"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus("granted"); },
      () => setGeoStatus("denied"),
      { timeout: 10000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  const { data: nearbyHotels, isLoading: nearbyLoading } = useNearbyHotels(coords);

  const enrichedRecentHotels = useMemo(() => {
    const freshSources = [...(featured || []), ...(nearbyHotels || [])];
    const freshById: Record<string, any> = {};
    freshSources.forEach(h => { freshById[h.id] = h; });
    return recentHotels.map(rh => {
      const fresh = freshById[rh.id];
      if (!fresh) return rh;
      return { ...rh, stars: rh.stars ?? fresh.stars ?? null, rating: rh.rating ?? fresh.rating ?? null, reviewCount: rh.reviewCount ?? fresh.reviewCount ?? null, price: fresh.price ?? rh.price ?? null };
    });
  }, [recentHotels, featured, nearbyHotels]);

  // Compute price range from results
  const priceRange = useMemo(() => {
    if (!hotels?.length) return { min: 0, max: 2000 };
    const prices = hotels.map(h => (h as any).price as number | null).filter(Boolean) as number[];
    if (!prices.length) return { min: 0, max: 2000 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [hotels]);

  useEffect(() => {
    if (hotels?.length) setPriceMax(priceRange.max);
  }, [priceRange.max, hotels?.length]);

  const KNOWN_BRANDS = [
    "Marriott","Sheraton","Westin","Courtyard","Residence Inn","Fairfield","SpringHill","AC Hotel",
    "Hilton","DoubleTree","Embassy Suites","Hampton","Curio","Conrad","Waldorf","Signia",
    "Hyatt","Andaz","Aloft","Element","Le Méridien","W Hotel",
    "InterContinental","Holiday Inn","Kimpton","Crowne Plaza","Indigo",
    "Best Western","Radisson","Comfort Inn","Comfort Suites","Quality Inn","Sleep Inn","Clarion",
    "La Quinta","Ramada","Days Inn","Super 8","Wyndham","Travelodge","Howard Johnson",
    "Four Seasons","Ritz-Carlton","St. Regis","Novotel","Sofitel","Mercure","Ibis",
    "Loews","Omni","Hard Rock","Autograph","Tribute","Moxy","Graduate","Motto",
  ];

  function extractBrand(name: string): string {
    const lower = name.toLowerCase();
    for (const brand of KNOWN_BRANDS) {
      if (lower.includes(brand.toLowerCase())) return brand;
    }
    return "Independent";
  }

  const brandCounts = useMemo(() => {
    if (!hotels?.length) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const h of hotels) {
      const brand = extractBrand(h.name);
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    return counts;
  }, [hotels]);

  const availableBrands = useMemo(() => {
    return Array.from(brandCounts.entries()).sort((a, b) => b[1] - a[1]);
  }, [brandCounts]);

  function computeDealBadges(hotelList: Array<{ id: string; price?: number | null; stars?: number | null }>): Map<string, DealBadge> {
    const tierPrices: Record<number, number[]> = {};
    for (const h of hotelList) {
      const price = (h as any).price as number | null;
      const stars = (h as any).stars as number | null;
      if (price && price > 0 && stars) {
        const tier = Math.round(stars);
        if (!tierPrices[tier]) tierPrices[tier] = [];
        tierPrices[tier].push(price);
      }
    }
    const tierAvg: Record<number, number> = {};
    for (const [tier, prices] of Object.entries(tierPrices)) {
      tierAvg[Number(tier)] = prices.reduce((s, p) => s + p, 0) / prices.length;
    }
    const map = new Map<string, DealBadge>();
    for (const h of hotelList) {
      const price = (h as any).price as number | null;
      const stars = (h as any).stars as number | null;
      if (!price || price <= 0 || !stars) { map.set(h.id, null); continue; }
      const avg = tierAvg[Math.round(stars)];
      if (!avg) { map.set(h.id, null); continue; }
      if (price < avg * 0.85) map.set(h.id, "great-deal");
      else if (price < avg * 0.92) map.set(h.id, "good-value");
      else map.set(h.id, null);
    }
    return map;
  }

  const sortedHotels = useMemo(() => {
    if (!hotels) return [];
    const copy = [...hotels];
    if (sortBy === "price_asc") return copy.sort((a, b) => ((a as any).price || 9999) - ((b as any).price || 9999));
    if (sortBy === "price_desc") return copy.sort((a, b) => ((b as any).price || 0) - ((a as any).price || 0));
    if (sortBy === "rating") return copy.sort((a, b) => ((b as any).rating || 0) - ((a as any).rating || 0));
    return copy;
  }, [hotels, sortBy]);

  const filteredHotels = useMemo(() => {
    return sortedHotels.filter(h => {
      const price = (h as any).price as number | null;
      const stars = (h as any).stars as number | null;
      const rating = (h as any).rating as number | null;

      if (nameFilter && !h.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (price && price > priceMax) return false;

      if (starFilter.length > 0 || includeUnrated) {
        const roundedStars = stars ? Math.round(stars) : null;
        const matchesStar = starFilter.length > 0 && roundedStars !== null && starFilter.includes(roundedStars);
        const matchesUnrated = includeUnrated && !stars;
        if (!matchesStar && !matchesUnrated) return false;
      }

      if (guestRatingMin !== null && (rating === null || rating < guestRatingMin)) return false;

      if (brandFilter.length > 0 && !brandFilter.includes(extractBrand(h.name))) return false;

      return true;
    });
  }, [sortedHotels, nameFilter, priceMax, starFilter, includeUnrated, guestRatingMin, brandFilter]);

  const searchDealBadges = useMemo(() => computeDealBadges(filteredHotels), [filteredHotels]);
  const featuredDealBadges = useMemo(() => computeDealBadges(featured ?? []), [featured]);
  const nearbyDealBadges = useMemo(() => computeDealBadges(nearbyHotels ?? []), [nearbyHotels]);

  const toggleStarFilter = (star: number) => {
    setStarFilter(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);
  };

  const toggleBrandFilter = (brand: string) => {
    setBrandFilter(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const DEFAULT_STAR_FILTER = [4, 5];
  const isDefaultStarFilter =
    starFilter.length === DEFAULT_STAR_FILTER.length &&
    DEFAULT_STAR_FILTER.every(s => starFilter.includes(s));

  const activeFilterCount =
    (nameFilter ? 1 : 0) +
    (priceMax < priceRange.max ? 1 : 0) +
    (isDefaultStarFilter ? 0 : includeUnrated ? starFilter.length + 1 : starFilter.length) +
    (guestRatingMin !== null ? 1 : 0) +
    brandFilter.length;

  const clearFilters = () => {
    setNameFilter("");
    setPriceMax(priceRange.max);
    setStarFilter([4, 5]);
    setIncludeUnrated(false);
    setGuestRatingMin(null);
    setBrandFilter([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <SearchHero
        initialDestination={destination || undefined}
        initialPlaceId={placeId || undefined}
        initialAiSearch={aiSearch || undefined}
        initialCheckIn={checkIn || undefined}
        initialCheckOut={checkOut || undefined}
        initialGuests={guests}
      />

      <SearchTips />

      {isSearchActive ? (
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="flex gap-6">

            {/* ── Filter Sidebar ── */}
            <aside className="w-64 shrink-0 hidden lg:block">
              <div className="bg-white dark:bg-card border border-border rounded-xl sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-clear-filters">
                      <X className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-5">

                  {/* Property name */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Property name</p>
                    <input
                      type="text"
                      placeholder="For example, Hilton"
                      value={nameFilter}
                      onChange={e => setNameFilter(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      data-testid="input-filter-name"
                    />
                  </div>

                  {/* Price per night */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Price (per night)</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      US${priceRange.min} &rarr; {priceMax >= priceRange.max ? `US$${priceRange.max.toLocaleString()}+` : `US$${priceMax.toLocaleString()}`}
                    </p>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={priceMax}
                      onChange={e => setPriceMax(Number(e.target.value))}
                      className="w-full accent-primary"
                      data-testid="input-filter-price"
                    />
                  </div>

                  {/* Star rating */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">Star rating</p>
                      {isDefaultStarFilter && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">Luxury</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {[5, 4, 3, 2, 1].map(star => (
                        <label key={star} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={starFilter.includes(star)}
                            onChange={() => toggleStarFilter(star)}
                            className="accent-primary w-4 h-4 rounded"
                            data-testid={`checkbox-star-${star}`}
                          />
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: star }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-sm text-foreground">{star} {star === 1 ? "star" : "stars"}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeUnrated}
                          onChange={() => setIncludeUnrated(v => !v)}
                          className="accent-primary w-4 h-4 rounded"
                          data-testid="checkbox-star-unrated"
                        />
                        <span className="text-sm text-foreground">Unrated</span>
                      </label>
                    </div>
                  </div>

                  {/* Guest rating */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Guest rating</p>
                    <div className="flex flex-col gap-2">
                      {([
                        { label: "Wonderful: 9+", min: 9 },
                        { label: "Very Good: 8+", min: 8 },
                        { label: "Good: 7+", min: 7 },
                        { label: "Pleasant: 6+", min: 6 },
                      ] as { label: string; min: number }[]).map(({ label, min }) => (
                        <label key={min} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={guestRatingMin === min}
                            onChange={() => setGuestRatingMin(prev => prev === min ? null : min)}
                            className="accent-primary w-4 h-4 rounded"
                            data-testid={`checkbox-rating-${min}`}
                          />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Brand */}
                  {availableBrands.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Brand</p>
                      <div className="flex flex-col gap-2">
                        {availableBrands.map(([brand, count]) => (
                          <label key={brand} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={brandFilter.includes(brand)}
                              onChange={() => toggleBrandFilter(brand)}
                              className="accent-primary w-4 h-4 rounded"
                              data-testid={`checkbox-brand-${brand}`}
                            />
                            <span className="text-sm text-foreground">{brand} ({count})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </aside>

            {/* ── Results ── */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold font-heading">
                    {aiSearch ? (
                      <>Vibe: <span className="text-primary capitalize">{aiSearch}</span></>
                    ) : (
                      <>Hotels in <span className="text-primary capitalize">{destination || "your destination"}</span></>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? "Searching…" : `${filteredHotels.length} properties found`}
                    </p>
                    {isDefaultStarFilter && !isLoading && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        Luxury &amp; 4–5★ hotels
                        <button
                          onClick={() => setStarFilter([])}
                          className="ml-0.5 hover:text-amber-900 dark:hover:text-amber-300 underline underline-offset-2"
                          data-testid="button-show-all-ratings"
                        >
                          Show all
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    data-testid="select-sort"
                  >
                    <option value="recommended">Our top picks</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>

              {/* Hotel list */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <p className="text-destructive font-medium mb-2">{(error as Error).message || "Something went wrong."}</p>
                  <p className="text-sm text-muted-foreground">Try adding the country, e.g. "Paris, France".</p>
                </div>
              ) : filteredHotels.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or dates.</p>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">Clear filters</button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredHotels.map((hotel, i) => (
                    <motion.div
                      key={hotel.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                    >
                      <HotelListCard
                        hotel={hotel as ListHotel}
                        checkIn={checkIn || undefined}
                        checkOut={checkOut || undefined}
                        guests={guests}
                        dealBadge={searchDealBadges.get(hotel.id)}
                        nights={nights}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Featured / Recommended Hotels */}
          <section className="pt-10 pb-10 container mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold font-heading">Recommended Hotels</h2>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm mr-1">Handpicked for you</span>
                <button onClick={() => scrollCarousel(carouselRef, "left")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-carousel-prev">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollCarousel(carouselRef, "right")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-carousel-next">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {featuredLoading ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : (
              <div ref={carouselRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 carousel-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {featured?.map((hotel, i) => (
                  <motion.div key={hotel.id} className="flex-none w-[calc(25%-15px)] min-w-[240px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                    <HotelCard hotel={hotel} variant="featured" dealBadge={featuredDealBadges.get(hotel.id)} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Recently Viewed */}
          {recentHotels.length > 0 && (
            <section className="pb-10 container mx-auto px-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold font-heading">Your Recent Searches</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => scrollCarousel(recentCarouselRef, "left")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-recent-prev"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => scrollCarousel(recentCarouselRef, "right")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-recent-next"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div ref={recentCarouselRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 carousel-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {enrichedRecentHotels.map((hotel, i) => (
                  <motion.div key={hotel.id} className="flex-none w-[calc(25%-15px)] min-w-[240px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                    <HotelCard hotel={hotel} variant="featured" />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Nearby Hotels */}
          {geoStatus !== "denied" && (
            <section className="pb-10 container mx-auto px-4">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold font-heading">Hotels Near You</h2>
                  {nearbyHotels && nearbyHotels.length > 0 && nearbyHotels[0].city && (
                    <p className="text-sm text-muted-foreground mt-0.5">Showing hotels in <span className="font-medium text-foreground">{nearbyHotels[0].city}</span></p>
                  )}
                  {(geoStatus === "idle" || geoStatus === "loading") && (
                    <p className="text-sm text-muted-foreground mt-0.5">Finding your location…</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(geoStatus === "granted" && nearbyHotels && nearbyHotels.length > 0) && (
                    <span className="text-muted-foreground text-sm mr-1">{nearbyHotels.length} properties</span>
                  )}
                  <button onClick={() => scrollCarousel(nearbyCarouselRef, "left")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-nearby-prev"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => scrollCarousel(nearbyCarouselRef, "right")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-nearby-next"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              {geoStatus === "idle" || geoStatus === "loading" ? (
                <div className="flex items-center justify-center h-40 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <div className="text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Detecting your location…</p></div>
                </div>
              ) : nearbyLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
              ) : nearbyHotels && nearbyHotels.length > 0 ? (
                <div ref={nearbyCarouselRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 carousel-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {nearbyHotels.map((hotel, i) => (
                    <motion.div key={hotel.id} className="flex-none w-[calc(25%-15px)] min-w-[240px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                      <HotelCard hotel={hotel} variant="featured" dealBadge={nearbyDealBadges.get(hotel.id)} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm mb-3">No hotels found near your location.</p>
                    <Button variant="outline" size="sm" onClick={requestLocation} className="gap-2" data-testid="button-retry-location"><LocateFixed className="w-4 h-4" />Try Again</Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Why Luxvibe */}
          <section className="py-14 bg-muted/40 border-t border-border">
            <div className="container mx-auto px-4 text-center max-w-2xl mb-10">
              <h2 className="text-2xl font-bold font-heading mb-2">Why Choose Luxvibe?</h2>
              <p className="text-muted-foreground">We simplify your hotel booking with features designed for peace of mind.</p>
            </div>
            <div className="container mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🔒", title: "Secure Booking", desc: "Enterprise-grade security for your data and payments." },
                { icon: "🕐", title: "24/7 Support", desc: "Round-the-clock help whenever you need it." },
                { icon: "💰", title: "Best Price Guarantee", desc: "Find it cheaper? We'll match it, no questions asked." },
                { icon: "✨", title: "Handpicked Hotels", desc: "Every hotel vetted for quality and exceptional service." },
              ].map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

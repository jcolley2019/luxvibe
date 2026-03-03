import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearch, useLocation } from "wouter";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import SearchHero from "@/components/SearchHero";
import { HotelCard, type DealBadge } from "@/components/HotelCard";
import { HotelListCard, type ListHotel } from "@/components/HotelListCard";
import { useSearchHotels, useFeaturedHotels, useNearbyHotels } from "@/hooks/use-hotels";
import { SearchMapView } from "@/components/SearchMapView";
import { SearchMapThumbnail } from "@/components/SearchMapThumbnail";
import { Loader2, ArrowUpDown, LocateFixed, ChevronLeft, ChevronRight, Heart, Tag, ThumbsUp, Star, SlidersHorizontal, X, ChevronDown, ChevronUp, Map as MapIcon, Search, List, Sparkles, Palmtree, Building2, Briefcase, Waves, Compass, Dumbbell, Gem, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type SortOption = "recommended" | "price_asc" | "price_desc" | "rating";

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: "Room Only", BB: "Breakfast Included", HB: "Half Board",
  FB: "Full Board", AI: "All Inclusive", SA: "Self Catering",
};

const KEY_FACILITIES = [
  "Swimming pool", "Pool", "Outdoor pool", "Indoor pool",
  "Spa", "Fitness center", "Fitness facilities", "Gym",
  "Restaurant", "Bar", "Casino", "Free WiFi", "WiFi",
  "Parking", "Airport shuttle", "Business center", "Meeting rooms",
  "Pet friendly", "Pets allowed", "24-hour front desk", "Room service",
  "Laundry", "Laundry service", "Non-smoking rooms", "Family rooms",
  "Accessible facilities", "Wheelchair accessible", "Air conditioning",
  "Microwave", "Mini bar", "Balcony", "Ocean view", "Kitchen",
];

const KEY_ROOM_AMENITIES = [
  "Air conditioning", "Flat-screen TV", "Mini bar", "Safe", "Hairdryer",
  "Bathtub", "Shower", "Coffee maker", "Microwave", "Refrigerator",
  "Balcony", "Kitchen", "Washing machine", "Iron", "Work desk",
  "Telephone", "Bathrobe", "Slippers", "Sea view", "City view",
];

const FIXED_MEAL_PLANS: { label: string; codes: string[] }[] = [
  { label: "Breakfast included", codes: ["BB"] },
  { label: "Lunch included", codes: [] },
  { label: "Dinner included", codes: ["HB"] },
  { label: "All meals included", codes: ["FB", "AI"] },
];

const PROPERTY_TYPE_ORDER = [
  "Hotel", "Resort", "Apartment", "Holiday home", "Motel", "Villa", "Condo", "Bed and breakfast",
];

function normalizeForFilter(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function FilterSection({ title, children, defaultOpen = true, forceExpand, forceCollapse }: { title: string; children: React.ReactNode; defaultOpen?: boolean; forceExpand?: number; forceCollapse?: number }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceExpand && forceExpand > 0) setOpen(true);
  }, [forceExpand]);

  useEffect(() => {
    if (forceCollapse && forceCollapse > 0) setOpen(false);
  }, [forceCollapse]);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-4 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
        type="button"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function getNights(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [, m, d] = parts;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
}

const VIBE_CARDS = [
  { label: "Romantic Getaway", query: "romantic getaway hotel with couples spa", icon: Heart, gradient: "from-rose-500 to-pink-600" },
  { label: "Family Adventure", query: "family-friendly hotel with kids activities and pool", icon: Palmtree, gradient: "from-emerald-500 to-teal-600" },
  { label: "Business Travel", query: "business hotel with meeting rooms and fast wifi", icon: Briefcase, gradient: "from-slate-600 to-slate-800" },
  { label: "Beach Paradise", query: "beachfront resort with ocean view and pool", icon: Waves, gradient: "from-sky-400 to-blue-600" },
  { label: "City Explorer", query: "boutique hotel in city center near attractions", icon: Compass, gradient: "from-amber-500 to-orange-600" },
  { label: "Wellness Retreat", query: "wellness spa resort with yoga and meditation", icon: Dumbbell, gradient: "from-violet-500 to-purple-600" },
  { label: "Luxury Escape", query: "luxury five star hotel with premium amenities", icon: Gem, gradient: "from-yellow-500 to-amber-600" },
  { label: "Budget Friendly", query: "affordable comfortable hotel good value", icon: PiggyBank, gradient: "from-green-500 to-emerald-600" },
];

function DiscoverByVibe() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleVibeClick = (query: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    const checkIn = tomorrow.toISOString().split("T")[0];
    const checkOut = dayAfter.toISOString().split("T")[0];
    const params = new URLSearchParams({
      aiSearch: query,
      checkIn,
      checkOut,
      guests: "2",
    });
    setLocation(`/?${params.toString()}`);
  };

  return (
    <section className="pb-10 container mx-auto px-4" data-testid="section-discover-vibe">
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold font-heading">Discover by Vibe</h2>
        </div>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-tight">AI-Powered</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {VIBE_CARDS.map((vibe, i) => {
          const Icon = vibe.icon;
          return (
            <motion.button
              key={vibe.label}
              onClick={() => handleVibeClick(vibe.query)}
              className={`relative overflow-hidden rounded-xl p-5 text-left text-white bg-gradient-to-br ${vibe.gradient} hover:shadow-lg transition-shadow duration-300 group`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              data-testid={`button-vibe-${vibe.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className="w-8 h-8 mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-sm font-bold leading-tight">{vibe.label}</div>
              <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className="w-16 h-16" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const destination = searchParams.get("destination");
  const placeId = searchParams.get("placeId");
  const aiSearch = searchParams.get("aiSearch");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests") || "2";
  const nearMe = searchParams.get("nearMe") === "1";
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const urlCoords = nearMe && urlLat && urlLng
    ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) }
    : null;

  const isSearchActive = !!((destination || placeId || aiSearch || nearMe) && checkIn && checkOut);
  const searchHero = (
    <SearchHero
      variant="navbar"
      initialDestination={destination || undefined}
      initialCheckIn={checkIn || undefined}
      initialCheckOut={checkOut || undefined}
      initialGuests={guests}
    />
  );
  const nights = getNights(checkIn || undefined, checkOut || undefined);
  const dateLabel = checkIn && checkOut ? `${fmtShortDate(checkIn)} – ${fmtShortDate(checkOut)}` : "Add dates";

  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [nameFilter, setNameFilter] = useState("");
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [starFilter, setStarFilter] = useState<number[]>([]);
  const [includeUnrated, setIncludeUnrated] = useState(false);
  const [guestRatingMin, setGuestRatingMin] = useState<number | null>(null);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [mealPlanFilter, setMealPlanFilter] = useState<string[]>([]);
  const [facilitiesFilter, setFacilitiesFilter] = useState<string[]>([]);
  const [landmarks, setLandmarks] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [landmarksLoading, setLandmarksLoading] = useState(false);
  const [landmarkDistances, setLandmarkDistances] = useState<Record<string, number | null>>({});
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string[]>([]);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string[]>([]);
  const [showAllPropertyTypes, setShowAllPropertyTypes] = useState(false);
  const [roomAmenitiesFilter, setRoomAmenitiesFilter] = useState<string[]>([]);
  const [showAllRoomAmenities, setShowAllRoomAmenities] = useState(false);
  const [showAllNeighborhoods, setShowAllNeighborhoods] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [forceExpand, setForceExpand] = useState(0);
  const [forceCollapse, setForceCollapse] = useState(0);

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
    const children = ref.current.children;
    if (children.length < 2) return;
    const first = children[0] as HTMLElement;
    const second = children[1] as HTMLElement;
    const cardStep = second.offsetLeft - first.offsetLeft;
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 1 : 4;
    const scrollAmount = cardStep * count;
    ref.current.scrollBy({ left: dir === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
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

  const { data: nearbyHotels, isLoading: nearbyLoading } = useNearbyHotels(urlCoords || coords);

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

  function computeDealBadges(hotelList: Array<{ id: string; price?: number | null; stars?: number | null }>): Map<string, { type: DealBadge; discount: number } | null> {
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
    const map = new Map<string, { type: DealBadge; discount: number } | null>();
    for (const h of hotelList) {
      const price = (h as any).price as number | null;
      const stars = (h as any).stars as number | null;
      if (!price || price <= 0 || !stars) { 
        map.set(h.id, null); 
        continue; 
      }
      const avg = tierAvg[Math.round(stars)];
      if (!avg) { 
        map.set(h.id, null); 
        continue; 
      }
      const ratio = price / avg;
      const discount = Math.round(((avg - price) / avg) * 100);
      if (ratio < 0.85) map.set(h.id, { type: "great-deal", discount });
      else if (ratio < 0.92) map.set(h.id, { type: "good-value", discount });
      else map.set(h.id, null);
    }
    return map;
  }

  const featuredDealBadges = useMemo(() => {
    if (!featured) return new Map<string, { type: DealBadge; discount: number } | null>();
    return computeDealBadges(featured as any);
  }, [featured]);

  const nearbyDealBadges = useMemo(() => {
    if (!nearbyHotels) return new Map<string, { type: DealBadge; discount: number } | null>();
    return computeDealBadges(nearbyHotels as any);
  }, [nearbyHotels]);

  useEffect(() => {
    const city = destination || "";
    if (!city.trim() || !isSearchActive) {
      setLandmarks([]);
      setLandmarkDistances({});
      return;
    }
    setLandmarksLoading(true);
    fetch(`/api/landmarks/${encodeURIComponent(city)}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: { name: string; lat: number; lng: number }[]) => {
        setLandmarks(Array.isArray(data) ? data : []);
        setLandmarkDistances({});
      })
      .catch(() => setLandmarks([]))
      .finally(() => setLandmarksLoading(false));
  }, [destination, isSearchActive]);

  const availableFacilities = useMemo((): [string, number][] => {
    if (!hotels?.length) return [];
    const counts = new Map<string, number>();
    for (const h of hotels) {
      const seen = new Set<string>();
      for (const f of ((h as any).facilities || []) as string[]) {
        const norm = normalizeForFilter(f);
        const match = KEY_FACILITIES.find(kf => normalizeForFilter(kf) === norm || norm.includes(normalizeForFilter(kf)) || normalizeForFilter(kf).includes(norm));
        if (match && !seen.has(match)) {
          seen.add(match);
          counts.set(match, (counts.get(match) ?? 0) + 1);
        }
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [hotels]);

  const mapCenter = useMemo(() => {
    if (!hotels?.length) return null;
    const withCoords = hotels.filter(h => {
      const lat = Number((h as any).lat);
      const lng = Number((h as any).lng);
      return (h as any).lat != null && (h as any).lng != null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
    if (!withCoords.length) return null;
    const avgLat = withCoords.reduce((s, h) => s + Number((h as any).lat), 0) / withCoords.length;
    const avgLng = withCoords.reduce((s, h) => s + Number((h as any).lng), 0) / withCoords.length;
    return { lat: avgLat, lng: avgLng };
  }, [hotels]);

  const [destinationCenter, setDestinationCenter] = useState<{ lat: number; lng: number } | null>(null);

  const geocodeQuery = useCallback((query: string) => {
    if (!query.trim()) return;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`, {
      headers: { "User-Agent": "Luxvibe/1.0" },
    })
      .then(r => r.json())
      .then((data: any[]) => {
        if (data?.[0]?.lat && data?.[0]?.lon) {
          setDestinationCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isSearchActive) { setDestinationCenter(null); return; }
    if (destination) geocodeQuery(destination);
  }, [destination, isSearchActive, geocodeQuery]);

  useEffect(() => {
    if (destinationCenter) return;
    if (!hotels?.length) return;
    const city = (hotels[0] as any).city;
    if (city) geocodeQuery(city);
  }, [hotels, destinationCenter, geocodeQuery]);

  const effectiveMapCenter = mapCenter || destinationCenter;

  function extractNeighborhood(hotel: any): string {
    const addr = (hotel.address || "").toLowerCase();
    const city = (hotel.city || "").toLowerCase();
    if (city.includes("henderson")) return "Henderson";
    if (city.includes("north las vegas")) return "North Las Vegas";
    if (city.includes("las vegas") || city === "las vegas") {
      if (addr.includes("las vegas blvd") || addr.includes("strip")) return "The Strip";
      if (addr.includes("fremont") || addr.includes("main st") || addr.includes("3rd st")) return "Downtown / Fremont";
      if (addr.includes("summerlin") || addr.includes("rampart")) return "Summerlin";
      if (addr.includes("henderson") || addr.includes("green valley")) return "Henderson";
      return "Greater Las Vegas";
    }
    return hotel.city || "Other";
  }

  const availableNeighborhoods = useMemo((): [string, number][] => {
    if (!hotels?.length) return [];
    const counts = new Map<string, number>();
    for (const h of hotels) {
      const n = extractNeighborhood(h as any);
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    if (counts.size <= 1) return [];
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [hotels]);

  function extractPropertyType(hotel: any): string {
    const name = (hotel.name || "").toLowerCase();
    if (name.includes("resort")) return "Resort";
    if (name.includes("apartment") || name.includes("apts")) return "Apartment";
    if (name.includes("motel")) return "Motel";
    if (name.includes("villa")) return "Villa";
    if (name.includes("condo") || name.includes("condominium")) return "Condo";
    if (name.includes("bed and breakfast") || name.includes("b&b") || /\binn\b/.test(name)) return "Bed and breakfast";
    if (name.includes("holiday home") || name.includes("vacation home") || name.includes("holiday apartment")) return "Holiday home";
    return "Hotel";
  }

  const availablePropertyTypes = useMemo((): [string, number][] => {
    if (!hotels?.length) return [];
    const counts = new Map<string, number>();
    for (const h of hotels) {
      const type = extractPropertyType(h as any);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return PROPERTY_TYPE_ORDER.filter(t => counts.has(t)).map(t => [t, counts.get(t)!]);
  }, [hotels]);

  const availableRoomAmenities = useMemo((): [string, number][] => {
    if (!hotels?.length) return [];
    const counts = new Map<string, number>();
    for (const h of hotels) {
      const seen = new Set<string>();
      for (const f of ((h as any).roomAmenities || []) as string[]) {
        const norm = normalizeForFilter(f);
        const match = KEY_ROOM_AMENITIES.find(ka => normalizeForFilter(ka) === norm || norm.includes(normalizeForFilter(ka)) || normalizeForFilter(ka).includes(norm));
        if (match && !seen.has(match)) {
          seen.add(match);
          counts.set(match, (counts.get(match) ?? 0) + 1);
        }
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    let list = [...hotels];
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q));
    }
    if (priceMax) {
      list = list.filter(h => (h as any).price != null && (h as any).price <= priceMax);
    }
    if (starFilter.length > 0) {
      list = list.filter(h => {
        if (h.stars == null) return includeUnrated;
        return starFilter.includes(Math.round(h.stars));
      });
    } else if (includeUnrated) {
      list = list.filter(h => h.stars == null);
    }
    if (guestRatingMin != null) {
      list = list.filter(h => h.rating != null && h.rating >= guestRatingMin);
    }
    if (brandFilter.length > 0) {
      list = list.filter(h => brandFilter.includes(extractBrand(h.name)));
    }
    if (freeCancellationOnly) {
      list = list.filter(h => (h as any).isFreeCancellation);
    }
    if (mealPlanFilter.length > 0) {
      list = list.filter(h => {
        const mealCode = (h as any).mealPlanCode;
        if (!mealCode) return false;
        return mealPlanFilter.some(label => {
          const codes = FIXED_MEAL_PLANS.find(p => p.label === label)?.codes || [];
          return codes.includes(mealCode);
        });
      });
    }
    if (facilitiesFilter.length > 0) {
      list = list.filter(h => {
        const hf = ((h as any).facilities || []) as string[];
        return facilitiesFilter.every(f => {
          const normF = normalizeForFilter(f);
          return hf.some(hfac => {
            const normH = normalizeForFilter(hfac);
            return normH === normF || normH.includes(normF) || normF.includes(normH);
          });
        });
      });
    }
    if (propertyTypeFilter.length > 0) {
      list = list.filter(h => propertyTypeFilter.includes(extractPropertyType(h)));
    }
    if (roomAmenitiesFilter.length > 0) {
      list = list.filter(h => {
        const ha = ((h as any).roomAmenities || []) as string[];
        return roomAmenitiesFilter.every(f => {
          const normF = normalizeForFilter(f);
          return ha.some(hamen => {
            const normH = normalizeForFilter(hamen);
            return normH === normF || normH.includes(normF) || normF.includes(normH);
          });
        });
      });
    }
    if (neighborhoodFilter.length > 0) {
      list = list.filter(h => neighborhoodFilter.includes(extractNeighborhood(h)));
    }
    Object.entries(landmarkDistances).forEach(([name, maxDist]) => {
      if (maxDist == null) return;
      const lm = landmarks.find(l => l.name === name);
      if (!lm) return;
      list = list.filter(h => {
        const lat = Number((h as any).lat);
        const lng = Number((h as any).lng);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;
        return haversineMiles(lm.lat, lm.lng, lat, lng) <= maxDist;
      });
    });
    if (sortBy === "price_asc") list.sort((a, b) => ((a as any).price || 0) - ((b as any).price || 0));
    else if (sortBy === "price_desc") list.sort((a, b) => ((b as any).price || 0) - ((a as any).price || 0));
    else if (sortBy === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [hotels, nameFilter, priceMax, starFilter, includeUnrated, guestRatingMin, brandFilter, freeCancellationOnly, mealPlanFilter, facilitiesFilter, propertyTypeFilter, roomAmenitiesFilter, neighborhoodFilter, landmarkDistances, landmarks, sortBy]);

  const dealBadges = useMemo(() => computeDealBadges(filteredHotels), [filteredHotels]);

  const toggleStarFilter = (star: number) => {
    setStarFilter(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);
  };
  const toggleBrandFilter = (brand: string) => {
    setBrandFilter(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };
  const toggleMealPlanLabel = (label: string) => {
    setMealPlanFilter(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };
  const toggleFacility = (facility: string) => {
    setFacilitiesFilter(prev => prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]);
  };
  const togglePropertyType = (type: string) => {
    setPropertyTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleRoomAmenity = (amenity: string) => {
    setRoomAmenitiesFilter(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };
  const toggleNeighborhood = (n: string) => {
    setNeighborhoodFilter(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  const getMealPlanCount = (codes: string[]) => {
    if (!hotels?.length) return 0;
    if (!codes.length) return 0;
    return hotels.filter(h => codes.includes((h as any).mealPlanCode)).length;
  };

  const isDefaultStarFilter = starFilter.length === 2 && starFilter.includes(4) && starFilter.includes(5);

  const activeFilterCount = (nameFilter ? 1 : 0) + (priceMax < priceRange.max ? 1 : 0) + starFilter.length + (includeUnrated ? 1 : 0) + (guestRatingMin ? 1 : 0) + brandFilter.length + (freeCancellationOnly ? 1 : 0) + mealPlanFilter.length + facilitiesFilter.length + propertyTypeFilter.length + roomAmenitiesFilter.length + neighborhoodFilter.length;

  const clearFilters = () => {
    setNameFilter("");
    setPriceMax(priceRange.max);
    setSortBy("rating");
    setStarFilter([]);
    setIncludeUnrated(false);
    setGuestRatingMin(null);
    setBrandFilter([]);
    setFreeCancellationOnly(false);
    setMealPlanFilter([]);
    setFacilitiesFilter([]);
    setPropertyTypeFilter([]);
    setRoomAmenitiesFilter([]);
    setNeighborhoodFilter([]);
    setLandmarkDistances({});
  };

  const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2000");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar centralSlot={isSearchActive ? searchHero : undefined} />

      {isSearchActive ? (
        <div className="flex-1 flex flex-col">
          <div 
            className="md:hidden flex items-center gap-2 px-4 py-3 bg-card border-b border-border text-sm cursor-pointer sticky top-[64px] z-30 shadow-sm"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => {
                const searchInput = document.querySelector('[data-testid="input-destination-mobile"]') as HTMLInputElement;
                if (searchInput) searchInput.focus();
              }, 100);
            }}
          >
            <Search className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold truncate text-foreground">{destination || (nearMe ? "Around my area" : "Your destination")}</span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-muted-foreground truncate">{dateLabel}</span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-muted-foreground whitespace-nowrap">{guests} {parseInt(guests) === 1 ? "Guest" : "Guests"}</span>
          </div>
          <div className="container mx-auto px-4 py-8 flex-1">
            <div className="flex gap-6">

              {/* ── Filter Sidebar ── */}
              <aside className="w-72 shrink-0 hidden lg:block">
                <div className="bg-white dark:bg-card border border-border rounded-xl sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">

                  {/* Show on Map thumbnail */}
                  {effectiveMapCenter && (
                    <SearchMapThumbnail
                      center={effectiveMapCenter}
                      hotelCount={filteredHotels.filter(h => {
                        const lat = Number((h as any).lat);
                        const lng = Number((h as any).lng);
                        return (h as any).lat != null && (h as any).lng != null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
                      }).length}
                      onClick={() => setViewMode("map")}
                    />
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <span className="text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center font-bold">{activeFilterCount}</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setForceExpand(v => v + 1)}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                        >
                          Open All
                        </button>
                        <span className="text-muted-foreground/30 text-[10px]">|</span>
                        <button 
                          onClick={() => setForceCollapse(v => v + 1)}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                        >
                          Close All
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      data-testid="button-clear-filters"
                    >
                      <X className="w-3 h-3" />
                      Clear filters
                    </button>
                  </div>

                  {/* 1. Property name */}
                  <FilterSection title="Property name" forceExpand={forceExpand} forceCollapse={forceCollapse}>
                    <input
                      type="text"
                      placeholder="e.g. Hilton, Bellagio…"
                      value={nameFilter}
                      onChange={e => setNameFilter(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      data-testid="input-filter-name"
                    />
                  </FilterSection>

                  {/* 2. Price (per night) */}
                  <FilterSection title="Price (per night)" forceExpand={forceExpand} forceCollapse={forceCollapse}>
                    <p className="text-xs text-muted-foreground mb-2">
                      US${priceRange.min} → {priceMax >= priceRange.max ? `US$${priceRange.max.toLocaleString()}+` : `US$${priceMax.toLocaleString()}`}
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
                  </FilterSection>

                  {/* 3. Popular filters */}
                  <FilterSection title="Popular filters" forceExpand={forceExpand} forceCollapse={forceCollapse}>
                    <div className="flex flex-col gap-2">
                      {([
                        { label: "Free cancellation", kind: "cancel" },
                        { label: "Parking", kind: "facility", value: "Parking" },
                        { label: "Breakfast included", kind: "facility", value: "Breakfast" },
                        { label: "Swimming pool", kind: "facility", value: "Pool" },
                        { label: "Free WiFi", kind: "facility", value: "Free WiFi" },
                        { label: "Hotels", kind: "type", value: "Hotel" },
                        { label: "Apartments", kind: "type", value: "Apartment" },
                      ] as { label: string; kind: string; value?: string }[]).map(item => {
                        const isChecked =
                          item.kind === "cancel" ? freeCancellationOnly :
                          item.kind === "type" ? propertyTypeFilter.includes(item.value!) :
                          facilitiesFilter.some(f => {
                            const n = normalizeForFilter(f);
                            const v = normalizeForFilter(item.value!);
                            return n === v || n.includes(v) || v.includes(n);
                          });
                        return (
                          <label key={item.label} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (item.kind === "cancel") { setFreeCancellationOnly(e.target.checked); }
                                else if (item.kind === "type") { togglePropertyType(item.value!); }
                                else {
                                  if (e.target.checked) setFacilitiesFilter(prev => [...prev, item.value!]);
                                  else setFacilitiesFilter(prev => prev.filter(f => {
                                    const n = normalizeForFilter(f); const v = normalizeForFilter(item.value!);
                                    return !(n === v || n.includes(v) || v.includes(n));
                                  }));
                                }
                              }}
                              className="accent-primary w-4 h-4 rounded"
                              data-testid={`checkbox-popular-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                            />
                            <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* 4. Distance from landmarks */}
                  {(landmarksLoading || landmarks.length > 0) && (
                    <FilterSection title="Distance from landmarks" forceExpand={forceExpand} forceCollapse={forceCollapse}>
                      {landmarksLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Detecting landmarks…</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {landmarks.map((lm) => {
                            const selected = landmarkDistances[lm.name] ?? null;
                            return (
                              <div key={lm.name} className="flex flex-col gap-1.5 py-1">
                                <span className="text-[11px] font-medium text-foreground leading-tight" title={lm.name}>{lm.name}</span>
                                <div className="flex gap-1 flex-wrap">
                                  {([0.5, 1, 2, 5] as const).map(miles => (
                                    <button
                                      key={miles}
                                      onClick={() => setLandmarkDistances(prev => ({ ...prev, [lm.name]: prev[lm.name] === miles ? null : miles }))}
                                      className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap transition-colors flex-1 text-center ${selected === miles ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 bg-background"}`}
                                      data-testid={`landmark-distance-${lm.name.toLowerCase().replace(/\s+/g, "-")}-${miles}`}
                                    >
                                      &lt;{miles}m
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </FilterSection>
                  )}

                  {/* 5. Reservation policy */}
                  <FilterSection title="Reservation policy" forceExpand={forceExpand} forceCollapse={forceCollapse}>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={freeCancellationOnly}
                        onChange={() => setFreeCancellationOnly(v => !v)}
                        className="accent-primary w-4 h-4 rounded"
                        data-testid="checkbox-free-cancellation"
                      />
                      <span className="text-sm text-foreground">Free cancellation</span>
                    </label>
                  </FilterSection>

                  {/* 6. Brand */}
                  {availableBrands.length > 0 && (
                    <FilterSection title="Brand" defaultOpen={false} forceExpand={forceExpand} forceCollapse={forceCollapse}>
                      <div className="flex flex-col gap-2">
                        {(showAllBrands ? availableBrands : availableBrands.slice(0, 9)).map(([brand, count]) => (
                          <label key={brand} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={brandFilter.includes(brand)}
                              onChange={() => toggleBrandFilter(brand)}
                              className="accent-primary w-4 h-4 rounded"
                              data-testid={`checkbox-brand-${brand}`}
                            />
                            <span className="text-sm text-foreground flex-1">{brand}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </label>
                        ))}
                      </div>
                      {availableBrands.length > 9 && (
                        <button onClick={() => setShowAllBrands(v => !v)} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-show-all-brands">
                          {showAllBrands ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {availableBrands.length}</>}
                        </button>
                      )}
                    </FilterSection>
                  )}

                  {/* 7. Property type */}
                  {availablePropertyTypes.length > 0 && (
                    <FilterSection title="Property type" defaultOpen={false} forceExpand={forceExpand} forceCollapse={forceCollapse}>
                      <div className="flex flex-col gap-2">
                        {(showAllPropertyTypes ? availablePropertyTypes : availablePropertyTypes.slice(0, 9)).map(([type, count]) => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={propertyTypeFilter.includes(type)}
                              onChange={() => togglePropertyType(type)}
                              className="accent-primary w-4 h-4 rounded"
                              data-testid={`checkbox-type-${type.toLowerCase().replace(/\s+/g, "-")}`}
                            />
                            <span className="text-sm text-foreground flex-1">{type}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </label>
                        ))}
                      </div>
                      {availablePropertyTypes.length > 9 && (
                        <button onClick={() => setShowAllPropertyTypes(v => !v)} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-show-all-types">
                          {showAllPropertyTypes ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {availablePropertyTypes.length}</>}
                        </button>
                      )}
                    </FilterSection>
                  )}

                  {/* 8. Star rating */}
                  <FilterSection title="Star rating" forceExpand={forceExpand} forceCollapse={forceCollapse}>
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
                        <input type="checkbox" checked={includeUnrated} onChange={() => setIncludeUnrated(v => !v)} className="accent-primary w-4 h-4 rounded" data-testid="checkbox-star-unrated" />
                        <span className="text-sm text-foreground">Unrated</span>
                      </label>
                    </div>
                  </FilterSection>

                  {/* 9. Meal plans */}
                  <FilterSection title="Meal plans" defaultOpen={false} forceExpand={forceExpand} forceCollapse={forceCollapse}>
                    <div className="flex flex-col gap-2">
                      {FIXED_MEAL_PLANS.map(opt => {
                        const count = getMealPlanCount(opt.codes);
                        return (
                          <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mealPlanFilter.includes(opt.label)}
                              onChange={() => toggleMealPlanLabel(opt.label)}
                              disabled={!opt.codes.length}
                              className="accent-primary w-4 h-4 rounded disabled:opacity-40"
                              data-testid={`checkbox-meal-${opt.label.toLowerCase().replace(/\s+/g, "-")}`}
                            />
                            <span className={`text-sm flex-1 ${!opt.codes.length ? "text-muted-foreground" : "text-foreground"}`}>{opt.label}</span>
                            {opt.codes.length > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
                          </label>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* 10. Guest rating */}
                  <FilterSection title="Guest rating" defaultOpen={false} forceExpand={forceExpand} forceCollapse={forceCollapse}>
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
                  </FilterSection>

                  {/* 11. Amenities */}
                  {availableRoomAmenities.length > 0 && (
                    <FilterSection title="Amenities" defaultOpen={false} forceExpand={forceExpand} forceCollapse={forceCollapse}>
                      <div className="flex flex-col gap-2">
                        {(showAllRoomAmenities ? availableRoomAmenities : availableRoomAmenities.slice(0, 9)).map(([amenity, count]) => (
                          <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roomAmenitiesFilter.includes(amenity)}
                              onChange={() => toggleRoomAmenity(amenity)}
                              className="accent-primary w-4 h-4 rounded"
                              data-testid={`checkbox-amenity-${amenity.toLowerCase().replace(/\s+/g, "-")}`}
                            />
                            <span className="text-sm text-foreground flex-1">{amenity}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </label>
                        ))}
                      </div>
                      {availableRoomAmenities.length > 9 && (
                        <button onClick={() => setShowAllRoomAmenities(v => !v)} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-show-all-amenities">
                          {showAllRoomAmenities ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {availableRoomAmenities.length}</>}
                        </button>
                      )}
                    </FilterSection>
                  )}

                  {/* 12. Facilities */}
                  {availableFacilities.length > 0 && (
                    <FilterSection title="Facilities" defaultOpen={false} forceExpand={forceExpand} forceCollapse={forceCollapse}>
                      <div className="flex flex-col gap-2">
                        {(showAllFacilities ? availableFacilities : availableFacilities.slice(0, 9)).map(([facility, count]) => (
                          <label key={facility} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={facilitiesFilter.some(f => {
                                const nf = normalizeForFilter(f); const nk = normalizeForFilter(facility);
                                return nf === nk || nf.includes(nk) || nk.includes(nf);
                              })}
                              onChange={() => toggleFacility(facility)}
                              className="accent-primary w-4 h-4 rounded"
                              data-testid={`checkbox-facility-${facility}`}
                            />
                            <span className="text-sm text-foreground flex-1">{facility}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </label>
                        ))}
                      </div>
                      {availableFacilities.length > 9 && (
                        <button onClick={() => setShowAllFacilities(v => !v)} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-show-all-facilities">
                          {showAllFacilities ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {availableFacilities.length}</>}
                        </button>
                      )}
                    </FilterSection>
                  )}

                  {/* 13. Neighborhood */}
                  {availableNeighborhoods.length > 0 && (
                    <FilterSection title="Neighborhood" defaultOpen={false} forceExpand={forceExpand} forceCollapse={forceCollapse}>
                      <div className="flex flex-col gap-2">
                        {(showAllNeighborhoods ? availableNeighborhoods : availableNeighborhoods.slice(0, 9)).map(([neighborhood, count]) => (
                          <label key={neighborhood} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={neighborhoodFilter.includes(neighborhood)}
                              onChange={() => toggleNeighborhood(neighborhood)}
                              className="accent-primary w-4 h-4 rounded"
                              data-testid={`checkbox-neighborhood-${neighborhood.toLowerCase().replace(/\s+/g, "-")}`}
                            />
                            <span className="text-sm text-foreground flex-1">{neighborhood}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </label>
                        ))}
                      </div>
                      {availableNeighborhoods.length > 9 && (
                        <button onClick={() => setShowAllNeighborhoods(v => !v)} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-show-all-neighborhoods">
                          {showAllNeighborhoods ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {availableNeighborhoods.length}</>}
                        </button>
                      )}
                    </FilterSection>
                  )}

                </div>
              </aside>

              {/* ── Results ── */}
              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base sm:text-xl font-bold font-heading line-clamp-2">
                      {aiSearch ? (
                        <>Vibe: <span className="text-primary capitalize">{aiSearch}</span></>
                      ) : nearMe ? (
                        <>Hotels <span className="text-primary">Near You</span></>
                      ) : (
                        <>Hotels in <span className="text-primary capitalize">{destination || "your destination"}</span></>
                      )}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-sm text-muted-foreground">
                        {(nearMe ? nearbyLoading : isLoading) ? "Searching…" : `${filteredHotels.length} properties found`}
                      </p>
                      {isDefaultStarFilter && !isLoading && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          Luxury & 4–5★ hotels
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

                  {/* Sort + View toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
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
                    {/* List / Map toggle */}
                    <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 bg-muted/30">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "list" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        data-testid="button-view-list"
                      >
                        <List className="w-3.5 h-3.5" />
                        List
                      </button>
                      <button
                        onClick={() => setViewMode("map")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "map" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        data-testid="button-view-map"
                      >
                        <MapIcon className="w-3.5 h-3.5" />
                        Map
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hotel list or Map */}
                {viewMode === "map" ? (
                  <SearchMapView
                    hotels={filteredHotels as any}
                    center={effectiveMapCenter}
                    currency="USD"
                    checkIn={checkIn || undefined}
                    checkOut={checkOut || undefined}
                    guests={guests}
                  />
                ) : isLoading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse border border-border rounded-xl overflow-hidden flex h-[180px] bg-card">
                        <div className="w-[220px] shrink-0 bg-muted" />
                        <div className="flex-1 p-4 flex flex-col justify-center space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                        <div className="w-[200px] shrink-0 p-4 border-l border-border flex flex-col items-end justify-center space-y-3">
                          <div className="h-4 bg-muted rounded w-1/2" />
                          <div className="h-10 bg-muted rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredHotels.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {filteredHotels.map((hotel) => (
                      <HotelListCard
                        key={hotel.id}
                        hotel={hotel as any}
                        dealBadge={dealBadges.get(hotel.id)?.type}
                        nights={nights}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 border border-border rounded-xl bg-card">
                    <p className="text-muted-foreground">No hotels match your filters.</p>
                    <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">Clear filters</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <section className="relative h-[650px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={heroImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
                <img src={heroImage} alt="Luxvibe Hero" className="w-full h-full object-cover ken-burns" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
              </motion.div>
            </AnimatePresence>
            <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-center text-center text-white pb-20">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-3xl">
                <h1 className="text-5xl sm:text-7xl font-bold font-heading mb-6 tracking-tight leading-[1.1]">Find your next <span className="text-primary italic">Vibe</span>.</h1>
                <p className="text-lg sm:text-xl text-white/90 mb-10 font-medium">Search for properties by destination or experience. Powered by AI.</p>
                <div className="w-full max-w-4xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
                  <SearchHero initialDestination={destination || undefined} initialGuests={guests} />
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-12 container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-heading">{t("home.featured_destinations")}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => scrollCarousel(carouselRef, "left")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm" data-testid="button-featured-prev"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => scrollCarousel(carouselRef, "right")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm" data-testid="button-featured-next"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            {featuredLoading ? (
              <div className="flex gap-5 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-none w-[calc(25%-15px)] h-[350px] bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (
              <div ref={carouselRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 px-4 -mx-4 scroll-px-4 carousel-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {featured?.map((hotel, i) => (
                  <motion.div key={hotel.id} className="flex-none w-[calc(25%-15px)] min-w-[240px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                    <HotelCard hotel={hotel} variant="featured" dealBadge={featuredDealBadges.get(hotel.id)?.type} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <DiscoverByVibe />

          {recentHotels.length > 0 && (
            <section className="pb-10 container mx-auto px-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold font-heading">Your Recent Searches</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => scrollCarousel(recentCarouselRef, "left")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-recent-prev"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => scrollCarousel(recentCarouselRef, "right")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" data-testid="button-recent-next"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div ref={recentCarouselRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 px-4 -mx-4 scroll-px-4 carousel-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {enrichedRecentHotels.map((hotel, i) => (
                  <motion.div key={hotel.id} className="flex-none w-[calc(25%-15px)] min-w-[240px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                    <HotelCard hotel={hotel} variant="featured" />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {geoStatus !== "denied" && (
            <section className="pb-10 container mx-auto px-4">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold font-heading">{t("home.nearby")}</h2>
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
                <div ref={nearbyCarouselRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-2 px-4 -mx-4 scroll-px-4 carousel-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {nearbyHotels.map((hotel, i) => (
                    <motion.div key={hotel.id} className="flex-none w-[calc(25%-15px)] min-w-[240px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                      <HotelCard hotel={hotel} variant="featured" dealBadge={nearbyDealBadges.get(hotel.id)?.type} />
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

          <section className="py-5 bg-muted/30 border-t border-border">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { icon: "🔒", title: "Secure Booking", desc: "Enterprise-grade security for payments & data." },
                  { icon: "🕐", title: "24/7 Support", desc: "Help available round the clock, anytime." },
                  { icon: "💰", title: "Best Price Guarantee", desc: "We'll match any lower price you find." },
                  { icon: "✨", title: "Handpicked Hotels", desc: "Every property vetted for quality & comfort." },
                ].map((f, i) => (
                  <div key={f.title} className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{f.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground leading-tight">{f.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

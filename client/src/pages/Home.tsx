import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { SearchHero } from "@/components/SearchHero";
import { HotelCard } from "@/components/HotelCard";
import { useSearchHotels, useFeaturedHotels, useNearbyHotels } from "@/hooks/use-hotels";
import { Loader2, ArrowUpDown, LocateFixed, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

const POPULAR_DESTINATIONS = [
  { label: "New York", emoji: "🗽" },
  { label: "Miami", emoji: "🌊" },
  { label: "Las Vegas", emoji: "🎰" },
  { label: "Los Angeles", emoji: "🎬" },
  { label: "Chicago", emoji: "🌆" },
  { label: "San Francisco", emoji: "🌉" },
  { label: "Orlando", emoji: "🎡" },
  { label: "Nashville", emoji: "🎸" },
  { label: "Paris", emoji: "🗼" },
  { label: "Dubai", emoji: "🏙️" },
  { label: "New Orleans", emoji: "🎷" },
  { label: "Honolulu", emoji: "🌺" },
];

type SortOption = "recommended" | "price_asc" | "price_desc" | "rating";

export default function Home() {
  const [currentPath, setLocation] = useLocation();
  const searchString = currentPath.includes("?") ? currentPath.split("?")[1] : window.location.search.slice(1);
  const searchParams = new URLSearchParams(searchString);

  const destination = searchParams.get("destination");
  const placeId = searchParams.get("placeId");
  const aiSearch = searchParams.get("aiSearch");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests") || "2";

  const isSearchActive = !!((destination || placeId || aiSearch) && checkIn && checkOut);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

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
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const { data: nearbyHotels, isLoading: nearbyLoading } = useNearbyHotels(coords);

  const sortedHotels = useMemo(() => {
    if (!hotels) return [];
    const copy = [...hotels];
    if (sortBy === "price_asc") return copy.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") return copy.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return copy;
  }, [hotels, sortBy]);

  const handleDestinationClick = (dest: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const params = new URLSearchParams({
      destination: dest,
      checkIn: fmt(tomorrow),
      checkOut: fmt(dayAfter),
      guests,
    });
    setLocation(`/?${params.toString()}`);
  };

  const sortLabel: Record<SortOption, string> = {
    recommended: "Recommended",
    price_asc: "Price: Low to High",
    price_desc: "Price: High to Low",
    rating: "Top Rated",
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

      {isSearchActive ? (
        <section className="py-10 container mx-auto px-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold font-heading">
                {aiSearch ? (
                  <>Vibe search: <span className="text-primary capitalize">{aiSearch}</span></>
                ) : (
                  <>Hotels in <span className="text-primary capitalize">{destination || "your destination"}</span></>
                )}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {sortedHotels.length} properties found
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-sort">
                  <ArrowUpDown className="w-4 h-4" />
                  {sortLabel[sortBy]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <DropdownMenuRadioItem value="recommended">Recommended</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price_asc">Price: Low to High</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price_desc">Price: High to Low</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rating">Top Rated</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
              <p className="text-destructive font-medium mb-2">{(error as Error).message || "Something went wrong."}</p>
              <p className="text-sm text-muted-foreground">Try adding the country, e.g. "Paris, France".</p>
            </div>
          ) : sortedHotels.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
              <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
              <p className="text-muted-foreground">Try adjusting your dates or destination.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedHotels.map((hotel, i) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                >
                  <HotelCard
                    hotel={hotel}
                    checkIn={checkIn || undefined}
                    checkOut={checkOut || undefined}
                    guests={guests}
                    variant="search"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Popular Destinations */}
          <section className="py-8 container mx-auto px-4">
            <h2 className="text-2xl font-bold font-heading mb-4">Popular Destinations</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest.label}
                  onClick={() => handleDestinationClick(dest.label)}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm"
                  data-testid={`button-dest-${dest.label.toLowerCase().replace(" ", "-")}`}
                >
                  <span className="shrink-0">{dest.emoji}</span>
                  <span className="truncate">{dest.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Featured / Recommended Hotels */}
          <section className="pb-10 container mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold font-heading">Recommended Hotels</h2>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm mr-1">Handpicked for you</span>
                <button
                  onClick={() => scrollCarousel(carouselRef, "left")}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                  data-testid="button-carousel-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCarousel(carouselRef, "right")}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  data-testid="button-carousel-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {featuredLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : (
              <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto scroll-smooth pb-2 carousel-scroll"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {featured?.map((hotel, i) => (
                  <motion.div
                    key={hotel.id}
                    className="flex-none w-[calc(25%-15px)] min-w-[240px]"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                  >
                    <HotelCard hotel={hotel} variant="featured" />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Recently Viewed Hotels */}
          {recentHotels.length > 0 && (
            <section className="pb-10 container mx-auto px-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold font-heading">Your recent searches</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollCarousel(recentCarouselRef, "left")}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    data-testid="button-recent-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(recentCarouselRef, "right")}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    data-testid="button-recent-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div
                ref={recentCarouselRef}
                className="flex gap-5 overflow-x-auto scroll-smooth pb-2 carousel-scroll"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {recentHotels.map((hotel, i) => (
                  <motion.div
                    key={hotel.id}
                    className="flex-none w-[calc(25%-15px)] min-w-[240px]"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                  >
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
                <h2 className="text-2xl font-bold font-heading">Hotels Near You</h2>
                <div className="flex items-center gap-2">
                  {(geoStatus === "granted" && nearbyHotels && nearbyHotels.length > 0) && (
                    <span className="text-muted-foreground text-sm mr-1">{nearbyHotels.length} properties nearby</span>
                  )}
                  {(geoStatus === "idle" || geoStatus === "loading") && (
                    <span className="text-muted-foreground text-sm mr-1">Finding your location…</span>
                  )}
                  <button
                    onClick={() => scrollCarousel(nearbyCarouselRef, "left")}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    data-testid="button-nearby-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(nearbyCarouselRef, "right")}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    data-testid="button-nearby-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {geoStatus === "idle" || geoStatus === "loading" ? (
                <div className="flex items-center justify-center h-40 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Detecting your location…</p>
                  </div>
                </div>
              ) : nearbyLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : nearbyHotels && nearbyHotels.length > 0 ? (
                <div
                  ref={nearbyCarouselRef}
                  className="flex gap-5 overflow-x-auto scroll-smooth pb-2 carousel-scroll"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {nearbyHotels.map((hotel, i) => (
                    <motion.div
                      key={hotel.id}
                      className="flex-none w-[calc(25%-15px)] min-w-[240px]"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35 }}
                    >
                      <HotelCard hotel={hotel} variant="featured" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm mb-3">No hotels found near your location.</p>
                    <Button variant="outline" size="sm" onClick={requestLocation} className="gap-2" data-testid="button-retry-location">
                      <LocateFixed className="w-4 h-4" />
                      Try Again
                    </Button>
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
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm"
                >
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

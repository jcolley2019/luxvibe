import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HotelCard } from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Link } from "wouter";

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewedHotels") || "[]");
        const favs = recentlyViewed.filter((hotel: any) =>
          localStorage.getItem(`wishlist_${hotel.id}`) === "1"
        );
        setFavorites(favs);
      } catch (e) {
        console.error("Failed to load favorites", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
    window.addEventListener("storage", loadFavorites);
    return () => window.removeEventListener("storage", loadFavorites);
  }, []);

  const filtered = search.trim()
    ? favorites.filter((h) => h.name?.toLowerCase().includes(search.toLowerCase()))
    : favorites;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-foreground">Favourite properties</h1>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Property name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg"
              data-testid="input-favorites-search"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 opacity-25">
              <svg width="80" height="64" viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="16" width="72" height="44" rx="3" stroke="currentColor" strokeWidth="3"/>
                <rect x="14" y="28" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="2.5"/>
                <rect x="34" y="28" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="2.5"/>
                <rect x="54" y="28" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M14 60V46h52v14" stroke="currentColor" strokeWidth="2.5"/>
                <rect x="32" y="46" width="16" height="14" rx="1" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M4 24L40 4l36 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              No favourite properties for the moment.
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Please explore our selection of hotels and save your favourites as you explore.
            </p>
            <Link href="/">
              <Button className="rounded-full px-8" data-testid="button-explore-hotels">
                Explore Hotels
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

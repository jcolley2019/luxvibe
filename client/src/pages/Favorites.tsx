import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HotelCard } from "@/components/HotelCard";
import { Loader2, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Favorites() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <h1 className="text-3xl font-bold font-heading">My Favorites</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Start exploring and tap the heart icon on properties you love to save them here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

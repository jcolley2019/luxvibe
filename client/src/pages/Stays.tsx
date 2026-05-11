import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Home, Building2, Trees, Waves, Mountain, Castle, Ship, Tent,
  Search, MapPin, Star, Heart, ChevronRight, Sparkles, Coffee,
  Loader2, Users, BedDouble, ArrowRight,
} from "lucide-react";
import { useFavorites } from "@/context/favorites";

const PROPERTY_CATEGORIES = [
  {
    id: "apartments",
    label: "Apartments",
    icon: Building2,
    description: "Private flats in the heart of the city",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    color: "from-blue-500/20 to-blue-600/10",
    searchQuery: "luxury city apartment private kitchen entire flat",
  },
  {
    id: "villas",
    label: "Villas",
    icon: Home,
    description: "Exclusive private homes with pools",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80",
    color: "from-emerald-500/20 to-emerald-600/10",
    searchQuery: "private luxury villa pool garden exclusive retreat",
  },
  {
    id: "chalets",
    label: "Chalets",
    icon: Mountain,
    description: "Cozy mountain retreats with fireplaces",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
    color: "from-amber-500/20 to-amber-600/10",
    searchQuery: "mountain chalet cozy fireplace ski winter retreat",
  },
  {
    id: "beachhouses",
    label: "Beach Houses",
    icon: Waves,
    description: "Steps from the shore",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80",
    color: "from-cyan-500/20 to-cyan-600/10",
    searchQuery: "beachfront house ocean view private home seaside",
  },
  {
    id: "cottages",
    label: "Cottages",
    icon: Trees,
    description: "Peaceful countryside escapes",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80",
    color: "from-green-500/20 to-green-600/10",
    searchQuery: "country cottage garden rural peaceful nature retreat",
  },
  {
    id: "unique",
    label: "Unique Stays",
    icon: Sparkles,
    description: "Castles, boats & treehouses",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&q=80",
    color: "from-purple-500/20 to-purple-600/10",
    searchQuery: "unique treehouse houseboat castle boat extraordinary accommodation",
  },
];

const FEATURED_DESTINATIONS = [
  { city: "Tuscany", country: "Italy", image: "https://images.unsplash.com/photo-1543158266-0066955047b1?w=400&q=80", tag: "Villas" },
  { city: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80", tag: "Cave Houses" },
  { city: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80", tag: "Villas" },
  { city: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80", tag: "Apartments" },
  { city: "Maldives", country: "Maldives", image: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=400&q=80", tag: "Overwater Villas" },
  { city: "Swiss Alps", country: "Switzerland", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", tag: "Chalets" },
];

interface StayProperty {
  id: string;
  name: string;
  imageUrl?: string;
  address?: string;
  rating?: number | null;
  stars?: number | null;
  story?: string;
  style?: string;
  persona?: string;
  semanticTags?: string[];
}

function StayCard({ property, checkIn, checkOut }: { property: StayProperty; checkIn: string; checkOut: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isWishlisted = isFavorite(property.id);

  const params = new URLSearchParams({ checkIn, checkOut, guests: "2" });
  const href = `/hotel/${property.id}?${params.toString()}`;

  const fallback = `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80`;

  return (
    <Link href={href} data-testid={`card-stay-${property.id}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted mb-3">
          <img
            src={property.imageUrl || fallback}
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
          />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(property as any); }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            data-testid={`button-wishlist-stay-${property.id}`}
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
          </button>
          {property.style && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-white/90 text-foreground text-[10px] font-medium backdrop-blur-sm border-0 shadow">
                {property.style}
              </Badge>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {property.name}
          </h3>
          {property.address && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {property.address}
            </p>
          )}
          {property.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-foreground">{property.rating.toFixed(1)}</span>
            </div>
          )}
          {property.story && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{property.story}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function CategorySection({ category, checkIn, checkOut }: {
  category: typeof PROPERTY_CATEGORIES[0];
  checkIn: string;
  checkOut: string;
}) {
  const { data, isLoading } = useQuery<{ properties: StayProperty[] }>({
    queryKey: ["/api/stays/category", category.id],
    queryFn: async () => {
      const res = await fetch(`/api/stays/category?id=${category.id}&limit=12`);
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  const properties = data?.properties || [];

  return (
    <section className="py-10 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
            <category.icon className="w-5 h-5 text-foreground/70" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{category.label}</h2>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </div>
        </div>
        <Link href={`/?aiSearch=${encodeURIComponent(category.searchQuery)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&allStars=1`}>
          <Button variant="ghost" size="sm" className="gap-1 text-primary hidden sm:flex">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {properties.map((p) => (
            <StayCard key={p.id} property={p} checkIn={checkIn} checkOut={checkOut} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <category.icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No {category.label.toLowerCase()} found right now
        </div>
      )}
    </section>
  );
}

export default function Stays() {
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");

  const today = new Date();
  const checkIn = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const checkOut = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setLocation(`/?destination=${encodeURIComponent(searchValue)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&allStars=1`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="relative min-h-[520px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80"
            alt="Luxury villa with pool"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        </div>

        <div className="relative w-full pb-16 pt-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-medium px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Homes, Villas & Unique Stays
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4 leading-tight">
                Your home<br />away from home
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-lg">
                Entire apartments, private villas, cozy chalets, and extraordinary spaces — booked in seconds.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Where do you want to stay?"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-11 h-12 rounded-2xl bg-white text-foreground border-0 shadow-lg text-sm"
                    data-testid="input-stays-search"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6 rounded-2xl shadow-lg font-semibold">
                  Search
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 max-w-6xl">

        {/* Category tiles */}
        <section className="py-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse by type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PROPERTY_CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/?aiSearch=${encodeURIComponent(cat.searchQuery)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&allStars=1`}>
                <div className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer" data-testid={`category-${cat.id}`}>
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <cat.icon className="w-3.5 h-3.5 text-white/90" />
                    </div>
                    <p className="text-white font-bold text-sm leading-tight">{cat.label}</p>
                    <p className="text-white/70 text-[10px] line-clamp-1 mt-0.5">{cat.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Property category sections */}
        {PROPERTY_CATEGORIES.map((cat) => (
          <CategorySection key={cat.id} category={cat} checkIn={checkIn} checkOut={checkOut} />
        ))}

        {/* Featured destinations */}
        <section className="py-12 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dreamy destinations</h2>
              <p className="text-sm text-muted-foreground mt-1">Explore homes and villas in the world's most beautiful places</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {FEATURED_DESTINATIONS.map((dest) => (
              <Link
                key={dest.city}
                href={`/?destination=${encodeURIComponent(dest.city + ', ' + dest.country)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2&allStars=1`}
                data-testid={`destination-${dest.city.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer">
                  <img
                    src={dest.image}
                    alt={dest.city}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-sm leading-tight">{dest.city}</p>
                    <p className="text-white/70 text-[10px]">{dest.tag}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Why stays section */}
        <section className="py-12 border-t border-border mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Why book a stay?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: Home,
                title: "Entire spaces, all to yourself",
                desc: "Private kitchens, living rooms, and bedrooms — no shared hallways or lobbies.",
                color: "text-blue-500",
                bg: "bg-blue-50 dark:bg-blue-950/30",
              },
              {
                icon: Coffee,
                title: "Live like a local",
                desc: "Settle into a neighborhood, shop at the local market, and wake up on your own schedule.",
                color: "text-emerald-500",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
              },
              {
                icon: Users,
                title: "Perfect for groups",
                desc: "More room, more flexibility, and often better value when travelling with friends or family.",
                color: "text-amber-500",
                bg: "bg-amber-50 dark:bg-amber-950/30",
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

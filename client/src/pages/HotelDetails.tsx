import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useHotel, useSimilarHotels, useHotelReviews } from "@/hooks/use-hotels";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2, MapPin, ChevronLeft, Heart, Camera, Star,
  Wifi, Coffee, Car, Dumbbell, Utensils, Waves, Sparkles, ChevronLeft as Prev, ChevronRight as Next,
  Building2, Briefcase, Plane, ShowerHead, Wind, Bed, ConciergeBell, Lock,
  Beer, Clock, Accessibility, Leaf, Zap, Send, X, Check, Info, AlertCircle,
  BedDouble, Users, Maximize2, ChevronRight, CalendarDays
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const GALLERY_FALLBACKS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800&q=80",
  "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&q=80",
];

const FACILITY_ICONS: Record<string, any> = {
  "Restaurant": Utensils, "Parking": Car, "Fitness Center": Dumbbell, "Free WiFi": Wifi,
  "Breakfast": Coffee, "Pool": Waves, "Spa": Sparkles, "Bar": Beer,
  "Room Service": ConciergeBell, "Elevator": Building2, "Airport Shuttle": Plane,
  "Business Center": Briefcase, "24-hour Front Desk": Clock, "Non-Smoking Rooms": Leaf,
  "Laundry": ShowerHead, "Air Conditioning": Wind, "Pet Friendly": Leaf,
  "Currency Exchange": Lock, "Luggage Storage": Briefcase, "Concierge": ConciergeBell,
  "Daily Housekeeping": Bed, "Family Rooms": Building2, "Accessible": Accessibility,
  "EV Charging": Zap, "Sauna": ShowerHead,
};

type TabId = "overview" | "facilities" | "rooms" | "reviews" | "description" | "ask-ai";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "facilities", label: "Facilities" },
  { id: "rooms", label: "Rooms" },
  { id: "reviews", label: "Reviews" },
  { id: "description", label: "Description" },
  { id: "ask-ai", label: "Ask AI" },
];

function getRatingLabel(r: number) {
  if (r >= 9.5) return "Exceptional";
  if (r >= 9.0) return "Superb";
  if (r >= 8.5) return "Fabulous";
  if (r >= 8.0) return "Very Good";
  if (r >= 7.0) return "Good";
  return "Okay";
}

function getRatingColor(r: number) {
  if (r >= 8.5) return "bg-emerald-600";
  if (r >= 7.5) return "bg-emerald-500";
  if (r >= 7.0) return "bg-blue-500";
  return "bg-amber-500";
}

function getBarColor(score: number) {
  return score >= 8.0 ? "bg-emerald-500" : "bg-amber-400";
}

function generateCategoryScores(rating: number) {
  const vary = (offset: number) =>
    Math.min(10, Math.max(5.0, parseFloat((rating + offset).toFixed(1))));
  return [
    { name: "Cleanliness", score: vary(-0.5) },
    { name: "Service", score: vary(0.5) },
    { name: "Location", score: vary(0.8) },
    { name: "Room Quality", score: vary(-0.2) },
    { name: "Amenities", score: vary(0.2) },
    { name: "Value for Money", score: vary(-1.0) },
    { name: "Food and Beverage", score: vary(-0.3) },
    { name: "Overall Experience", score: vary(0) },
  ];
}

function generateHighlights(name: string, description: string, amenities: string[]) {
  const desc = description.toLowerCase();
  const lower = (s: string) => s.toLowerCase();
  const highlights: { icon: string; title: string; text: string }[] = [];

  const locationWords = ["downtown", "heart of", "steps from", "near", "waterfront", "beachfront", "park", "views", "view", "central", "walking distance"];
  const diningWords = ["restaurant", "dining", "cuisine", "michelin", "culinary", "gastronomy", "breakfast"];
  const wellnessWords = ["spa", "pool", "fitness", "wellness", "sauna", "indoor pool", "treatments"];
  const businessWords = ["business", "conference", "meeting", "event", "corporate"];

  if (locationWords.some(w => desc.includes(w))) {
    const sentences = description.split(/[.!]/);
    const match = sentences.find(s => locationWords.some(w => lower(s).includes(w))) || "";
    highlights.push({
      icon: "📍",
      title: "Prime Location",
      text: match.trim() || `${name} is ideally located for exploring the surrounding area and top attractions.`,
    });
  }

  if (diningWords.some(w => desc.includes(w)) || amenities.some(a => diningWords.some(w => lower(a).includes(w)))) {
    highlights.push({
      icon: "🍽️",
      title: "Exceptional Dining",
      text: `Indulge in exquisite cuisine at ${name}'s acclaimed restaurants, where expertly crafted menus and impeccable service create unforgettable dining experiences.`,
    });
  }

  if (wellnessWords.some(w => desc.includes(w)) || amenities.some(a => wellnessWords.some(w => lower(a).includes(w)))) {
    highlights.push({
      icon: "🧖",
      title: "Luxury Wellness",
      text: `Rejuvenate at the hotel's world-class spa and wellness facilities, featuring premium treatments and amenities designed for ultimate relaxation.`,
    });
  }

  if (businessWords.some(w => desc.includes(w)) || amenities.some(a => businessWords.some(w => lower(a).includes(w)))) {
    highlights.push({
      icon: "💼",
      title: "Business Ready",
      text: `${name} offers state-of-the-art conference facilities and business services, making it the ideal destination for both corporate events and productive stays.`,
    });
  }

  while (highlights.length < 3) {
    const fallbacks = [
      { icon: "🏨", title: "Exceptional Comfort", text: `${name} offers meticulously appointed rooms and suites combining timeless elegance with modern amenities for the perfect luxury retreat.` },
      { icon: "⭐", title: "Award-Winning Service", text: `Experience the hallmark of luxury hospitality with ${name}'s dedicated staff, committed to ensuring every moment of your stay exceeds expectations.` },
      { icon: "🌆", title: "Stunning Views", text: `Enjoy breathtaking vistas from the comfort of beautifully designed rooms and suites at ${name}, creating unforgettable memories.` },
    ];
    const next = fallbacks[highlights.length % fallbacks.length];
    if (!highlights.find(h => h.title === next.title)) highlights.push(next);
    else break;
  }

  return highlights.slice(0, 3);
}

function generateReviews(rating: number) {
  const highScoreReviews = [
    { name: "Emily", type: "couple", date: "Fri, 14 Feb", score: 10, title: "Absolutely perfect stay", text: "From the moment we arrived, everything was flawless. The staff were incredibly attentive and the room was stunning. We'll definitely be back." },
    { name: "James", type: "solo traveller", date: "Thu, 13 Feb", score: 9, title: "Outstanding in every way", text: "The service was exceptional and the facilities are truly world-class. Highly recommend to anyone looking for a luxury experience." },
    { name: "Sophie", type: "couple", date: "Wed, 12 Feb", score: 10, title: "Unforgettable experience", text: "Fantastic" },
    { name: "Marcus", type: "business", date: "Mon, 10 Feb", score: 9, title: "", text: "Excellent location and very comfortable rooms. The breakfast was superb and the staff were always helpful. Perfect for business travel." },
  ];
  const midScoreReviews = [
    { name: "David", type: "couple", date: "Fri, 13 Feb", score: 8, title: "Very good stay overall", text: "Great location and comfortable rooms. Service was friendly. Some minor issues with noise but overall a positive experience." },
    { name: "Kymberlee", type: "couple", date: "Thu, 12 Feb", score: 9, title: "", text: "Fantastic" },
    { name: "John", type: "solo traveller", date: "Wed, 11 Feb", score: 7, title: "Everything was good except the breakfast", text: "The breakfast was very poor. Each item was cold and I was really unhappy with it. The room itself was comfortable though." },
    { name: "MOTOKI", type: "solo traveller", date: "Tue, 11 Feb", score: 7, title: "", text: "Decent hotel in a great location. Room was clean and staff polite. Value for money could be better." },
  ];
  return rating >= 8.5 ? highScoreReviews : midScoreReviews;
}

function getGallery(hotelId: string, images: string[]) {
  let hash = 0;
  for (let i = 0; i < hotelId.length; i++) hash = (hash * 31 + hotelId.charCodeAt(i)) & 0xffffffff;
  const gallery = [...images];
  let fi = Math.abs(hash) % GALLERY_FALLBACKS.length;
  while (gallery.length < 5) {
    gallery.push(GALLERY_FALLBACKS[fi % GALLERY_FALLBACKS.length]);
    fi++;
  }
  return gallery.slice(0, 5);
}

export default function HotelDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const guestsParam = searchParams.get("guests") || "2";
  const reviewCountParam = searchParams.get("reviewCount") ? parseInt(searchParams.get("reviewCount")!) : null;

  const defaultCheckIn = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const defaultCheckOut = format(addDays(new Date(), 2), "yyyy-MM-dd");

  const [checkIn, setCheckIn] = useState(checkInParam || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(checkOutParam || defaultCheckOut);
  const [guests] = useState(guestsParam);
  const [dateOpen, setDateOpen] = useState(false);
  const dateRange = {
    from: parseISO(checkIn),
    to: parseISO(checkOut),
  };

  const { data: hotel, isLoading, error } = useHotel(id!, { checkIn, checkOut, guests });
  const effectiveReviewCount = hotel?.reviewCount ?? reviewCountParam;
  const { data: similarHotels = [] } = useSimilarHotels(id!);
  const { data: realReviews = [], isLoading: reviewsLoading } = useHotelReviews(id!);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [wishlist, setWishlist] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [similarIdx, setSimilarIdx] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const groupedRooms = useMemo(() => {
    if (!hotel) return [];
    const groups: Record<string, typeof hotel.roomTypes> = {};
    hotel.roomTypes.forEach(rate => {
      if (!groups[rate.mappedRoomId]) groups[rate.mappedRoomId] = [];
      groups[rate.mappedRoomId].push(rate);
    });
    return Object.entries(groups).map(([mappedRoomId, rates]) => {
      const roomInfo = hotel.rooms.find(r => r.id === mappedRoomId);
      // Primary: room data photos (if IDs match); Secondary: server-matched photos from rate; Fallback: hotel exterior
      const photos = (roomInfo?.photos || (rates[0] as any)?.photos || []).map((p: any) => p.url).filter(Boolean);
      if (photos.length === 0) photos.push(hotel.images[0] || GALLERY_FALLBACKS[0]);
      return {
        mappedRoomId,
        name: roomInfo?.name || rates[0]?.name || "Standard Room",
        photos,
        description: roomInfo?.description || null,
        amenities: roomInfo?.amenities || [],
        bedTypes: roomInfo?.bedTypes || [],
        roomSize: roomInfo?.roomSize || null,
        maxOccupancy: roomInfo?.maxOccupancy || null,
        rates,
      };
    });
  }, [hotel]);

  const [roomPhotoIdxMap, setRoomPhotoIdxMap] = useState<Record<string, number>>({});
  const [expandedDescMap, setExpandedDescMap] = useState<Record<string, boolean>>({});
  const getRoomPhotoIdx = (id: string) => roomPhotoIdxMap[id] ?? 0;
  const setRoomPhotoIdx = (id: string, idx: number) =>
    setRoomPhotoIdxMap(prev => ({ ...prev, [id]: idx }));

  const sectionRefs: Record<TabId, React.RefObject<HTMLDivElement>> = {
    overview: useRef<HTMLDivElement>(null),
    facilities: useRef<HTMLDivElement>(null),
    rooms: useRef<HTMLDivElement>(null),
    reviews: useRef<HTMLDivElement>(null),
    description: useRef<HTMLDivElement>(null),
    "ask-ai": useRef<HTMLDivElement>(null),
  };

  const navRef = useRef<HTMLDivElement>(null);
  const [navSticky, setNavSticky] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!hotel) return;
    try {
      const entry = {
        id: hotel.id,
        name: hotel.name,
        address: hotel.address || "",
        city: hotel.city || "",
        stars: hotel.stars ?? null,
        rating: hotel.rating ?? null,
        reviewCount: hotel.reviewCount ?? null,
        price: hotel.roomTypes?.[0]?.price ?? null,
        imageUrl: hotel.images?.[0] ?? null,
      };
      const existing = JSON.parse(localStorage.getItem("recentlyViewedHotels") || "[]");
      const filtered = existing.filter((h: typeof entry) => h.id !== hotel.id);
      localStorage.setItem("recentlyViewedHotels", JSON.stringify([entry, ...filtered].slice(0, 10)));
    } catch {}
  }, [hotel?.id]);

  useEffect(() => {
    const onScroll = () => {
      const navTop = navRef.current?.getBoundingClientRect().top ?? 0;
      setNavSticky(navTop <= 64);

      let current: TabId = "overview";
      for (const tab of TABS) {
        const el = sectionRefs[tab.id].current;
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) current = tab.id;
        }
      }
      setActiveTab(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (tab: TabId) => {
    setActiveTab(tab);
    const el = sectionRefs[tab].current;
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleAiSubmit = (question?: string) => {
    const q = question || aiInput;
    if (!q.trim() || !hotel) return;
    setAiInput(q);
    const desc = hotel.description.toLowerCase();
    const amenities = hotel.amenities.join(", ");
    let answer = "";
    if (/park|parking/i.test(q)) {
      answer = hotel.amenities.includes("Parking")
        ? `Yes, ${hotel.name} offers parking facilities. Please contact the hotel for rates and availability.`
        : `Parking information is not listed for ${hotel.name}. We recommend contacting the hotel directly.`;
    } else if (/wifi|internet/i.test(q)) {
      answer = hotel.amenities.includes("Free WiFi")
        ? `Yes, ${hotel.name} offers complimentary Free WiFi throughout the property.`
        : `WiFi availability is not confirmed. Please check with the hotel directly.`;
    } else if (/pool|swim/i.test(q)) {
      answer = hotel.amenities.includes("Pool")
        ? `${hotel.name} features a swimming pool for guests to enjoy.`
        : `A pool is not listed in the hotel's facilities. Please contact the hotel for more information.`;
    } else if (/restaurant|dining|food|eat/i.test(q)) {
      answer = hotel.amenities.some(a => ["Restaurant", "Bar", "Breakfast"].includes(a))
        ? `${hotel.name} offers dining options including: ${hotel.amenities.filter(a => ["Restaurant", "Bar", "Breakfast"].includes(a)).join(", ")}.`
        : `Dining information: ${desc.includes("restaurant") ? "The hotel has restaurant facilities on-site." : "Please contact the hotel for dining options."}`;
    } else if (/amenities|facilities/i.test(q)) {
      answer = `${hotel.name} offers the following facilities: ${amenities}.`;
    } else {
      const sentences = hotel.description.split(/[.!?]/).filter(s => s.length > 20);
      const match = sentences.find(s => q.split(" ").some(w => w.length > 3 && s.toLowerCase().includes(w.toLowerCase())));
      answer = match ? match.trim() + "." : `For detailed information about "${q}", we recommend contacting ${hotel.name} directly or checking their official website.`;
    }
    setAiAnswer(answer);
    setAiInput("");
  };

  const handleSelectRate = (rate: any) => {
    const params = new URLSearchParams({
      offerId: rate.offerId,
      hotelId: hotel!.id,
      hotelName: hotel!.name,
      checkIn,
      checkOut,
      guests,
      roomName: rate.name,
      price: rate.price.toString(),
      currency: rate.currency
    });
    setLocation(`/checkout?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-destructive">Hotel not found</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const gallery = getGallery(hotel.id, hotel.images);
  const highlights = generateHighlights(hotel.name, hotel.description, hotel.amenities);
  const categoryScores = hotel.rating ? generateCategoryScores(hotel.rating) : [];
  const reviews = realReviews.length > 0 ? realReviews : (hotel.rating ? generateReviews(hotel.rating) : []);
  const usingRealReviews = realReviews.length > 0;
  const nights = differenceInDays(parseISO(checkOut), parseISO(checkIn)) || 1;
  const noRooms = groupedRooms.length === 0;

  const visibleSimilar = similarHotels.slice(similarIdx, similarIdx + 3);

  const starCount = hotel.stars ? Math.round(hotel.stars) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-4 pb-20 max-w-5xl">
        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          data-testid="button-back"
        >
          <ChevronLeft className="w-4 h-4" />
          See all properties
        </button>

        {/* Hotel Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold font-heading">{hotel.name}</h1>
              {starCount && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: starCount }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {hotel.address}
              <span className="mx-1">·</span>
              <button className="underline underline-offset-2 hover:text-foreground transition-colors">Show Map</button>
            </p>
          </div>
          <button
            onClick={() => setWishlist(!wishlist)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-sm font-medium hover:bg-muted transition-colors shrink-0"
            data-testid="button-wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlist ? "fill-red-500 text-red-500" : ""}`} />
            {wishlist ? "Saved" : "Save"}
          </button>
        </div>

        {/* Photo Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[380px] rounded-xl overflow-hidden mb-0 relative">
          <div className="col-span-2 row-span-2 overflow-hidden cursor-pointer" onClick={() => { setLightboxIdx(0); setShowAllPhotos(true); }}>
            <img src={gallery[0]} alt="Main" className="w-full h-full object-cover ken-burns" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="col-span-1 row-span-1 overflow-hidden group cursor-pointer relative"
              onClick={() => { setLightboxIdx(i); setShowAllPhotos(true); }}
            >
              <img src={gallery[i]} alt={`View ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {i === 4 && (
                <div className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors flex items-center justify-center">
                  <span className="text-white text-sm font-medium flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    {hotel.images.length > 5 ? `+${hotel.images.length - 4} photos` : "Show all pictures"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sticky Nav Tabs */}
        <div
          ref={navRef}
          className={`sticky top-16 z-30 bg-background border-b border-border flex items-center justify-between py-0 mt-0 -mx-4 px-4 transition-shadow ${navSticky ? "shadow-sm" : ""}`}
        >
          <div className="flex items-center gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                data-testid={`tab-${tab.id}`}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                } ${tab.id === "ask-ai" ? "text-purple-500 hover:text-purple-600" : ""}`}
              >
                {tab.label}
                {tab.id === "ask-ai" && (
                  <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">Beta</span>
                )}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => scrollToSection("rooms")}
            className="text-sm px-4 hidden md:flex"
            data-testid="button-select-room"
          >
            Select a room
          </Button>
        </div>

        {/* ─── Overview Section ─── */}
        <div ref={sectionRefs.overview} className="pt-8">
          <h2 className="text-xl font-bold mb-4">Smart highlights</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {highlights.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="border border-pink-200 dark:border-pink-900/40 rounded-xl p-4 bg-pink-50/40 dark:bg-pink-950/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{h.icon}</span>
                  <span className="font-semibold text-sm">{h.title}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{h.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─── Facilities Section ─── */}
        <div ref={sectionRefs.facilities} className="pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Popular facilities</h2>
            <button className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">See all facilities</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3">
            {hotel.amenities.slice(0, 15).map((amenity) => {
              const Icon = FACILITY_ICONS[amenity] || Building2;
              return (
                <div key={amenity} className="flex items-center gap-2 text-sm text-foreground">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Review Highlights ─── */}
        {hotel.rating && (
          <div className="pb-10 border-t border-border pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Review highlights</h2>
              <button className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">Read all reviews</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-white text-base font-bold w-9 h-9 rounded-full flex items-center justify-center ${getRatingColor(hotel.rating)}`}>
                {hotel.rating.toFixed(0)}
              </span>
              <div>
                <p className="font-semibold">{getRatingLabel(hotel.rating)}</p>
                {effectiveReviewCount && (
                  <p className="text-sm text-muted-foreground">Based on {effectiveReviewCount.toLocaleString()} reviews</p>
                )}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">What did guests like the most</p>
              <div className="flex flex-wrap gap-2">
                {["Excellent service", "Great location", "Beautiful rooms"].map(tag => (
                  <span key={tag} className="text-sm px-3 py-1 bg-muted rounded-full">"{tag}"</span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">Categories</p>
              </div>
              <div className="grid md:grid-cols-3 gap-x-8 gap-y-3">
                {categoryScores.map(({ name, score }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium">{score}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getBarColor(score)}`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-500 mt-4 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                This sentiment is generated from{effectiveReviewCount ? ` ${effectiveReviewCount.toLocaleString()}` : ""} reviews summarized by AI.
              </p>
            </div>
          </div>
        )}

        {/* ─── Rooms Section ─── */}
        <div ref={sectionRefs.rooms} className="border-t border-border pt-8 pb-10">
          <h2 className="text-xl font-bold mb-4">Choose your room</h2>

          {/* Date strip */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-3 flex-1 min-w-[280px] border border-border rounded-xl px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
                  data-testid="button-dates"
                >
                  <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Dates</p>
                    <p className="text-sm font-medium">
                      {format(parseISO(checkIn), "MMM d")} – {format(parseISO(checkOut), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5 shrink-0">
                    {differenceInDays(parseISO(checkOut), parseISO(checkIn))} night{differenceInDays(parseISO(checkOut), parseISO(checkIn)) !== 1 ? "s" : ""}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  defaultMonth={parseISO(checkIn)}
                  selected={dateRange}
                  onSelect={(range) => {
                    const r = range as { from: Date; to?: Date } | undefined;
                    if (r?.from) setCheckIn(format(r.from, "yyyy-MM-dd"));
                    if (r?.to) {
                      setCheckOut(format(r.to, "yyyy-MM-dd"));
                      setDateOpen(false);
                    }
                  }}
                  disabled={(d) => d < new Date()}
                />
              </PopoverContent>
            </Popover>

            <div className="border border-border rounded-xl px-4 py-2.5 min-w-[160px]">
              <p className="text-xs text-muted-foreground">Guests</p>
              <p className="text-sm font-medium">1 Room, {guests} Adults</p>
            </div>
          </div>

          {noRooms ? (
            <div className="border border-border rounded-xl p-4 flex items-start gap-3 mb-6 bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <X className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">This hotel is fully booked for your selected dates</p>
                <p className="text-sm text-muted-foreground">We've found these available alternatives that match your preferences. Check them out below or adjust your dates.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedRooms.map((group) => {
                const photoIdx = getRoomPhotoIdx(group.mappedRoomId);
                const isExpanded = expandedDescMap[group.mappedRoomId] ?? false;
                return (
                  <Card key={group.mappedRoomId} className="overflow-hidden border-border/60" data-testid={`room-group-${group.mappedRoomId}`}>
                    <div className="grid md:grid-cols-[320px_1fr] gap-0">
                      {/* Photo carousel */}
                      <div className="relative h-56 md:h-auto overflow-hidden bg-muted group/photo">
                        <img
                          src={group.photos[photoIdx] || GALLERY_FALLBACKS[0]}
                          alt={`${group.name} - photo ${photoIdx + 1}`}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = GALLERY_FALLBACKS[0]; }}
                        />
                        {group.photos.length > 1 && (
                          <>
                            <button
                              onClick={() => setRoomPhotoIdx(group.mappedRoomId, (photoIdx - 1 + group.photos.length) % group.photos.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity hover:bg-black/70"
                              data-testid={`button-room-photo-prev-${group.mappedRoomId}`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRoomPhotoIdx(group.mappedRoomId, (photoIdx + 1) % group.photos.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity hover:bg-black/70"
                              data-testid={`button-room-photo-next-${group.mappedRoomId}`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {group.photos.slice(0, 8).map((_: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => setRoomPhotoIdx(group.mappedRoomId, i)}
                                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? "bg-white" : "bg-white/40"}`}
                                />
                              ))}
                            </div>
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px]">
                              {photoIdx + 1} / {group.photos.length}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Room details */}
                      <div className="p-5 flex flex-col">
                        <h3 className="text-lg font-bold mb-2">{group.name}</h3>

                        {/* Quick facts row */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {group.bedTypes.map((bt, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                              <BedDouble className="w-3 h-3" />
                              {bt.quantity > 1 ? `${bt.quantity}× ` : ""}{bt.type}
                            </span>
                          ))}
                          {group.roomSize && (
                            <span className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                              <Maximize2 className="w-3 h-3" />
                              {group.roomSize}
                            </span>
                          )}
                          {group.maxOccupancy && (
                            <span className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                              <Users className="w-3 h-3" />
                              Up to {group.maxOccupancy} guests
                            </span>
                          )}
                        </div>

                        {/* Room description */}
                        {group.description && (
                          <div className="mb-3">
                            <p className={`text-xs text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                              {group.description}
                            </p>
                            {group.description.length > 120 && (
                              <button
                                className="text-xs text-primary mt-0.5 hover:underline"
                                onClick={() => setExpandedDescMap(prev => ({ ...prev, [group.mappedRoomId]: !isExpanded }))}
                              >
                                {isExpanded ? "Show less" : "Read more"}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Room amenities */}
                        {group.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {group.amenities.slice(0, 8).map((a) => (
                              <span key={a} className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">{a}</span>
                            ))}
                          </div>
                        )}

                        {/* Rate options */}
                        <div className="space-y-3 mt-auto">
                          {group.rates.map((rate: any) => (
                            <div
                              key={rate.offerId}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
                              data-testid={`rate-${rate.offerId}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <span className="font-semibold text-sm">{rate.boardName}</span>
                                  {rate.refundableTag === "RFN" ? (
                                    <Badge variant="outline" className="text-[10px] h-5 text-emerald-600 border-emerald-200 bg-emerald-50">Free cancellation</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">Non-refundable</Badge>
                                  )}
                                </div>
                                {rate.cancellationPolicy && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    {rate.cancellationPolicy}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="text-right">
                                  <p className="text-lg font-bold">{rate.currency} {rate.price.toLocaleString()}</p>
                                  <p className="text-[10px] text-muted-foreground">Total for your stay</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectRate(rate)}
                                  data-testid={`button-select-rate-${rate.offerId}`}
                                >
                                  Select
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Similar Properties ─── */}
        {(noRooms || similarHotels.length > 0) && (
          <div className="border-t border-border pt-8 pb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">Similar properties</h2>
                {checkIn && <span className="text-sm text-muted-foreground">{format(parseISO(checkIn), "MMM d")} - {format(parseISO(checkOut), "MMM d")}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSimilarIdx(Math.max(0, similarIdx - 1))}
                  disabled={similarIdx === 0}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Prev className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSimilarIdx(Math.min(similarHotels.length - 3, similarIdx + 1))}
                  disabled={similarIdx >= similarHotels.length - 3}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Next className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {visibleSimilar.map((sh) => {
                const shStars = sh.stars ? Math.round(sh.stars) : null;
                return (
                  <motion.div
                    key={sh.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-card"
                    onClick={() => setLocation(`/hotel/${sh.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
                    data-testid={`card-similar-${sh.id}`}
                  >
                    <div className="h-44 overflow-hidden">
                      <img
                        src={sh.imageUrl || GALLERY_FALLBACKS[0]}
                        alt={sh.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      {shStars && (
                        <div className="flex gap-0.5 mb-1">
                          {Array.from({ length: shStars }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{sh.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 mb-2 line-clamp-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {sh.address}
                      </p>
                      <div className="flex items-center justify-between">
                        {sh.rating ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-white text-xs font-bold px-1.5 py-0.5 rounded ${getRatingColor(sh.rating)}`}>
                              {sh.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">{sh.reviewCount ? `${sh.reviewCount.toLocaleString()} reviews` : getRatingLabel(sh.rating)}</span>
                          </div>
                        ) : <span />}
                        {sh.price && (
                          <div className="text-right">
                            <span className="font-bold text-sm">US${sh.price.toLocaleString()}</span>
                            <p className="text-xs text-muted-foreground">1 room × {nights || 1} night incl. taxes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Ask AI ─── */}
        <div ref={sectionRefs["ask-ai"]} className="border-t border-border pt-8 pb-10">
          <div className="border border-purple-200 dark:border-purple-800/40 rounded-2xl p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-xl font-bold">Ask AI about this hotel</h2>
              <span className="text-xs bg-red-100 text-red-500 dark:bg-red-950/30 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Beta version
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Get instant answers about property information and amenities.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["Does the hotel have parking?", "Does the hotel offer any amenities?", "What dining options are available?"].map(q => (
                <button
                  key={q}
                  onClick={() => handleAiSubmit(q)}
                  className="flex items-center gap-1.5 text-xs border border-border rounded-full px-3 py-1.5 hover:bg-white dark:hover:bg-muted transition-colors bg-white/60 dark:bg-muted/40"
                  data-testid={`button-ai-suggestion`}
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  {q}
                </button>
              ))}
            </div>
            {aiAnswer && (
              <div className="mb-4 p-4 bg-white dark:bg-muted/40 rounded-xl border border-border text-sm leading-relaxed">
                <p className="font-medium text-purple-600 text-xs mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Answer</p>
                {aiAnswer}
              </div>
            )}
            <div className="flex items-center gap-2 bg-white dark:bg-muted/40 border border-border rounded-xl px-4 py-3">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAiSubmit()}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                data-testid="input-ai-question"
              />
              <button onClick={() => handleAiSubmit()} className="text-muted-foreground hover:text-purple-500 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Guest Reviews ─── */}
        <div ref={sectionRefs.reviews} className="border-t border-border pt-8 pb-10">
          <h2 className="text-xl font-bold mb-4">Guest reviews</h2>
          {(hotel.rating || reviews.length > 0) ? (
            <div className="md:grid md:grid-cols-[260px_1fr] gap-8">
              {/* Left panel – score summary */}
              <div>
                {hotel.rating && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-white text-base font-bold w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getRatingColor(hotel.rating)}`}>
                        {hotel.rating.toFixed(1)}
                      </span>
                      <div>
                        <p className="font-semibold">{getRatingLabel(hotel.rating)}</p>
                        {effectiveReviewCount && (
                          <p className="text-sm text-muted-foreground">{effectiveReviewCount.toLocaleString()} reviews</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2.5 mb-5">
                      {categoryScores.slice(0, 6).map(({ name, score }) => (
                        <div key={name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{name}</span>
                            <span className="font-medium">{score}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getBarColor(score)}`} style={{ width: `${(score / 10) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {(hotel.checkinTime || hotel.checkoutTime) && (
                  <div className="border border-border rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold mb-1">Check-in / Check-out</p>
                    {hotel.checkinTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Check-in from <span className="font-medium text-foreground">{hotel.checkinTime}</span></span>
                      </div>
                    )}
                    {hotel.checkoutTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Check-out by <span className="font-medium text-foreground">{hotel.checkoutTime}</span></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right panel – individual reviews */}
              <div className="flex flex-col mt-6 md:mt-0">
                {reviewsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading reviews…
                  </div>
                ) : (
                  <>
                    <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                      {(showAllReviews ? reviews : reviews.slice(0, 4)).map((review, i) => {
                        const isReal = usingRealReviews;
                        const score = review.score ?? (review as any).score;
                        const name = review.name;
                        const type = review.type;
                        const date = review.date;
                        const pros = isReal ? (review as any).pros : (review as any).text;
                        const cons = isReal ? (review as any).cons : null;
                        const headline = isReal ? (review as any).headline : (review as any).title;
                        const source = isReal ? (review as any).source : null;
                        return (
                          <div key={i} className="p-4 bg-background" data-testid={`review-item-${i}`}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-sm">{name}</span>
                                  {type && <span className="text-xs text-muted-foreground">· {type}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {date && <p className="text-xs text-muted-foreground">{date}</p>}
                                  {source && <span className="text-xs text-muted-foreground">via {source}</span>}
                                </div>
                              </div>
                              {score != null && (
                                <span className={`text-white text-sm font-bold w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${score >= 8 ? "bg-emerald-500" : "bg-amber-500"}`}>
                                  {score}
                                </span>
                              )}
                            </div>
                            {headline && <p className="text-sm font-medium mb-1">{headline}</p>}
                            {pros && (
                              <div className="flex gap-1.5 mb-1">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{pros}</p>
                              </div>
                            )}
                            {cons && (
                              <div className="flex gap-1.5">
                                <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{cons}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {reviews.length > 4 && (
                      <div className="flex items-center gap-4 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          data-testid="button-load-reviews"
                        >
                          {showAllReviews ? "Show less" : `Load more reviews`}
                        </Button>
                        {effectiveReviewCount && (
                          <span className="text-sm text-muted-foreground">
                            Showing {showAllReviews ? reviews.length : Math.min(4, reviews.length)} of {effectiveReviewCount.toLocaleString()} reviews
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews available for this hotel yet.</p>
          )}
        </div>

        {/* ─── Property Description ─── */}
        <div ref={sectionRefs.description} className="border-t border-border pt-8 pb-10">
          <h2 className="text-xl font-bold mb-4">Property Description</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
            {hotel.description.split(/\n+/).filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Photo lightbox — full gallery with navigation */}
      <AnimatePresence>
        {showAllPhotos && hotel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowAllPhotos(false);
              if (e.key === "ArrowLeft") setLightboxIdx(i => (i - 1 + hotel.images.length) % hotel.images.length);
              if (e.key === "ArrowRight") setLightboxIdx(i => (i + 1) % hotel.images.length);
            }}
            tabIndex={0}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0">
              <span className="text-white/70 text-sm">{lightboxIdx + 1} / {hotel.images.length} photos</span>
              <span className="text-white font-semibold text-sm">{hotel.name}</span>
              <button onClick={() => setShowAllPhotos(false)} className="text-white/70 hover:text-white transition-colors p-1" data-testid="button-close-gallery">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main image */}
            <div className="flex-1 flex items-center justify-center px-14 relative min-h-0">
              <button
                onClick={() => setLightboxIdx(i => (i - 1 + hotel.images.length) % hotel.images.length)}
                className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                data-testid="button-gallery-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <img
                key={lightboxIdx}
                src={hotel.images[lightboxIdx]}
                alt={`Photo ${lightboxIdx + 1}`}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
              <button
                onClick={() => setLightboxIdx(i => (i + 1) % hotel.images.length)}
                className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                data-testid="button-gallery-next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail strip */}
            <div className="shrink-0 px-4 py-3 overflow-x-auto flex gap-2" style={{ scrollbarWidth: "thin" }}>
              {hotel.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${i === lightboxIdx ? "border-white" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

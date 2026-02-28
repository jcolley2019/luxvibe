import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useHotel, useSimilarHotels, useHotelReviews, type ReviewSentiment } from "@/hooks/use-hotels";
import { Navbar } from "@/components/Navbar";
import { SearchHero } from "@/components/SearchHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, MapPin, ChevronLeft, Heart, Camera, Star,
  Wifi, Coffee, Car, Dumbbell, Utensils, Waves, Sparkles, ChevronLeft as Prev, ChevronRight as Next,
  Building2, Briefcase, Plane, ShowerHead, Wind, Bed, ConciergeBell, Lock,
  Beer, Clock, Accessibility, Leaf, Zap, Send, X, Check, Info, AlertCircle,
  BedDouble, Users, Maximize2, ChevronRight, CalendarDays,
  Tv, Thermometer, Bath, FlameKindling, Refrigerator, Phone, Flame, AirVent, Search
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { HotelMap } from "@/components/HotelMap";

const GALLERY_FALLBACKS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800&q=80",
  "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&q=80",
];

const LOWERCASE_WORDS = new Set(["a", "an", "the", "and", "or", "of", "in", "at", "with", "by", "from", "for", "to", "but", "nor", "on", "up"]);

function formatRoomName(raw: string): string {
  return raw
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i !== 0 && LOWERCASE_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function formatCancelTime(iso: string | null | undefined): string {
  if (!iso) return "check-in";
  try {
    return format(new Date(iso), "EEE, MMM d, h:mm aa");
  } catch {
    return iso.split("T")[0];
  }
}

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

const ROOM_AMENITY_ICONS: Record<string, any> = {
  "tv": Tv, "television": Tv,
  "shower": ShowerHead, "shower stall": ShowerHead, "rain shower": ShowerHead,
  "bathtub": Bath, "bath": Bath, "hot tub": Bath, "jacuzzi": Waves, "soaking tub": Bath, "tub": Bath, "spa tub": Waves,
  "wifi": Wifi, "wi-fi": Wifi, "internet": Wifi, "wireless": Wifi,
  "air conditioning": AirVent, "air conditioner": AirVent, "climate control": AirVent, "heating": Thermometer,
  "hair dryer": Wind, "hairdryer": Wind, "hair drier": Wind,
  "coffee": Coffee, "coffee maker": Coffee, "kettle": Coffee, "espresso": Coffee,
  "minibar": Refrigerator, "refrigerator": Refrigerator, "fridge": Refrigerator, "mini fridge": Refrigerator,
  "safe": Lock, "in-room safe": Lock, "safety deposit box": Lock,
  "telephone": Phone, "phone": Phone,
  "fireplace": Flame, "fire": Flame,
  "balcony": Leaf, "terrace": Leaf,
  "kitchen": Utensils, "kitchenette": Utensils,
  "washing machine": ShowerHead, "dryer": Wind,
  "private bathroom": ShowerHead, "en suite bathroom": ShowerHead,
  "desk": Briefcase, "work desk": Briefcase,
};

function getRoomAmenityIcon(name: string): any {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ROOM_AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return Check;
}

type TabId = "overview" | "facilities" | "rooms" | "reviews" | "description" | "ask-ai";

const TABS: { id: TabId; labelKey: string }[] = [
  { id: "overview", labelKey: "hotel.overview" },
  { id: "facilities", labelKey: "hotel.amenities" },
  { id: "rooms", labelKey: "hotel.rooms" },
  { id: "reviews", labelKey: "hotel.reviews" },
  { id: "description", labelKey: "hotel.overview" },
  { id: "ask-ai", labelKey: "hotel.ask_ai" },
];

function getRatingKey(r: number) {
  if (r >= 9.0) return "hotel.exceptional";
  if (r >= 8.5) return "hotel.fabulous";
  if (r >= 8.0) return "hotel.wonderful";
  if (r >= 7.0) return "hotel.very_good";
  if (r >= 6.0) return "hotel.good";
  return "hotel.good";
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
    { nameKey: "hotel.cat_cleanliness", score: vary(-0.5) },
    { nameKey: "hotel.cat_service", score: vary(0.5) },
    { nameKey: "hotel.cat_location", score: vary(0.8) },
    { nameKey: "hotel.cat_room_quality", score: vary(-0.2) },
    { nameKey: "hotel.cat_amenities", score: vary(0.2) },
    { nameKey: "hotel.cat_value", score: vary(-1.0) },
    { nameKey: "hotel.cat_food", score: vary(-0.3) },
    { nameKey: "hotel.cat_overall", score: vary(0) },
  ];
}

function generateHighlights(name: string, description: string, amenities: string[]) {
  const desc = description.toLowerCase();
  const lower = (s: string) => s.toLowerCase();
  const highlights: { icon: string; titleKey: string; text: string }[] = [];

  const locationWords = ["downtown", "heart of", "steps from", "near", "waterfront", "beachfront", "park", "views", "view", "central", "walking distance"];
  const diningWords = ["restaurant", "dining", "cuisine", "michelin", "culinary", "gastronomy", "breakfast"];
  const wellnessWords = ["spa", "pool", "fitness", "wellness", "sauna", "indoor pool", "treatments"];
  const businessWords = ["business", "conference", "meeting", "event", "corporate"];

  if (locationWords.some(w => desc.includes(w))) {
    const sentences = description.split(/[.!]/);
    const match = sentences.find(s => locationWords.some(w => lower(s).includes(w))) || "";
    highlights.push({
      icon: "📍",
      titleKey: "hotel.highlight_location",
      text: match.trim() || `${name} is ideally located for exploring the surrounding area and top attractions.`,
    });
  }

  if (diningWords.some(w => desc.includes(w)) || amenities.some(a => diningWords.some(w => lower(a).includes(w)))) {
    highlights.push({
      icon: "🍽️",
      titleKey: "hotel.highlight_dining",
      text: `Indulge in exquisite cuisine at ${name}'s acclaimed restaurants, where expertly crafted menus and impeccable service create unforgettable dining experiences.`,
    });
  }

  if (wellnessWords.some(w => desc.includes(w)) || amenities.some(a => wellnessWords.some(w => lower(a).includes(w)))) {
    highlights.push({
      icon: "🧖",
      titleKey: "hotel.highlight_wellness",
      text: `Rejuvenate at the hotel's world-class spa and wellness facilities, featuring premium treatments and amenities designed for ultimate relaxation.`,
    });
  }

  if (businessWords.some(w => desc.includes(w)) || amenities.some(a => businessWords.some(w => lower(a).includes(w)))) {
    highlights.push({
      icon: "💼",
      titleKey: "hotel.highlight_business",
      text: `${name} offers state-of-the-art conference facilities and business services, making it the ideal destination for both corporate events and productive stays.`,
    });
  }

  while (highlights.length < 3) {
    const fallbacks = [
      { icon: "🏨", titleKey: "hotel.highlight_comfort", text: `${name} offers meticulously appointed rooms and suites combining timeless elegance with modern amenities for the perfect luxury retreat.` },
      { icon: "⭐", titleKey: "hotel.highlight_service", text: `Experience the hallmark of luxury hospitality with ${name}'s dedicated staff, committed to ensuring every moment of your stay exceeds expectations.` },
      { icon: "🌆", titleKey: "hotel.highlight_views", text: `Enjoy breathtaking vistas from the comfort of beautifully designed rooms and suites at ${name}, creating unforgettable memories.` },
    ];
    const next = fallbacks[highlights.length % fallbacks.length];
    if (!highlights.find(h => h.titleKey === next.titleKey)) highlights.push(next);
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
  const { t } = useTranslation();
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

  const checkIn = checkInParam || defaultCheckIn;
  const checkOut = checkOutParam || defaultCheckOut;
  const guests = guestsParam;


  const { data: hotel, isLoading, error } = useHotel(id!, { checkIn, checkOut, guests });
  const effectiveReviewCount = hotel?.reviewCount ?? reviewCountParam;
  const { data: similarHotels = [] } = useSimilarHotels(id!, { checkIn, checkOut, guests });
  const { data: reviewsData, isLoading: reviewsLoading } = useHotelReviews(id!);
  const realReviews = reviewsData?.reviews ?? [];
  const aiSentiment: ReviewSentiment | null = reviewsData?.sentiment ?? null;

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [wishlist, setWishlist] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [similarIdx, setSimilarIdx] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [galleryMode, setGalleryMode] = useState<"grid" | "lightbox">("grid");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [roomDetailsModal, setRoomDetailsModal] = useState<string | null>(null);
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0);
  const [showMap, setShowMap] = useState(false);

  const groupedRooms = useMemo(() => {
    if (!hotel) return [];
    const groups: Record<string, typeof hotel.roomTypes> = {};
    hotel.roomTypes.forEach(rate => {
      if (!groups[rate.mappedRoomId]) groups[rate.mappedRoomId] = [];
      groups[rate.mappedRoomId].push(rate);
    });
    return Object.entries(groups).map(([mappedRoomId, rates]) => {
      const firstRate = rates[0] as any;
      const rawPhotos = firstRate?.photos || [];
      const photos = rawPhotos.map((p: any) => (typeof p === "string" ? p : p.url)).filter(Boolean);
      if (photos.length === 0) photos.push(hotel.images[0] || GALLERY_FALLBACKS[0]);
      const displayName = firstRate?.roomName
        ? formatRoomName(firstRate.roomName)
        : formatRoomName(firstRate?.name || "Standard Room");
      return {
        mappedRoomId,
        name: displayName,
        photos,
        description: (firstRate?.roomDescription || null) as string | null,
        amenities: (firstRate?.roomAmenities || []) as string[],
        amenitiesFull: (firstRate?.roomAmenitiesFull || firstRate?.roomAmenities || []) as string[],
        amenityGroups: (firstRate?.roomAmenityGroups || []) as { category: string; items: string[] }[],
        bedTypes: (firstRate?.bedTypes || []) as { type: string; quantity: number }[],
        roomSize: firstRate?.roomSize || null,
        maxOccupancy: firstRate?.maxOccupancy || null,
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
        <p className="text-lg text-destructive">{t("hotel.hotel_not_found")}</p>
        <Button onClick={() => window.history.back()}>{t("hotel.go_back")}</Button>
      </div>
    );
  }

  const gallery = getGallery(hotel.id, hotel.images);
  const highlights = generateHighlights(hotel.name, hotel.description, hotel.amenities);
  const SENTIMENT_LABELS: Record<string, string> = {
    cleanliness: "Cleanliness", location: "Location", staff: "Staff",
    facilities: "Facilities", value: "Value", comfort: "Comfort",
    amenities: "Amenities", service: "Service", room: "Room Quality",
    food: "Food & Dining", wifi: "WiFi", "value for money": "Value",
  };
  const sentimentCategoryScores = aiSentiment && Object.keys(aiSentiment.categories).length > 0
    ? Object.entries(aiSentiment.categories).map(([key, score]) => ({
      nameKey: key,
      name: SENTIMENT_LABELS[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1),
      score,
      isReal: true,
    }))
    : null;
  const categoryScores = sentimentCategoryScores
    || (hotel.rating ? generateCategoryScores(hotel.rating) : []);
  const reviews = realReviews.length > 0 ? realReviews : (hotel.rating ? generateReviews(hotel.rating) : []);
  const usingRealReviews = realReviews.length > 0;
  const hasSentiment = aiSentiment !== null && (Object.keys(aiSentiment.categories).length > 0 || aiSentiment.pros.length > 0 || aiSentiment.cons.length > 0);
  const nights = differenceInDays(parseISO(checkOut), parseISO(checkIn)) || 1;
  const noRooms = groupedRooms.length === 0;

  const visibleSimilar = similarHotels.slice(similarIdx, similarIdx + 3);

  const starCount = hotel.stars ? Math.round(hotel.stars) : null;

  const compactBar = (
    <SearchHero
      variant="navbar"
      initialDestination={hotel?.name}
      initialCheckIn={checkIn}
      initialCheckOut={checkOut}
      initialGuests={guests}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar centralSlot={compactBar} />

      <div className="container mx-auto px-4 pt-4 pb-20 max-w-5xl">
        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          data-testid="button-back"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("hotel.see_all_properties")}
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
              <button onClick={() => setShowMap(true)} className="underline underline-offset-2 hover:text-foreground transition-colors" data-testid="button-show-map">{t("hotel.show_map")}</button>
            </p>
          </div>
          <button
            onClick={() => setWishlist(!wishlist)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-sm font-medium hover:bg-muted transition-colors shrink-0"
            data-testid="button-wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlist ? "fill-red-500 text-red-500" : ""}`} />
            {wishlist ? t("hotel.saved") : t("hotel.save")}
          </button>
        </div>

        {/* Photo Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[380px] rounded-xl overflow-hidden mb-0 relative">
          <div className="col-span-2 row-span-2 overflow-hidden cursor-pointer" onClick={() => { setGalleryMode("grid"); setShowAllPhotos(true); }}>
            <img src={gallery[0]} alt="Main" className="w-full h-full object-cover ken-burns" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="col-span-1 row-span-1 overflow-hidden group cursor-pointer relative"
              onClick={() => { setGalleryMode("grid"); setShowAllPhotos(true); }}
            >
              <img src={gallery[i]} alt={`View ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {i === 4 && (
                <div className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors flex items-center justify-center">
                  <span className="text-white text-sm font-medium flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    {hotel.images.length > 5 ? `+${hotel.images.length - 4} ${t("hotel.photos")}` : t("hotel.show_all_pictures")}
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
                {t(tab.labelKey)}
                {tab.id === "ask-ai" && (
                  <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">{t("hotel.beta")}</span>
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
            {t("hotel.select_room")}
          </Button>
        </div>

        {/* ─── Overview Section ─── */}
        <div ref={sectionRefs.overview} className="pt-8">
          <h2 className="text-xl font-bold mb-4">{t("hotel.smart_highlights")}</h2>
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
                  <span className="font-semibold text-sm">{t(h.titleKey)}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{h.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─── Facilities Section ─── */}
        <div ref={sectionRefs.facilities} className="pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t("hotel.popular_facilities")}</h2>
            <button className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">{t("hotel.see_all_facilities")}</button>
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
              <h2 className="text-xl font-bold">{t("hotel.review_highlights")}</h2>
              <button className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">{t("hotel.read_all_reviews")}</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-white text-base font-bold w-9 h-9 rounded-full flex items-center justify-center ${getRatingColor(hotel.rating)}`}>
                {hotel.rating.toFixed(0)}
              </span>
              <div>
                <p className="font-semibold">{t(getRatingKey(hotel.rating))}</p>
                {effectiveReviewCount && (
                  <p className="text-sm text-muted-foreground">{t("hotel.based_on_reviews", { count: effectiveReviewCount.toLocaleString() })}</p>
                )}
              </div>
            </div>

            {hasSentiment && (aiSentiment!.pros.length > 0 || aiSentiment!.cons.length > 0) ? (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {aiSentiment!.pros.length > 0 && (
                  <div className="space-y-2" data-testid="sentiment-pros">
                    <p className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {t("hotel.guests_liked")}
                    </p>
                    <ul className="space-y-1.5">
                      {aiSentiment!.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiSentiment!.cons.length > 0 && (
                  <div className="space-y-2" data-testid="sentiment-cons">
                    <p className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {t("hotel.guests_disliked", { defaultValue: "Areas for Improvement" })}
                    </p>
                    <ul className="space-y-1.5">
                      {aiSentiment!.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">{t("hotel.guests_liked")}</p>
                <div className="flex flex-wrap gap-2">
                  {["hotel.tag_service", "hotel.tag_location", "hotel.tag_rooms"].map(tagKey => (
                    <span key={tagKey} className="text-sm px-3 py-1 bg-muted rounded-full">"{t(tagKey)}"</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">{t("hotel.categories")}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-x-8 gap-y-3">
                {categoryScores.map(({ nameKey, name, score, isReal }) => (
                  <div key={nameKey} data-testid={`category-score-${nameKey}`}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{name || t(nameKey)}</span>
                      <span className="font-medium">{typeof score === "number" ? score.toFixed(1) : score}</span>
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
              <p className="text-xs text-purple-500 mt-4 flex items-center gap-1" data-testid="text-ai-powered">
                <Sparkles className="w-3 h-3" />
                {hasSentiment
                  ? t("hotel.powered_by_ai", { defaultValue: "Powered by AI" })
                  : t("hotel.ai_sentiment", { count: effectiveReviewCount ? effectiveReviewCount.toLocaleString() : "" })}
              </p>
            </div>
          </div>
        )}

        {/* ─── Rooms Section ─── */}
        <div ref={sectionRefs.rooms} className="border-t border-border pt-8 pb-10">
          <h2 className="text-xl font-bold mb-4">{t("hotel.choose_your_room")}</h2>

          {/* Savings tip */}
          {(() => {
            const maxDiscount = hotel.roomTypes.reduce((max: number, r: any) => Math.max(max, r.discountPercent || 0), 0);
            if (maxDiscount < 2) return null;
            const suggestedCheckIn = format(addDays(parseISO(checkIn), 3), "MMMM dd");
            const suggestedCheckOut = format(addDays(parseISO(checkOut), 3), "MMMM dd");
            return (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/10 px-4 py-3 mb-4" data-testid="savings-tip">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-sm text-foreground/80 flex-1">
                  {t("hotel.savings_tip", { percent: maxDiscount, dateRange: `${suggestedCheckIn} – ${suggestedCheckOut}`, defaultValue: `You can save up to {{percent}}% by adjusting your dates to {{dateRange}}.` })}
                </p>
                <button
                  className="text-sm font-semibold text-primary hover:underline underline-offset-2 whitespace-nowrap"
                  onClick={() => {
                    const newCheckIn = format(addDays(parseISO(checkIn), 3), "yyyy-MM-dd");
                    const newCheckOut = format(addDays(parseISO(checkOut), 3), "yyyy-MM-dd");
                    setLocation(`/hotel/${id}?checkIn=${newCheckIn}&checkOut=${newCheckOut}&guests=${guests}`);
                    window.location.reload();
                  }}
                  data-testid="button-change-dates"
                >
                  {t("hotel.change_my_dates", "Change my dates")}
                </button>
              </div>
            );
          })()}

          {/* Change search bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-6 p-3 rounded-lg border border-border bg-muted/30" data-testid="change-search-bar">
            <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-background text-sm">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{format(parseISO(checkIn), "dd MMM")}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-background text-sm">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{format(parseISO(checkOut), "dd MMM")}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-background text-sm">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>1 {t("hotel.room")}, {guests} {parseInt(guests) === 1 ? t("search.guest") : t("search.guest_plural")}</span>
            </div>
            <Button
              onClick={() => scrollToSection("overview")}
              className="rounded-full gap-2 shrink-0"
              data-testid="button-change-search"
            >
              <Search className="w-4 h-4" />
              {t("hotel.change_search", "Change search")}
            </Button>
          </div>

          {noRooms ? (
            <div className="border border-border rounded-xl p-4 flex items-start gap-3 mb-6 bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <X className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t("hotel.fully_booked")}</p>
                <p className="text-sm text-muted-foreground">{t("hotel.fully_booked_sub")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedRooms.map((group) => {
                const photoIdx = getRoomPhotoIdx(group.mappedRoomId);
                return (
                  <Card key={group.mappedRoomId} className="overflow-hidden border-border/60" data-testid={`room-group-${group.mappedRoomId}`}>
                    {/* Room name heading */}
                    <div className="px-5 pt-4 pb-3 border-b border-border/40">
                      <h3 className="text-sm font-semibold text-foreground">1 × {group.name}</h3>
                    </div>

                    <div className="flex flex-col md:flex-row">
                      {/* ── Left: photo carousel + room details ── */}
                      <div className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border/40">
                        {/* Photo carousel */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted group/photo cursor-pointer"
                          onClick={() => { setRoomDetailsModal(group.mappedRoomId); setModalPhotoIdx(photoIdx); }}
                        >
                          <img
                            src={group.photos[photoIdx] || GALLERY_FALLBACKS[0]}
                            alt={`${group.name} - photo ${photoIdx + 1}`}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = GALLERY_FALLBACKS[0]; }}
                          />
                          {group.photos.length > 1 && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setRoomPhotoIdx(group.mappedRoomId, (photoIdx - 1 + group.photos.length) % group.photos.length); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity hover:bg-black/70"
                                data-testid={`button-room-photo-prev-${group.mappedRoomId}`}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setRoomPhotoIdx(group.mappedRoomId, (photoIdx + 1) % group.photos.length); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity hover:bg-black/70"
                                data-testid={`button-room-photo-next-${group.mappedRoomId}`}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                                <Camera className="w-3 h-3" />
                                {photoIdx + 1} / {group.photos.length}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Room details panel */}
                        <div className="p-4 space-y-3">
                          {/* Size + occupancy */}
                          {(group.roomSize || group.maxOccupancy || group.bedTypes.length > 0) && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("hotel.room_details")}</p>
                              <div className="flex items-center gap-4 text-sm text-foreground/80 mb-2">
                                {group.roomSize && (
                                  <span className="flex items-center gap-1.5">
                                    <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    {group.roomSize}
                                  </span>
                                )}
                                {group.maxOccupancy && (
                                  <span className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    {t("hotel.sleeps", { count: group.maxOccupancy })}
                                  </span>
                                )}
                              </div>
                              {group.bedTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {group.bedTypes.map((bt, i) => (
                                    <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <BedDouble className="w-3 h-3" />
                                      {bt.quantity > 1 ? `${bt.quantity}× ` : ""}{bt.type}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Amenities with icons */}
                          {group.amenities.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("hotel.amenities")}</p>
                              <ul className="space-y-1.5">
                                {group.amenities.slice(0, 2).map((a) => {
                                  const AIcon = getRoomAmenityIcon(a);
                                  return (
                                    <li key={a} className="flex items-center gap-2 text-xs text-foreground/80">
                                      <AIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                      {a}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}

                          {/* Room details link */}
                          <button
                            className="text-xs font-semibold text-primary hover:underline underline-offset-2 mt-1"
                            onClick={() => { setRoomDetailsModal(group.mappedRoomId); setModalPhotoIdx(photoIdx); }}
                            data-testid={`button-room-details-${group.mappedRoomId}`}
                          >
                            {t("hotel.room_details")}
                          </button>
                        </div>
                      </div>

                      {/* ── Right: rate rows ── */}
                      <div className="flex-1 divide-y divide-border/40">
                        {group.rates.map((rate: any) => {
                          const fmtPrice = (v: number) => new Intl.NumberFormat("en", { style: "currency", currency: rate.currency, maximumFractionDigits: 0 }).format(v);
                          const nightCount = rate.nights ?? differenceInDays(parseISO(checkOut), parseISO(checkIn));
                          const hasMeals = (rate.boardCode && rate.boardCode !== "RO") || (rate.mealsIncluded && rate.mealsIncluded !== "No meals included");
                          return (
                            <div
                              key={rate.offerId}
                              className="flex flex-col sm:flex-row sm:items-center gap-4 p-5"
                              data-testid={`rate-${rate.offerId}`}
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-bold text-sm text-foreground">{rate.boardName}</p>
                                {hasMeals ? (
                                  <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    {rate.mealsIncluded || rate.boardName}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 shrink-0" />
                                    {rate.mealsIncluded || t("hotel.no_meals")}
                                  </p>
                                )}
                                {rate.refundableTag === "RFN" ? (
                                  <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    {t("hotel.free_cancel_before", { date: formatCancelTime(rate.cancelTime) })}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 shrink-0" />
                                    {t("hotel.non_refundable")}
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0 min-w-[140px]">
                                {rate.discountPercent != null && rate.discountPercent > 0 && (
                                  <span className="inline-block bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                                    {rate.discountPercent}% OFF
                                  </span>
                                )}
                                <div className="flex items-baseline justify-end gap-0.5">
                                  <span className="text-xl font-bold text-foreground">
                                    {fmtPrice(rate.pricePerNight ?? rate.price)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">/{t("hotel.night")}</span>
                                </div>
                                {rate.suggestedPricePerNight != null && rate.suggestedPricePerNight > (rate.pricePerNight ?? rate.price) && (
                                  <p className="text-sm text-muted-foreground line-through">
                                    {fmtPrice(rate.suggestedPricePerNight)}
                                  </p>
                                )}
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  ({nightCount} {nightCount !== 1 ? t("hotel.nights") : t("hotel.night")}, 1 {t("hotel.room")}{rate.taxes ? ` (+${fmtPrice(rate.taxes)} ${t("hotel.taxes_and_fees")})` : ""})
                                </p>
                              </div>

                              <Button
                                onClick={() => handleSelectRate(rate)}
                                className="rounded-full px-6 shrink-0"
                                data-testid={`button-select-rate-${rate.offerId}`}
                              >
                                {t("hotel.choose_room")}
                              </Button>
                            </div>
                          );
                        })}
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
                <h2 className="text-xl font-bold">{t("hotel.similar_properties")}</h2>
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
                            <span className="text-xs text-muted-foreground">{sh.reviewCount ? `${sh.reviewCount.toLocaleString()} reviews` : t(getRatingKey(sh.rating))}</span>
                          </div>
                        ) : <span />}
                        {sh.price && (
                          <div className="text-right">
                            <span className="font-bold text-sm">{sh.price.toLocaleString("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</span>
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
              <h2 className="text-xl font-bold">{t("hotel.ask_ai")}</h2>
              <span className="text-xs bg-red-100 text-red-500 dark:bg-red-950/30 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {t("hotel.beta")}
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
                <p className="font-medium text-purple-600 text-xs mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t("hotel.ai_answer")}</p>
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
                placeholder={t("hotel.ask_anything")}
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
          <h2 className="text-xl font-bold mb-4">{t("hotel.guest_reviews")}</h2>
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
                        <p className="font-semibold">{t(getRatingKey(hotel.rating))}</p>
                        {effectiveReviewCount && (
                          <p className="text-sm text-muted-foreground">{t("hotel.reviews_count", { count: effectiveReviewCount.toLocaleString() })}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2.5 mb-5">
                      {categoryScores.slice(0, 6).map(({ nameKey, name, score, isReal }) => (
                        <div key={nameKey}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{isReal ? name : t(nameKey)}</span>
                            <span className="font-medium">{typeof score === "number" ? score.toFixed(1) : score}</span>
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
                    <p className="text-sm font-semibold mb-1">{t("hotel.checkin_checkout")}</p>
                    {hotel.checkinTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{t("hotel.checkin_from")} <span className="font-medium text-foreground">{hotel.checkinTime}</span></span>
                      </div>
                    )}
                    {hotel.checkoutTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{t("hotel.checkout_by")} <span className="font-medium text-foreground">{hotel.checkoutTime}</span></span>
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
                    {t("hotel.loading_reviews")}
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
                          {showAllReviews ? t("hotel.show_less") : t("hotel.load_more")}
                        </Button>
                        {effectiveReviewCount && (
                          <span className="text-sm text-muted-foreground">
                            {t("hotel.showing_reviews", { shown: showAllReviews ? reviews.length : Math.min(4, reviews.length), total: effectiveReviewCount.toLocaleString() })}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">{t("hotel.no_reviews_yet")}</p>
          )}
        </div>

        {/* ─── Property Description ─── */}
        <div ref={sectionRefs.description} className="border-t border-border pt-8 pb-10">
          <h2 className="text-xl font-bold mb-4">{t("hotel.property_description")}</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
            {hotel.description.split(/\n+/).filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal — shared card for grid + lightbox */}
      <AnimatePresence>
        {showAllPhotos && hotel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowAllPhotos(false); setGalleryMode("grid"); }}
            />

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (galleryMode === "lightbox") setGalleryMode("grid");
                  else { setShowAllPhotos(false); }
                }
                if (galleryMode === "lightbox") {
                  if (e.key === "ArrowLeft") setLightboxIdx(i => (i - 1 + hotel.images.length) % hotel.images.length);
                  if (e.key === "ArrowRight") setLightboxIdx(i => (i + 1) % hotel.images.length);
                }
              }}
              tabIndex={-1}
            >
              <div
                className="pointer-events-auto w-full max-w-5xl bg-white dark:bg-card rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: "90vh" }}
                onClick={e => e.stopPropagation()}
              >
                {galleryMode === "grid" ? (
                  /* ── GRID VIEW ── */
                  <>
                    <div className="flex items-center justify-between px-6 py-4 shrink-0">
                      <span className="font-semibold text-base text-foreground">{hotel.name}</span>
                      <button
                        onClick={() => setShowAllPhotos(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        data-testid="button-close-gallery"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-5" style={{ scrollbarWidth: "thin" }}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {hotel.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => { setLightboxIdx(i); setGalleryMode("lightbox"); }}
                            className={`aspect-square overflow-hidden rounded-xl border-2 transition-all hover:opacity-90 hover:scale-[1.02] ${i === lightboxIdx ? "border-primary shadow-md shadow-primary/20" : "border-transparent"}`}
                            data-testid={`button-gallery-thumb-${i}`}
                          >
                            <img
                              src={img}
                              alt={`Photo ${i + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── LIGHTBOX VIEW ── */
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 shrink-0">
                      <button
                        onClick={() => setGalleryMode("grid")}
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-back-to-gallery"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t("hotel.back_to_gallery")}
                      </button>
                      <button
                        onClick={() => { setGalleryMode("grid"); setShowAllPhotos(false); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        data-testid="button-close-lightbox"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Main image area */}
                    <div className="flex-1 flex items-center justify-center px-4 pb-3 relative min-h-0">
                      <button
                        onClick={() => setLightboxIdx(i => (i - 1 + hotel.images.length) % hotel.images.length)}
                        className="absolute left-5 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors shadow-lg"
                        data-testid="button-gallery-prev"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="relative w-full flex items-center justify-center" style={{ maxHeight: "calc(90vh - 190px)" }}>
                        <img
                          key={lightboxIdx}
                          src={hotel.images[lightboxIdx]}
                          alt={`Photo ${lightboxIdx + 1}`}
                          className="max-h-full max-w-full object-contain rounded-2xl"
                          style={{ maxHeight: "calc(90vh - 190px)" }}
                        />
                        {/* Counter pill overlaid at bottom of image */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium select-none">
                          {lightboxIdx + 1} / {hotel.images.length}
                        </div>
                      </div>

                      <button
                        onClick={() => setLightboxIdx(i => (i + 1) % hotel.images.length)}
                        className="absolute right-5 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors shadow-lg"
                        data-testid="button-gallery-next"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Thumbnail strip */}
                    <div className="shrink-0 px-4 py-3 border-t border-border overflow-x-auto flex gap-2" style={{ scrollbarWidth: "none" }}>
                      {hotel.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxIdx(i)}
                          className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIdx ? "border-primary" : "border-transparent opacity-40 hover:opacity-75"}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Room Details Dialog ─── */}
      {roomDetailsModal && (() => {
        const group = groupedRooms.find(g => g.mappedRoomId === roomDetailsModal);
        if (!group) return null;
        const totalPhotos = group.photos.length;
        const hasGroups = group.amenityGroups.length > 0;
        const allAmenities: string[] = group.amenitiesFull?.length > 0 ? group.amenitiesFull : group.amenities;
        const POPULAR_KEYWORDS = ["tv", "television", "hair dryer", "hairdryer", "private bathroom", "free wifi", "wifi", "wi-fi", "bedsheets", "bed sheets", "air conditioning", "minibar", "coffee", "safe", "balcony", "terrace"];
        const popularAmenities = allAmenities.filter(a => {
          const lower = a.toLowerCase();
          return POPULAR_KEYWORDS.some(k => lower.includes(k));
        }).slice(0, 6);
        return (
          <Dialog open={true} onOpenChange={() => setRoomDetailsModal(null)}>
            <DialogContent className="max-w-2xl !grid-rows-[auto_1fr] p-0 overflow-hidden max-h-[90vh]">
              <DialogHeader className="px-6 pt-5 pb-3 shrink-0 border-b border-border/40">
                <DialogTitle className="text-lg font-bold">{t("hotel.room_details")}</DialogTitle>
              </DialogHeader>

              <div className="overflow-y-auto flex-1 scrollbar-thin" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}>
                {/* Photo carousel */}
                {group.photos.length > 0 && (
                  <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
                    <img
                      src={group.photos[modalPhotoIdx] || GALLERY_FALLBACKS[0]}
                      alt={`${group.name} - photo ${modalPhotoIdx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = GALLERY_FALLBACKS[0]; }}
                    />
                    {totalPhotos > 1 && (
                      <>
                        <button
                          onClick={() => setModalPhotoIdx(i => (i - 1 + totalPhotos) % totalPhotos)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-black/50 text-foreground dark:text-white flex items-center justify-center hover:bg-white dark:hover:bg-black/70 transition-colors shadow-sm"
                          data-testid="button-modal-photo-prev"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setModalPhotoIdx(i => (i + 1) % totalPhotos)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-black/50 text-foreground dark:text-white flex items-center justify-center hover:bg-white dark:hover:bg-black/70 transition-colors shadow-sm"
                          data-testid="button-modal-photo-next"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                          {modalPhotoIdx + 1} / {totalPhotos}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Room name + Size/occupancy */}
                <div className="px-6 pt-5 pb-4 border-b border-border/40">
                  <h3 className="text-base font-bold mb-2">{group.name}</h3>
                  {(group.roomSize || group.maxOccupancy) && (
                    <div className="flex items-center gap-5 text-sm text-muted-foreground">
                      {group.roomSize && (
                        <span className="flex items-center gap-1.5">
                          <Maximize2 className="w-4 h-4" />
                          {group.roomSize}
                        </span>
                      )}
                      {group.maxOccupancy && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {t("hotel.sleeps", { count: group.maxOccupancy })}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Popular amenities row */}
                  {popularAmenities.length > 0 && (
                    <div className="pb-4 border-b border-border/40">
                      <h4 className="text-sm font-semibold mb-3">{t("hotel.popular_amenities", "Popular amenities")}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {popularAmenities.map(a => {
                          const AIcon = getRoomAmenityIcon(a);
                          return (
                            <div key={a} className="flex items-center gap-2 text-sm">
                              <AIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                              {a}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All amenities — categorized groups, then full flat list */}
                  {group.amenityGroups.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      {group.amenityGroups.map(({ category, items }) => {
                        const CatIcon = getRoomAmenityIcon(category);
                        return (
                          <div key={category}>
                            <div className="flex items-center gap-2 mb-2">
                              <CatIcon className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm font-semibold">{category}</p>
                            </div>
                            <ul className="space-y-1">
                              {items.map(item => (
                                <li key={item} className="text-sm text-muted-foreground pl-6">{item}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {group.amenityGroups.length === 0 && allAmenities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">{t("hotel.amenities")}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {allAmenities.map(a => {
                          const AIcon = getRoomAmenityIcon(a);
                          return (
                            <div key={a} className="flex items-center gap-2 text-sm">
                              <AIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                              {a}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {group.description && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <h4 className="text-sm font-semibold">{t("hotel.about_this_room")}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{group.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {showMap && (
        <HotelMap
          hotel={{
            id: hotel.id,
            name: hotel.name,
            lat: hotel.lat,
            lng: hotel.lng,
            price: hotel.roomTypes?.[0]?.price ?? null,
            rating: hotel.rating,
            stars: hotel.stars,
            imageUrl: hotel.images?.[0] ?? null,
            address: hotel.address,
          }}
          nearbyHotels={similarHotels.map((h: any) => ({
            id: h.id,
            name: h.name,
            lat: h.lat ?? null,
            lng: h.lng ?? null,
            price: h.price,
            rating: h.rating,
            stars: h.stars,
            imageUrl: h.imageUrl,
          }))}
          currency={hotel.roomTypes?.[0]?.currency || "USD"}
          onClose={() => setShowMap(false)}
          onHotelClick={(id) => {
            setShowMap(false);
            setLocation(`/hotel/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
          }}
        />
      )}
    </div>
  );
}

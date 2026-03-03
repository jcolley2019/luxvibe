import { useState, useEffect } from "react";
import { Link } from "wouter";
import { MapPin, Heart, Wifi, Waves, Dumbbell, Utensils, Car, Wine, Sparkles, PlaneTakeoff, BellRing, Coffee, Snowflake, PawPrint, Footprints, BarChart2 } from "lucide-react";
import type { DealBadge } from "@/components/HotelCard";

export interface ListHotel {
  id: string;
  name: string;
  address: string;
  city?: string;
  stars?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  price?: number | null;
  imageUrl?: string | null;
  facilities?: string[];
  distance?: number | null;
}

const FACILITY_ICON_MAP: Record<string, { icon: React.ElementType; label: string }> = {
  wifi: { icon: Wifi, label: "WiFi" },
  "free wifi": { icon: Wifi, label: "Free WiFi" },
  internet: { icon: Wifi, label: "WiFi" },
  pool: { icon: Waves, label: "Pool" },
  "swimming pool": { icon: Waves, label: "Pool" },
  gym: { icon: Dumbbell, label: "Gym" },
  fitness: { icon: Dumbbell, label: "Fitness" },
  restaurant: { icon: Utensils, label: "Restaurant" },
  dining: { icon: Utensils, label: "Dining" },
  parking: { icon: Car, label: "Parking" },
  bar: { icon: Wine, label: "Bar" },
  spa: { icon: Sparkles, label: "Spa" },
  "airport shuttle": { icon: PlaneTakeoff, label: "Airport Shuttle" },
  "room service": { icon: BellRing, label: "Room Service" },
  breakfast: { icon: Coffee, label: "Breakfast" },
  "air conditioning": { icon: Snowflake, label: "AC" },
  "pets allowed": { icon: PawPrint, label: "Pet Friendly" },
};

function getFacilityPills(facilities: string[] | undefined): Array<{ icon: React.ElementType; label: string }> {
  if (!facilities?.length) return [];
  const pills: Array<{ icon: React.ElementType; label: string }> = [];
  for (const f of facilities) {
    const key = f.toLowerCase();
    const match = FACILITY_ICON_MAP[key] ?? Object.entries(FACILITY_ICON_MAP).find(([k]) => key.includes(k))?.[1];
    if (match && !pills.some((p) => p.label === match.label)) {
      pills.push(match);
    }
    if (pills.length === 3) break;
  }
  return pills;
}

function getRatingLabel(rating: number | null): string {
  if (!rating) return "New";
  if (rating >= 9.0) return "Exceptional";
  if (rating >= 8.5) return "Fabulous";
  if (rating >= 8.0) return "Wonderful";
  if (rating >= 7.0) return "Very Good";
  if (rating >= 6.0) return "Good";
  return "Reviewed";
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

export function HotelListCard({
  hotel,
  checkIn,
  checkOut,
  guests,
  dealInfo,
  nights,
  isCompared,
  onToggleCompare,
  compareDisabled,
}: {
  hotel: ListHotel;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  dealInfo?: { type: DealBadge; discount: number } | null;
  nights: number;
  isCompared?: boolean;
  onToggleCompare?: () => void;
  compareDisabled?: boolean;
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

  console.log(`[HotelListCard] ${hotel.name}: distance=${hotel.distance}, facilities=${hotel.facilities?.length}`);

  const discountPct = dealInfo?.discount;
  const originalPrice = price && discountPct ? Math.round(price / (1 - discountPct / 100)) : null;
  const facilityPills = getFacilityPills((hotel as any).facilities);

  return (
    <Link href={detailsUrl} data-testid={`card-hotel-${hotel.id}`}>
      <div className="group bg-white dark:bg-card border border-border rounded-xl overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-all duration-200 cursor-pointer">

        {/* Photo */}
        <div className="relative w-full h-48 sm:w-[220px] sm:h-auto shrink-0 overflow-hidden bg-muted">
          <img
            src={hotel.imageUrl || getFallbackImage(hotel.id)}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(hotel.id); }}
          />
          <button
            onClick={toggleWishlist}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            data-testid={`button-wishlist-${hotel.id}`}
          >
            <Heart className={`w-4 h-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
          </button>
          {onToggleCompare && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCompare(); }}
              disabled={compareDisabled && !isCompared}
              className={`absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shadow transition-all ${
                isCompared
                  ? "bg-primary text-primary-foreground"
                  : compareDisabled
                  ? "bg-white/60 text-slate-400 cursor-not-allowed"
                  : "bg-white/90 text-slate-600 hover:bg-white"
              }`}
              data-testid={`button-compare-${hotel.id}`}
            >
              <BarChart2 className="w-3 h-3" />
              {isCompared ? "Added" : "Compare"}
            </button>
          )}
          {dealInfo?.type && (
            <div className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-white text-[11px] font-bold ${dealInfo.type === "great-deal" ? "bg-emerald-500" : "bg-sky-500"}`}>
              {dealInfo.type === "great-deal" ? "Great Deal" : "Good Value"}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-4 flex flex-col min-w-0">
          <StarRow stars={hotel.stars ?? null} />
          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors mt-1 mb-1 line-clamp-1">
            {hotel.name}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <MapPin className="w-3 h-3 mr-1 shrink-0" />
            <span className="line-clamp-1">{hotel.address}</span>
          </div>
          {hotel.distance != null && (
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <Footprints className="w-3 h-3 mr-1 shrink-0" />
              <span>{hotel.distance.toFixed(1)} mi from centre</span>
            </div>
          )}
          {facilityPills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {facilityPills.slice(0, 2).map(({ icon: Icon, label }) => (
                <span key={label} className="text-[10px] px-2 py-0.5 rounded-full border border-border flex items-center gap-1 text-muted-foreground bg-muted/30">
                  <Icon className="w-2.5 h-2.5" />
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Price + CTA — mobile only (shown below details, above sm breakpoint hidden) */}
          <div className="sm:hidden mt-auto pt-3 border-t border-border flex items-center justify-between gap-3">
            <div>
              {discountPct && (
                <div className="inline-block bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded mb-1">
                  {discountPct}% OFF
                </div>
              )}
              {price ? (
                <>
                  {originalPrice && originalPrice > price && (
                    <div className="text-xs text-muted-foreground line-through">{originalPrice.toLocaleString()}</div>
                  )}
                  <div className="text-lg font-bold text-foreground">US${price.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">/ night · incl. taxes</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Check rates</div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hotel.rating && (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">
                  {hotel.rating % 1 === 0 ? hotel.rating.toFixed(0) : hotel.rating.toFixed(1)}
                </div>
              )}
              <div className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">
                See availability
              </div>
            </div>
          </div>
        </div>

        {/* Price + CTA — desktop only */}
        <div className="hidden sm:flex w-[200px] shrink-0 p-4 flex-col items-end justify-between border-l border-border">
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
                {discountPct}% OFF
              </div>
            )}
            {price ? (
              <>
                {originalPrice && originalPrice > price && (
                  <div className="text-sm text-muted-foreground line-through decoration-muted-foreground">US${originalPrice.toLocaleString()}</div>
                )}
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

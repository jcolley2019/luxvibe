import { Link } from "wouter";
import { MapPin, Heart, Tag, ThumbsUp, Sparkles, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { HotelSearchResponse, HotelFeaturedResponse, SemanticHotel } from "@shared/routes";
import { usePreferences } from "@/context/preferences";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

type SearchHotel = HotelSearchResponse[0];
type FeaturedHotel = HotelFeaturedResponse[0];

export type DealBadge = "great-deal" | "good-value" | null;

interface HotelCardProps {
  hotel: SearchHotel | FeaturedHotel | SemanticHotel;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  variant?: "search" | "featured";
  dealBadge?: DealBadge;
  isCompared?: boolean;
  onToggleCompare?: () => void;
  compareDisabled?: boolean;
}

function getRatingKey(rating: number | null): string {
  if (!rating) return "hotel.new";
  if (rating >= 9.0) return "hotel.exceptional";
  if (rating >= 8.5) return "hotel.fabulous";
  if (rating >= 8.0) return "hotel.wonderful";
  if (rating >= 7.0) return "hotel.very_good";
  if (rating >= 6.0) return "hotel.good";
  return "hotel.good";
}

function StarDisplay({ stars }: { stars: number | null }) {
  if (!stars) return null;
  const full = Math.floor(stars);
  const total = 5;
  return (
    <div className="flex items-center gap-0.5 mb-2">
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < full ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
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
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
];

function getFallbackImage(hotelId: string): string {
  let hash = 0;
  for (let i = 0; i < hotelId.length; i++) {
    hash = (hash * 31 + hotelId.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

function getNights(checkIn?: string, checkOut?: string): number | null {
  if (!checkIn || !checkOut) return null;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : null;
}

function getWishlistKey(hotelId: string) {
  return `wishlist_${hotelId}`;
}

export function HotelCard({ hotel, checkIn, checkOut, guests, variant = "search", dealBadge, isCompared, onToggleCompare, compareDisabled }: HotelCardProps) {
  const { currency } = usePreferences();
  const { t } = useTranslation();
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(localStorage.getItem(getWishlistKey(hotel.id)) === "1");
  }, [hotel.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !wishlisted;
    setWishlisted(next);
    if (next) {
      localStorage.setItem(getWishlistKey(hotel.id), "1");
    } else {
      localStorage.removeItem(getWishlistKey(hotel.id));
    }
  };

  const params = new URLSearchParams();
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests) params.set("guests", guests);
  const reviewCount = "reviewCount" in hotel ? (hotel as any).reviewCount as number | null : null;
  if (reviewCount) params.set("reviewCount", String(reviewCount));
  const detailsUrl = `/hotel/${hotel.id}?${params.toString()}`;

  const label = t(getRatingKey(hotel.rating));
  const rawPrice = "price" in hotel ? (hotel as any).price as number | null : null;
  const price = rawPrice && rawPrice > 0 ? rawPrice : null;
  const nights = getNights(checkIn, checkOut) ?? 1;
  const stars = "stars" in hotel ? (hotel as any).stars as number | null : null;

  return (
    <Link href={detailsUrl} data-testid={`card-hotel-${hotel.id}`}>
      <div className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={hotel.imageUrl || getFallbackImage(hotel.id)}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getFallbackImage(hotel.id);
            }}
          />
          <button
            onClick={toggleWishlist}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            data-testid={`button-wishlist-${hotel.id}`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-slate-400"}`}
            />
          </button>

          {onToggleCompare && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCompare(); }}
              disabled={compareDisabled && !isCompared}
              className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shadow transition-all ${
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

          {dealBadge === "great-deal" && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md" data-testid={`badge-deal-${hotel.id}`}>
              <Tag className="w-3 h-3" />
              Great Deal
            </div>
          )}
          {dealBadge === "good-value" && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500 text-white text-xs font-bold shadow-md" data-testid={`badge-value-${hotel.id}`}>
              <ThumbsUp className="w-3 h-3" />
              Good Value
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <StarDisplay stars={stars} />

          <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
            {hotel.name}
          </h3>

          <div className="flex items-center text-muted-foreground text-xs mb-2">
            <MapPin className="w-3 h-3 mr-1 shrink-0 text-muted-foreground" />
            <span className="line-clamp-1">{hotel.address}</span>
          </div>

          {/* Semantic Badges */}
          {(hotel as any).persona || (hotel as any).style || ((hotel as any).semanticTags && (hotel as any).semanticTags.length > 0) ? (
            <div className="flex flex-wrap gap-1 mb-3">
              {(hotel as any).persona && (
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {(hotel as any).persona}
                </Badge>
              )}
              {(hotel as any).style && (
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  {(hotel as any).style}
                </Badge>
              )}
              {(hotel as any).semanticTags?.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          {/* Bottom row: rating left, price right */}
          <div className="mt-auto flex items-end justify-between gap-2 flex-wrap">
            {/* Rating */}
            <div className="flex items-center gap-1.5 min-w-0">
              {hotel.rating ? (
                <>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {hotel.rating % 1 === 0 ? hotel.rating.toFixed(0) : hotel.rating.toFixed(1)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground leading-tight">{label}</div>
                    {reviewCount ? (
                      <div className="text-xs text-muted-foreground">{reviewCount.toLocaleString()} Reviews</div>
                    ) : null}
                  </div>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No reviews yet</span>
              )}
            </div>

            {/* Price */}
            {price !== null ? (
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-foreground">{new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(price)}</div>
                <div className="text-xs text-muted-foreground">{t("hotel.incl_taxes")}</div>
              </div>
            ) : (
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-primary">{t("hotel.check_rates")}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

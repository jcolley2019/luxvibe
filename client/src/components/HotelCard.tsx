import { Link } from "wouter";
import { MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { HotelSearchResponse, HotelFeaturedResponse } from "@shared/routes";

type SearchHotel = HotelSearchResponse[0];
type FeaturedHotel = HotelFeaturedResponse[0];

interface HotelCardProps {
  hotel: SearchHotel | FeaturedHotel;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  variant?: "search" | "featured";
}

function getRatingLabel(rating: number | null): { label: string; color: string } {
  if (!rating) return { label: "New", color: "bg-slate-100 text-slate-600" };
  if (rating >= 4.5) return { label: "Exceptional", color: "bg-emerald-600 text-white" };
  if (rating >= 4.0) return { label: "Wonderful", color: "bg-emerald-500 text-white" };
  if (rating >= 3.5) return { label: "Excellent", color: "bg-blue-600 text-white" };
  if (rating >= 3.0) return { label: "Very Good", color: "bg-blue-500 text-white" };
  if (rating >= 2.5) return { label: "Good", color: "bg-blue-400 text-white" };
  return { label: "Reviewed", color: "bg-slate-400 text-white" };
}

function getWishlistKey(hotelId: string) {
  return `wishlist_${hotelId}`;
}

export function HotelCard({ hotel, checkIn, checkOut, guests, variant = "search" }: HotelCardProps) {
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
  const detailsUrl = `/hotel/${hotel.id}?${params.toString()}`;

  const { label, color } = getRatingLabel(hotel.rating);
  const hasPrice = "price" in hotel && (hotel as SearchHotel).price > 0;
  const price = hasPrice ? (hotel as SearchHotel).price : null;

  return (
    <Link href={detailsUrl} data-testid={`card-hotel-${hotel.id}`}>
      <div className="group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full cursor-pointer">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {hotel.imageUrl ? (
            <img
              src={hotel.imageUrl}
              alt={hotel.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400 text-sm">
              No Image
            </div>
          )}

          <button
            onClick={toggleWishlist}
            className="absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            data-testid={`button-wishlist-${hotel.id}`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-slate-500"}`}
            />
          </button>

          {"city" in hotel && (hotel as FeaturedHotel).city && (
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
              {(hotel as FeaturedHotel).city}
            </div>
          )}

          {price !== null && (
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-foreground text-sm font-bold px-3 py-1 rounded-full shadow-sm">
              ${price}<span className="text-muted-foreground font-normal text-xs">/night</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
            {hotel.name}
          </h3>
          <div className="flex items-center text-muted-foreground text-xs mb-3">
            <MapPin className="w-3 h-3 mr-1 shrink-0" />
            <span className="line-clamp-1">{hotel.address}</span>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hotel.rating ? (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>
                  {hotel.rating.toFixed(1)}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
              data-testid={`button-view-${hotel.id}`}
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

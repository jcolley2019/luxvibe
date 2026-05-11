import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Clock, X, Star, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RecentHotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  stars: number | null;
  rating: number | null;
  reviewCount: number | null;
  price: number | null;
  imageUrl: string | null;
};

function getRatingLabel(rating: number): string {
  if (rating >= 9.5) return "Exceptional";
  if (rating >= 9.0) return "Wonderful";
  if (rating >= 8.5) return "Excellent";
  if (rating >= 8.0) return "Very Good";
  if (rating >= 7.0) return "Good";
  return "Pleasant";
}

function loadRecent(): RecentHotel[] {
  try {
    return JSON.parse(localStorage.getItem("recentlyViewedHotels") || "[]");
  } catch {
    return [];
  }
}

export function RecentlyViewedDrawer() {
  const [open, setOpen] = useState(false);
  const [hotels, setHotels] = useState<RecentHotel[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [, navigate] = useLocation();

  const refresh = useCallback(() => setHotels(loadRecent()), []);

  useEffect(() => {
    refresh();
  }, [open, refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("recently-viewed-updated", handler);
    return () => window.removeEventListener("recently-viewed-updated", handler);
  }, [refresh]);

  if (hotels.length === 0 && !open) return null;

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            data-testid="overlay-recently-viewed"
          />
          <div className="fixed right-0 top-0 h-full w-[360px] max-w-[calc(100vw-2rem)] bg-background border-l border-border shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Recently Viewed</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {hotels.length}
                </Badge>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-8 w-8"
                data-testid="button-close-recently-viewed"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2" style={{ scrollbarWidth: "thin" }}>
              {hotels.map((hotel) => (
                <button
                  key={hotel.id}
                  onClick={() => {
                    navigate(`/hotel/${hotel.id}`);
                    setOpen(false);
                  }}
                  className="w-full flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-muted/20 transition-colors text-left group"
                  data-testid={`card-recent-hotel-${hotel.id}`}
                >
                  {hotel.imageUrl ? (
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {hotel.name}
                    </p>
                    {hotel.city && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {hotel.city}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {hotel.stars && hotel.stars > 0 && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: Math.min(hotel.stars, 5) }).map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                      {hotel.rating && hotel.rating > 0 && (
                        <span className="text-[10px] font-semibold text-primary">
                          {hotel.rating.toFixed(1)} · {getRatingLabel(hotel.rating)}
                        </span>
                      )}
                    </div>
                    {hotel.price && hotel.price > 0 && (
                      <p className="text-xs font-semibold text-foreground mt-0.5">
                        From ${hotel.price.toFixed(0)}<span className="font-normal text-muted-foreground">/night</span>
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={() => {
                  localStorage.removeItem("recentlyViewedHotels");
                  setHotels([]);
                  setOpen(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-clear-recently-viewed"
              >
                Clear history
              </button>
            </div>
          </div>
        </>
      )}

      <div className="fixed bottom-20 right-4 z-40" style={{ bottom: "5.5rem" }}>
        <div className="relative">
          <Button
            onClick={() => {
              refresh();
              setOpen((o) => !o);
            }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            variant="outline"
            className="rounded-full shadow-md h-10 w-10 p-0 bg-background border-border hover:border-primary/50"
            data-testid="button-recently-viewed"
          >
            <Clock className="w-4 h-4" />
          </Button>
          {hotels.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center pointer-events-none">
              {hotels.length > 9 ? "9+" : hotels.length}
            </span>
          )}
          {tooltipVisible && !open && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
              Recently viewed
            </div>
          )}
        </div>
      </div>
    </>
  );
}

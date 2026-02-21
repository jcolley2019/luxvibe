import { Link } from "wouter";
import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HotelSearchResponse } from "@shared/routes";

interface HotelCardProps {
  hotel: HotelSearchResponse[0];
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

export function HotelCard({ hotel, checkIn, checkOut, guests }: HotelCardProps) {
  // Build details link with current search params to persist them
  const params = new URLSearchParams();
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests) params.set("guests", guests);
  
  const detailsUrl = `/hotel/${hotel.id}?${params.toString()}`;

  return (
    <div className="group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden">
        {hotel.imageUrl ? (
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 text-foreground hover:bg-white backdrop-blur-sm shadow-sm">
            ${hotel.price} <span className="text-muted-foreground font-normal ml-1">/ night</span>
          </Badge>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {hotel.name}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {hotel.address}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="ml-1.5 font-semibold text-sm">{hotel.rating || "New"}</span>
            {hotel.rating && <span className="text-muted-foreground text-xs ml-1">(120 reviews)</span>}
          </div>
          
          <Link href={detailsUrl}>
            <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

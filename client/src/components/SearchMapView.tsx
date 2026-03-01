import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Star, X } from "lucide-react";
import { useLocation } from "wouter";

export interface SearchMapHotel {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  price?: number | null;
  stars?: number | null;
  rating?: number | null;
  imageUrl?: string | null;
  address?: string;
  city?: string;
}

interface SearchMapViewProps {
  hotels: SearchMapHotel[];
  center?: { lat: number; lng: number } | null;
  currency?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

function formatPrice(price: number | null | undefined, currency: string): string {
  if (!price || price <= 0) return "";
  return `${currency === "USD" ? "$" : currency + " "}${Math.round(price)}`;
}

function createPriceIcon(label: string, selected: boolean) {
  const bg = selected ? "#7c3aed" : "#ffffff";
  const color = selected ? "#ffffff" : "#111827";
  const border = selected ? "#7c3aed" : "#d1d5db";
  const shadow = selected
    ? "0 4px 12px rgba(124,58,237,0.5)"
    : "0 2px 8px rgba(0,0,0,0.15)";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:${color};border:2px solid ${border};padding:4px 9px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:${shadow};cursor:pointer;transition:all 0.15s;line-height:1.3;font-family:sans-serif;">${label || "·"}</div>`,
    iconSize: [label ? label.length * 8 + 20 : 24, 28],
    iconAnchor: [label ? (label.length * 8 + 20) / 2 : 12, 14],
  });
}

function createDotIcon(selected: boolean) {
  const bg = selected ? "#7c3aed" : "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:10px;height:10px;background:${bg};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

export function SearchMapView({ hotels, center, currency = "USD", checkIn, checkOut, guests }: SearchMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<SearchMapHotel | null>(null);
  const [, navigate] = useLocation();

  const hotelsWithCoords = hotels.filter(
    h => h.lat != null && h.lng != null && typeof h.lat === "number" && typeof h.lng === "number" && isFinite(h.lat) && isFinite(h.lng)
  );

  const computedCenter = center || (hotelsWithCoords.length > 0
    ? {
        lat: hotelsWithCoords.reduce((s, h) => s + h.lat!, 0) / hotelsWithCoords.length,
        lng: hotelsWithCoords.reduce((s, h) => s + h.lng!, 0) / hotelsWithCoords.length,
      }
    : null);

  const selectHotel = useCallback((hotel: SearchMapHotel | null) => {
    setSelectedId(hotel?.id ?? null);
    setSelectedHotel(hotel);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !computedCenter) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [computedCenter.lat, computedCenter.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    for (const hotel of hotelsWithCoords) {
      const label = formatPrice(hotel.price, currency);
      const marker = L.marker([hotel.lat!, hotel.lng!], {
        icon: label ? createPriceIcon(label, false) : createDotIcon(false),
        zIndexOffset: hotel.price && hotel.price > 0 ? 100 : 0,
      }).addTo(map);

      marker.on("click", () => {
        selectHotel(hotel);
        map.panTo([hotel.lat!, hotel.lng!], { animate: true, duration: 0.4 });
      });

      markersRef.current.set(hotel.id, marker);
    }

    map.on("click", () => selectHotel(null));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
  }, [computedCenter?.lat, computedCenter?.lng]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current.entries()) {
      const hotel = hotelsWithCoords.find(h => h.id === id);
      if (!hotel) continue;
      const isSelected = id === selectedId;
      const label = formatPrice(hotel.price, currency);
      marker.setIcon(label ? createPriceIcon(label, isSelected) : createDotIcon(isSelected));
      if (isSelected) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(hotel.price && hotel.price > 0 ? 100 : 0);
    }
  }, [selectedId, currency]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    for (const [id, marker] of markersRef.current.entries()) {
      const hotel = hotelsWithCoords.find(h => h.id === id);
      if (!hotel) { marker.remove(); markersRef.current.delete(id); continue; }
    }
    for (const hotel of hotelsWithCoords) {
      if (!markersRef.current.has(hotel.id) && mapInstanceRef.current) {
        const label = formatPrice(hotel.price, currency);
        const isSelected = hotel.id === selectedId;
        const marker = L.marker([hotel.lat!, hotel.lng!], {
          icon: label ? createPriceIcon(label, isSelected) : createDotIcon(isSelected),
          zIndexOffset: hotel.price && hotel.price > 0 ? 100 : 0,
        }).addTo(mapInstanceRef.current);
        marker.on("click", () => {
          selectHotel(hotel);
          mapInstanceRef.current?.panTo([hotel.lat!, hotel.lng!], { animate: true, duration: 0.4 });
        });
        markersRef.current.set(hotel.id, marker);
      }
    }
  }, [hotels.length]);

  const goToHotel = (hotel: SearchMapHotel) => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    navigate(`/hotel/${hotel.id}?${params.toString()}`);
  };

  if (!computedCenter) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-muted/30 text-center" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
        <div>
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">No hotel locations available yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Coordinates are loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
      <div ref={mapRef} className="w-full h-full" />

      {hotelsWithCoords.length < hotels.length && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-white/90 dark:bg-card/90 backdrop-blur-sm text-xs text-muted-foreground px-3 py-1.5 rounded-full shadow border border-border/50">
          Showing {hotelsWithCoords.length} of {hotels.length} hotels on map
        </div>
      )}

      {selectedHotel && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[900] w-80 bg-white dark:bg-card rounded-xl shadow-xl border border-border overflow-hidden" data-testid="map-hotel-card">
          <button
            onClick={() => selectHotel(null)}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center"
            data-testid="button-close-map-card"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex">
            {selectedHotel.imageUrl && (
              <div className="w-28 shrink-0">
                <img
                  src={selectedHotel.imageUrl}
                  alt={selectedHotel.name}
                  className="w-full h-full object-cover"
                  style={{ height: 110 }}
                />
              </div>
            )}
            <div className="flex-1 p-3 min-w-0">
              <p className="font-semibold text-sm leading-snug line-clamp-2">{selectedHotel.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {selectedHotel.stars && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.round(selectedHotel.stars) }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}
                {selectedHotel.rating && (
                  <span className="text-xs font-semibold text-emerald-600">{selectedHotel.rating.toFixed(1)}</span>
                )}
              </div>
              {selectedHotel.price && selectedHotel.price > 0 && (
                <p className="text-primary font-bold text-sm mt-1">
                  {currency === "USD" ? "$" : currency + " "}{Math.round(selectedHotel.price)}<span className="text-xs font-normal text-muted-foreground"> / night</span>
                </p>
              )}
              <button
                onClick={() => goToHotel(selectedHotel)}
                className="mt-2 w-full bg-primary text-primary-foreground rounded-lg text-xs font-semibold py-1.5 hover:bg-primary/90 transition-colors"
                data-testid="button-map-view-hotel"
              >
                View hotel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon } from "lucide-react";

interface SearchMapThumbnailProps {
  center: { lat: number; lng: number };
  hotelCount: number;
  onClick: () => void;
}

export function SearchMapThumbnail({ center, hotelCount, onClick }: SearchMapThumbnailProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const centerIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#7c3aed;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(124,58,237,0.5);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker([center.lat, center.lng], { icon: centerIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center.lat, center.lng]);

  return (
    <div
      className="relative overflow-hidden rounded-t-xl cursor-pointer group"
      style={{ height: 150 }}
      onClick={onClick}
      role="button"
      aria-label="Show hotels on map"
      data-testid="button-map-thumbnail"
    >
      <div ref={mapRef} className="w-full h-full pointer-events-none" />

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <button
          className="flex items-center gap-2 bg-white text-foreground text-xs font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors w-full justify-center"
          data-testid="button-show-on-map"
        >
          <MapIcon className="w-3.5 h-3.5" />
          Show {hotelCount > 0 ? `${hotelCount} properties` : "hotels"} on map
        </button>
      </div>
    </div>
  );
}

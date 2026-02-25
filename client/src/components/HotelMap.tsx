import { useEffect, useRef, useState } from "react";
import { X, Navigation, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapHotel {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  price?: number | null;
  rating?: number | null;
  stars?: number | null;
  imageUrl?: string | null;
}

interface HotelMapProps {
  hotel: MapHotel & { address?: string };
  nearbyHotels?: MapHotel[];
  currency?: string;
  onClose: () => void;
  onHotelClick?: (id: string) => void;
}

function createPriceMarker(price: string | null, isMain: boolean, imageUrl?: string | null) {
  if (isMain && imageUrl) {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:56px;height:56px;border-radius:12px;border:3px solid #7c3aed;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
          <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        ${price ? `<div style="margin-top:2px;background:#7c3aed;color:white;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${price}</div>` : ""}
      </div>`,
      iconSize: [60, 80],
      iconAnchor: [30, 80],
    });
  }

  if (price) {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="background:white;color:#1a1a1a;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1.5px solid #e5e7eb;cursor:pointer;transition:all 0.15s;">${price}</div>`,
      iconSize: [80, 30],
      iconAnchor: [40, 15],
    });
  }

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:12px;height:12px;background:#7c3aed;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export function HotelMap({ hotel, nearbyHotels = [], currency = "USD", onClose, onHotelClick }: HotelMapProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !hotel.lat || !hotel.lng) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [hotel.lat, hotel.lng],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const mainPrice = hotel.price ? `${currency} ${hotel.price}` : null;
    const mainMarker = L.marker([hotel.lat, hotel.lng], {
      icon: createPriceMarker(mainPrice, true, hotel.imageUrl),
      zIndexOffset: 1000,
    }).addTo(map);
    mainMarker.bindPopup(`<b>${hotel.name}</b><br/>${hotel.address || ""}`);

    for (const nearby of nearbyHotels) {
      if (!nearby.lat || !nearby.lng) continue;
      const priceLabel = nearby.price ? `${currency}${Math.round(nearby.price)}` : null;
      const marker = L.marker([nearby.lat, nearby.lng], {
        icon: createPriceMarker(priceLabel, false),
      }).addTo(map);

      marker.bindPopup(`<b>${nearby.name}</b>${nearby.price ? `<br/>${currency} ${nearby.price}` : ""}`);
      if (onHotelClick) {
        marker.on("click", () => onHotelClick(nearby.id));
      }
    }

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [hotel.lat, hotel.lng]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && hotel.lat && hotel.lng) {
      mapInstanceRef.current.setView([hotel.lat, hotel.lng], 14, { animate: true });
    }
  };

  if (!hotel.lat || !hotel.lng) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-stretch" data-testid="hotel-map-overlay">
      <div className="relative w-full h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000] bg-white dark:bg-card rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-muted transition-colors"
          data-testid="button-close-map"
        >
          <X className="w-5 h-5" />
        </button>

        <button
          onClick={handleRecenter}
          className="absolute bottom-6 left-4 z-[1000] bg-white dark:bg-card rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-gray-100 dark:hover:bg-muted transition-colors text-sm font-medium"
          data-testid="button-recenter-map"
        >
          <Navigation className="w-4 h-4" />
          {t("hotel.recenter") || "Re-center"}
        </button>

        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}

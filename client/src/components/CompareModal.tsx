import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/context/preferences";
import { Link } from "wouter";

type CompareHotel = {
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
};

interface CompareModalProps {
  hotels: CompareHotel[];
  open: boolean;
  onClose: () => void;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
];

function getFallback(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_IMAGES[h % FALLBACK_IMAGES.length];
}

function StarRow({ stars }: { stars: number | null | undefined }) {
  if (!stars) return <span className="text-sm text-muted-foreground">—</span>;
  const full = Math.floor(stars);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < full ? "text-amber-400" : "text-slate-200 dark:text-slate-700"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{stars}-star</span>
    </div>
  );
}

function hasFeature(facilities: string[] | undefined, keywords: string[]): boolean {
  if (!facilities?.length) return false;
  const lower = facilities.map(f => f.toLowerCase());
  return keywords.some(k => lower.some(f => f.includes(k)));
}

const AMENITY_GROUPS = [
  {
    label: "FACILITIES & SERVICES",
    rows: [
      { label: "Free WiFi", keywords: ["wifi", "wi-fi", "wireless", "internet"] },
      { label: "Swimming Pool", keywords: ["pool", "swimming"] },
      { label: "Fitness / Gym", keywords: ["fitness", "gym", "exercise"] },
      { label: "Spa & Wellness", keywords: ["spa", "wellness", "sauna", "steam"] },
      { label: "Restaurant", keywords: ["restaurant", "dining"] },
      { label: "Bar / Lounge", keywords: ["bar", "lounge"] },
      { label: "Room Service", keywords: ["room service"] },
      { label: "Business Center", keywords: ["business center"] },
      { label: "Meeting Rooms", keywords: ["meeting room", "conference"] },
      { label: "Concierge", keywords: ["concierge"] },
      { label: "24-Hr Front Desk", keywords: ["24-hour", "24 hour", "front desk"] },
      { label: "Luggage Storage", keywords: ["luggage"] },
      { label: "Laundry", keywords: ["laundry", "dry cleaning"] },
    ],
  },
  {
    label: "ROOM FEATURES",
    rows: [
      { label: "Air Conditioning", keywords: ["air condition", "hvac", "climate"] },
      { label: "Mini Fridge / Minibar", keywords: ["mini bar", "minibar", "mini-bar", "fridge", "refrigerator"] },
      { label: "In-Room Safe", keywords: ["safe", "safety box"] },
      { label: "Flat-screen TV", keywords: ["tv", "television", "flat-screen"] },
      { label: "Coffee / Tea Maker", keywords: ["coffee", "tea maker", "kettle"] },
    ],
  },
  {
    label: "TRANSPORT & PARKING",
    rows: [
      { label: "Free Parking", keywords: ["free parking", "parking"] },
      { label: "Valet Parking", keywords: ["valet"] },
      { label: "Airport Shuttle", keywords: ["airport shuttle", "shuttle"] },
      { label: "EV Charging", keywords: ["ev charging", "electric vehicle", "charging station"] },
    ],
  },
  {
    label: "FAMILY & ACCESSIBILITY",
    rows: [
      { label: "Pet Friendly", keywords: ["pet", "dog friendly", "cat friendly"] },
      { label: "Kids Facilities", keywords: ["kids", "children", "family"] },
      { label: "Wheelchair Accessible", keywords: ["wheelchair", "accessible", "disability"] },
      { label: "Crib / Extra Bed", keywords: ["crib", "extra bed", "rollaway"] },
    ],
  },
  {
    label: "FOOD & DRINK",
    rows: [
      { label: "Breakfast Included", keywords: ["breakfast"] },
      { label: "All-Inclusive", keywords: ["all inclusive", "all-inclusive"] },
    ],
  },
];

const LABEL_COL_STYLE = "w-36 min-w-[144px] max-w-[144px]";
const HOTEL_COL_STYLE = "min-w-[220px]";

const BG_MUTED = "hsl(var(--muted))";
const BG_PAGE = "hsl(var(--background))";

export function CompareModal({ hotels, open, onClose, checkIn, checkOut, guests }: CompareModalProps) {
  const { currency } = usePreferences();

  const [enrichedHotels, setEnrichedHotels] = useState<CompareHotel[]>(hotels);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setEnrichedHotels(hotels);
  }, [hotels]);

  useEffect(() => {
    if (!open) return;
    hotels.forEach(async (h) => {
      if (h.facilities && h.facilities.length > 0) return;
      if (loadingIds.has(h.id)) return;
      setLoadingIds(prev => new Set(prev).add(h.id));
      try {
        const params = new URLSearchParams();
        if (checkIn) params.set("checkIn", checkIn);
        if (checkOut) params.set("checkOut", checkOut);
        if (guests) params.set("guests", guests);
        const res = await fetch(`/api/hotel/${h.id}?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        const fetched: string[] = Array.isArray(data.amenities)
          ? data.amenities.filter((a: any) => typeof a === "string" && a !== "Contact hotel for amenities")
          : [];
        setEnrichedHotels(prev => prev.map(eh =>
          eh.id === h.id ? { ...eh, facilities: fetched } : eh
        ));
      } catch {
      } finally {
        setLoadingIds(prev => { const s = new Set(prev); s.delete(h.id); return s; });
      }
    });
  }, [open, hotels]);

  const buildUrl = (id: string) => {
    const p = new URLSearchParams();
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    if (guests) p.set("guests", guests);
    return `/hotel/${id}?${p.toString()}`;
  };

  const fmt = (price: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

  const getRatingLabel = (r: number | null | undefined) => {
    if (!r) return null;
    if (r >= 9.0) return "Exceptional";
    if (r >= 8.5) return "Fabulous";
    if (r >= 8.0) return "Wonderful";
    if (r >= 7.0) return "Very Good";
    return "Good";
  };

  const handleViewHotel = () => {
    sessionStorage.setItem("lv_compare_return_v1", JSON.stringify({
      hotels: enrichedHotels,
      returnUrl: window.location.href,
    }));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden rounded-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        aria-describedby={undefined}
        data-testid="compare-modal"
      >
        <DialogTitle className="sr-only">Compare Hotels</DialogTitle>

        {/* Fixed modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-2xl font-bold font-heading text-foreground" aria-hidden="true">Compare Hotels</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            data-testid="button-compare-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-auto flex-1" style={{ scrollbarWidth: "thin" }}>
          <table className="border-collapse" style={{ minWidth: `${144 + enrichedHotels.length * 220}px`, width: "100%" }}>
            <colgroup>
              <col style={{ width: "144px", minWidth: "144px" }} />
              {enrichedHotels.map(h => <col key={h.id} style={{ minWidth: "220px" }} />)}
            </colgroup>

            {/* Sticky header: Photo + Name */}
            <thead>
              {/* Photo row */}
              <tr className="border-b border-border" style={{ position: "sticky", top: 0, zIndex: 20, background: BG_PAGE }}>
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle`}
                  style={{ position: "sticky", left: 0, zIndex: 30, background: BG_MUTED }}
                >
                  Photo
                </td>
                {enrichedHotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-3 align-top`} style={{ background: BG_PAGE }}>
                    <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                      <img
                        src={h.imageUrl || getFallback(h.id)}
                        alt={h.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = getFallback(h.id); }}
                        data-testid={`compare-img-${h.id}`}
                      />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Name & Location row */}
              <tr className="border-b border-border" style={{ position: "sticky", top: 152, zIndex: 20, background: BG_PAGE }}>
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-top`}
                  style={{ position: "sticky", left: 0, zIndex: 30, background: BG_MUTED }}
                >
                  Name & Location
                </td>
                {enrichedHotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-3 align-top`} style={{ background: BG_PAGE }}>
                    <p className="font-bold text-sm text-foreground leading-snug" data-testid={`compare-name-${h.id}`}>{h.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{h.address}</p>
                  </td>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Star Rating */}
              <tr className="border-b border-border">
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle`}
                  style={{ position: "sticky", left: 0, zIndex: 10, background: BG_MUTED }}
                >
                  Star Rating
                </td>
                {enrichedHotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-3 align-middle`}>
                    <StarRow stars={h.stars} />
                  </td>
                ))}
              </tr>

              {/* Guest Rating */}
              <tr className="border-b border-border">
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle`}
                  style={{ position: "sticky", left: 0, zIndex: 10, background: BG_MUTED }}
                >
                  Guest Rating
                </td>
                {enrichedHotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-3 align-middle`} data-testid={`compare-rating-${h.id}`}>
                    {h.rating ? (
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-lg bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                          {h.rating % 1 === 0 ? h.rating.toFixed(0) : h.rating.toFixed(1)}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{getRatingLabel(h.rating)}</p>
                          {h.reviewCount ? (
                            <p className="text-xs text-muted-foreground">{h.reviewCount.toLocaleString()} reviews</p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No reviews yet</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Price / Night */}
              <tr className="border-b border-border">
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle`}
                  style={{ position: "sticky", left: 0, zIndex: 10, background: BG_MUTED }}
                >
                  Price / Night
                </td>
                {enrichedHotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-3 align-middle`} data-testid={`compare-price-${h.id}`}>
                    {h.price && h.price > 0 ? (
                      <div>
                        <span className="text-xl font-bold text-foreground">{fmt(h.price)}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">incl. taxes & fees</p>
                      </div>
                    ) : (
                      <span className="text-sm text-primary font-medium">Check rates</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Amenity Groups — flattened to avoid React.Fragment with injected props */}
              {AMENITY_GROUPS.flatMap(group => [
                <tr key={`grp-${group.label}`} className="border-b border-border/50">
                  <td
                    colSpan={1 + enrichedHotels.length}
                    className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    style={{ background: BG_MUTED }}
                  >
                    {group.label}
                  </td>
                </tr>,
                ...group.rows.map(row => (
                  <tr key={`row-${group.label}-${row.label}`} className="border-b border-border/40">
                    <td
                      className={`${LABEL_COL_STYLE} px-4 py-2.5 text-xs text-muted-foreground`}
                      style={{ position: "sticky", left: 0, zIndex: 10, background: BG_PAGE }}
                    >
                      {row.label}
                    </td>
                    {enrichedHotels.map(h => (
                      <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-2.5 align-middle`}>
                        {loadingIds.has(h.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        ) : hasFeature(h.facilities, row.keywords) ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )),
              ])}

              {/* Action row */}
              <tr>
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-4`}
                  style={{ position: "sticky", left: 0, zIndex: 10, background: BG_MUTED }}
                />
                {enrichedHotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-4 align-middle`}>
                    <Link href={buildUrl(h.id)} onClick={handleViewHotel}>
                      <Button
                        className="w-full rounded-xl text-sm font-semibold"
                        data-testid={`compare-view-${h.id}`}
                      >
                        View Hotel
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

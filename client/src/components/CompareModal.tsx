import { useState, useEffect } from "react";
import { Check } from "lucide-react";
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

const LABEL_COL_STYLE = "w-44 min-w-[176px] max-w-[176px]";
const HOTEL_COL_STYLE = "min-w-[220px]";

const BG_MUTED = "hsl(var(--muted))";
const BG_PAGE = "hsl(var(--background))";

export function CompareModal({ hotels, open, onClose, checkIn, checkOut, guests }: CompareModalProps) {
  const { currency } = usePreferences();

  const [enrichedFacilities, setEnrichedFacilities] = useState<Record<string, string[]>>({});
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  useEffect(() => {
    if (!open || hotels.length === 0) return;
    const hotelsNeedingFetch = hotels.filter(h => !h.facilities?.length);
    if (hotelsNeedingFetch.length === 0) return;
    setLoadingFacilities(true);
    Promise.all(
      hotelsNeedingFetch.map(async (h) => {
        try {
          const res = await fetch(`/api/hotels/${h.id}`);
          const data = await res.json();
          return { id: h.id, amenities: data.amenities || [] };
        } catch {
          return { id: h.id, amenities: [] };
        }
      })
    ).then(results => {
      const map: Record<string, string[]> = {};
      for (const r of results) map[r.id] = r.amenities;
      setEnrichedFacilities(map);
      setLoadingFacilities(false);
    });
  }, [open, hotels]);

  const getFacilities = (h: CompareHotel): string[] =>
    h.facilities?.length ? h.facilities : (enrichedFacilities[h.id] || []);

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
      hotels,
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

        {/* Fixed modal header — shadcn DialogContent provides its own close button */}
        <div className="flex items-center px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-2xl font-bold font-heading text-foreground">Compare Hotels</h2>
        </div>

        {/* Scrollable body */}
        <div className="overflow-auto flex-1" style={{ scrollbarWidth: "thin" }}>
          <table
            className="border-collapse"
            style={{
              tableLayout: "fixed",
              minWidth: `${176 + hotels.length * 220}px`,
              width: "100%",
            }}
          >
            <colgroup>
              <col style={{ width: "176px", minWidth: "176px" }} />
              {hotels.map(h => (
                <col
                  key={h.id}
                  style={{
                    width: `calc((100% - 176px) / ${hotels.length})`,
                    minWidth: "220px",
                  }}
                />
              ))}
            </colgroup>

            <thead />

            <tbody>
              {/* Combined Hotel Header row — sticky top:0 */}
              <tr
                className="border-b border-border"
                style={{ position: "sticky", top: 0, zIndex: 20, background: BG_PAGE, pointerEvents: "none" }}
              >
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-top`}
                  style={{ position: "sticky", left: 0, zIndex: 30, background: BG_MUTED, pointerEvents: "auto" }}
                >
                  Hotel
                </td>
                {hotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-3 align-top`} style={{ background: BG_PAGE, pointerEvents: "auto" }}>
                    <div className="aspect-video overflow-hidden rounded-xl bg-muted mb-3">
                      <img
                        src={h.imageUrl || getFallback(h.id)}
                        alt={h.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = getFallback(h.id); }}
                        data-testid={`compare-img-${h.id}`}
                      />
                    </div>
                    <p className="font-bold text-sm text-foreground leading-snug" data-testid={`compare-name-${h.id}`}>{h.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{h.address}</p>
                  </td>
                ))}
              </tr>

              {/* Star Rating */}
              <tr className="border-b border-border">
                <td
                  className={`${LABEL_COL_STYLE} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle`}
                  style={{ position: "sticky", left: 0, zIndex: 10, background: BG_MUTED }}
                >
                  Star Rating
                </td>
                {hotels.map(h => (
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
                {hotels.map(h => (
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
                {hotels.map(h => (
                  <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-3 align-middle`} data-testid={`compare-price-${h.id}`} style={{ position: "relative", zIndex: 25 }}>
                    {h.price && h.price > 0 ? (
                      <div>
                        <span className="text-xl font-bold text-foreground">{fmt(h.price)}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">incl. taxes & fees</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground leading-snug">
                        Visit hotel page &amp; set dates to see rates
                      </p>
                    )}
                  </td>
                ))}
              </tr>

              {/* Amenity Groups — flattened to avoid React.Fragment with injected props */}
              {AMENITY_GROUPS.flatMap(group => [
                <tr key={`grp-${group.label}`} className="border-b border-border/50">
                  <td
                    colSpan={1 + hotels.length}
                    className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    style={{ background: BG_MUTED }}
                  >
                    {group.label}{loadingFacilities && group.label === "FACILITIES & SERVICES" ? " ⏳" : ""}
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
                    {hotels.map(h => (
                      <td key={h.id} className={`${HOTEL_COL_STYLE} px-3 py-2.5 align-middle`}>
                        {hasFeature(getFacilities(h), row.keywords) ? (
                          <Check className="w-6 h-6 text-emerald-500 stroke-[3]" />
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
                {hotels.map(h => (
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

import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
        <svg key={i} className={`w-4 h-4 ${i < full ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">{stars}-star</span>
    </div>
  );
}

const ROW_LABELS = ["Photo", "Name & Location", "Star Rating", "Guest Rating", "Price / Night", "Facilities", ""];

export function CompareModal({ hotels, open, onClose, checkIn, checkOut, guests }: CompareModalProps) {
  const { currency } = usePreferences();

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-2xl" aria-describedby={undefined} data-testid="compare-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Compare Hotels</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            data-testid="button-compare-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-auto max-h-[75vh]" style={{ scrollbarWidth: "thin" }}>
          <table className="w-full border-collapse min-w-[600px]">
            <colgroup>
              <col style={{ width: "130px", minWidth: "130px" }} />
              {hotels.map(h => <col key={h.id} style={{ minWidth: "200px" }} />)}
            </colgroup>

            <tbody>
              {/* Photo row */}
              <tr className="border-b border-border">
                <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 align-middle sticky left-0 z-10">
                  Photo
                </td>
                {hotels.map(h => (
                  <td key={h.id} className="px-3 py-3 align-top">
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
              <tr className="border-b border-border">
                <td className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 align-top sticky left-0 z-10">
                  Name & Location
                </td>
                {hotels.map(h => (
                  <td key={h.id} className="px-3 py-4 align-top">
                    <p className="font-bold text-sm text-foreground leading-snug" data-testid={`compare-name-${h.id}`}>{h.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{h.address}</p>
                  </td>
                ))}
              </tr>

              {/* Stars row */}
              <tr className="border-b border-border">
                <td className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 align-middle sticky left-0 z-10">
                  Star Rating
                </td>
                {hotels.map(h => (
                  <td key={h.id} className="px-3 py-4 align-middle">
                    <StarRow stars={h.stars} />
                  </td>
                ))}
              </tr>

              {/* Guest Rating row */}
              <tr className="border-b border-border">
                <td className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 align-middle sticky left-0 z-10">
                  Guest Rating
                </td>
                {hotels.map(h => (
                  <td key={h.id} className="px-3 py-4 align-middle" data-testid={`compare-rating-${h.id}`}>
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

              {/* Price row */}
              <tr className="border-b border-border">
                <td className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 align-middle sticky left-0 z-10">
                  Price / Night
                </td>
                {hotels.map(h => (
                  <td key={h.id} className="px-3 py-4 align-middle" data-testid={`compare-price-${h.id}`}>
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

              {/* Facilities row */}
              <tr className="border-b border-border">
                <td className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 align-top sticky left-0 z-10">
                  Facilities
                </td>
                {hotels.map(h => (
                  <td key={h.id} className="px-3 py-4 align-top" data-testid={`compare-facilities-${h.id}`}>
                    {h.facilities && h.facilities.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {h.facilities.slice(0, 8).map(f => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground">
                            {f}
                          </span>
                        ))}
                        {h.facilities.length > 8 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground">
                            +{h.facilities.length - 8} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Action row */}
              <tr>
                <td className="px-4 py-4 bg-muted/30 sticky left-0 z-10" />
                {hotels.map(h => (
                  <td key={h.id} className="px-3 py-4 align-middle">
                    <Link href={buildUrl(h.id)} onClick={onClose}>
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

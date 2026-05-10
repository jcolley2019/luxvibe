import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Building2, Wifi, Car, Dumbbell, Waves, Coffee, ShieldCheck, Star, Globe } from "lucide-react";

interface Facility {
  facility_id: number;
  facility: string;
  sort?: number;
  translation?: { lang: string; facility: string }[];
}

function facilityIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("wifi") || n.includes("internet") || n.includes("wireless")) return <Wifi className="w-4 h-4" />;
  if (n.includes("pool") || n.includes("swim") || n.includes("aqua")) return <Waves className="w-4 h-4" />;
  if (n.includes("parking") || n.includes("garage") || n.includes("car park")) return <Car className="w-4 h-4" />;
  if (n.includes("gym") || n.includes("fitness") || n.includes("sport") || n.includes("tennis") || n.includes("golf")) return <Dumbbell className="w-4 h-4" />;
  if (n.includes("restaurant") || n.includes("bar") || n.includes("breakfast") || n.includes("dining") || n.includes("cafe") || n.includes("bistro")) return <Coffee className="w-4 h-4" />;
  if (n.includes("spa") || n.includes("sauna") || n.includes("wellness") || n.includes("massage") || n.includes("jacuzzi")) return <Star className="w-4 h-4" />;
  if (n.includes("security") || n.includes("safe") || n.includes("locker") || n.includes("guard")) return <ShieldCheck className="w-4 h-4" />;
  if (n.includes("language") || n.includes("tour") || n.includes("concierge") || n.includes("service")) return <Globe className="w-4 h-4" />;
  return <Building2 className="w-4 h-4" />;
}

export default function HotelFacilities() {
  const [search, setSearch] = useState("");
  const [showTranslations, setShowTranslations] = useState(false);

  const { data: facilities = [], isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/data/facilities"],
  });

  const filtered = facilities.filter(f => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (f.facility.toLowerCase().includes(q)) return true;
    if (String(f.facility_id).includes(q)) return true;
    if (showTranslations && f.translation?.some(t => t.facility.toLowerCase().includes(q))) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Hotel Facilities</h1>
              <p className="text-sm text-muted-foreground">Complete list of hotel facility types used in search filters</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search facilities by name or ID…"
              className="pl-9"
              data-testid="input-facility-search"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground self-center">
            <input
              type="checkbox"
              checked={showTranslations}
              onChange={e => setShowTranslations(e.target.checked)}
              className="rounded"
            />
            Search translations
          </label>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} of {facilities.length} facilities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(f => (
                <div
                  key={f.facility_id}
                  className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 hover:shadow-sm hover:border-primary/30 transition-all"
                  data-testid={`card-facility-${f.facility_id}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {facilityIcon(f.facility)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{f.facility}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">ID {f.facility_id}</span>
                      {f.translation && f.translation.length > 0 && (
                        <span className="text-xs text-primary/60">· {f.translation.length} langs</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

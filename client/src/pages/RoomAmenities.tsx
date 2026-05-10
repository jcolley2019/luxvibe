import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Tv, Wifi, Wind, Coffee, Bath, Shirt, ShieldCheck, Zap, Phone } from "lucide-react";

interface RoomAmenity {
  id: number;
  name: string;
  amenityGroup?: { id: number; name: string };
}

function amenityIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("tv") || n.includes("television") || n.includes("cable") || n.includes("screen")) return <Tv className="w-4 h-4" />;
  if (n.includes("wifi") || n.includes("internet") || n.includes("broadband")) return <Wifi className="w-4 h-4" />;
  if (n.includes("air") || n.includes("heating") || n.includes("fan")) return <Wind className="w-4 h-4" />;
  if (n.includes("coffee") || n.includes("tea") || n.includes("kettle") || n.includes("minibar") || n.includes("fridge")) return <Coffee className="w-4 h-4" />;
  if (n.includes("bath") || n.includes("shower") || n.includes("tub") || n.includes("toilet")) return <Bath className="w-4 h-4" />;
  if (n.includes("iron") || n.includes("laundry") || n.includes("washing")) return <Shirt className="w-4 h-4" />;
  if (n.includes("safe") || n.includes("locker") || n.includes("security")) return <ShieldCheck className="w-4 h-4" />;
  if (n.includes("electric") || n.includes("power") || n.includes("socket") || n.includes("outlet")) return <Zap className="w-4 h-4" />;
  if (n.includes("phone") || n.includes("telephone")) return <Phone className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
}

export default function RoomAmenities() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const { data: amenities = [], isLoading } = useQuery<RoomAmenity[]>({
    queryKey: ["/api/data/room-amenities"],
  });

  const groups = ["all", ...Array.from(new Set(
    amenities.map(a => a.amenityGroup?.name).filter(Boolean) as string[]
  )).sort()];

  const filtered = amenities.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || String(a.id).includes(q);
    const matchGroup = selectedGroup === "all" || a.amenityGroup?.name === selectedGroup;
    return matchSearch && matchGroup;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Room Amenities</h1>
              <p className="text-sm text-muted-foreground">All in-room amenity types used in hotel room listings</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search amenities…"
              className="pl-9"
              data-testid="input-amenity-search"
            />
          </div>
          {groups.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {groups.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedGroup === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  data-testid={`filter-group-${g}`}
                >
                  {g === "all" ? "All groups" : g}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No amenities found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} amenities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(a => (
                <div
                  key={a.id}
                  className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 hover:shadow-sm hover:border-primary/30 transition-all"
                  data-testid={`card-amenity-${a.id}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {amenityIcon(a.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">ID {a.id}</span>
                      {a.amenityGroup?.name && (
                        <span className="text-xs text-primary/70 truncate">· {a.amenityGroup.name}</span>
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

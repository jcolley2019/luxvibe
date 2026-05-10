import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";

interface RoomView {
  id: number;
  name: string;
}

const VIEW_EMOJI: Record<string, string> = {
  sea: "🌊", ocean: "🌊", beach: "🏖️", pool: "🏊", garden: "🌿",
  mountain: "⛰️", city: "🌆", skyline: "🌆", river: "🌊", lake: "🏞️",
  park: "🌳", court: "🎾", golf: "⛳", forest: "🌲", street: "🏙️",
  desert: "🏜️", harbor: "⚓", bay: "🌊", panoramic: "🌅", sunset: "🌅",
  sunrise: "🌄", interior: "🏠", atrium: "🏛️", lobby: "🏨",
};

function viewEmoji(name: string): string {
  const n = name.toLowerCase();
  for (const [key, emoji] of Object.entries(VIEW_EMOJI)) {
    if (n.includes(key)) return emoji;
  }
  return "👁️";
}

export default function RoomViews() {
  const [search, setSearch] = useState("");

  const { data: views = [], isLoading } = useQuery<RoomView[]>({
    queryKey: ["/api/data/room-views"],
  });

  const filtered = views.filter(v => {
    const q = search.toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || String(v.id).includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Room Views</h1>
              <p className="text-sm text-muted-foreground">All room view types available in hotel listings</p>
            </div>
          </div>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search room views…"
            className="pl-9"
            data-testid="input-view-search"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No room views found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} view types</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(v => (
                <div
                  key={v.id}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-sm hover:border-primary/30 transition-all"
                  data-testid={`card-view-${v.id}`}
                >
                  <span className="text-2xl">{viewEmoji(v.name)}</span>
                  <p className="text-sm font-medium text-foreground leading-tight">{v.name}</p>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">ID {v.id}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

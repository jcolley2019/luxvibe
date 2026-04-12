import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search,
  MapPin,
  CalendarDays,
  Users,
  Building2,
  Star,
  BedDouble,
  Plane,
  X,
  Plus,
  Minus,
  Navigation,
  Loader2,
  Sparkles,
  Heart,
  Waves,
  Gem,
  ChevronLeft,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import santoriniWater from "@assets/image_1772768514263.png";

const HERO_IMAGES = [
  santoriniWater,
  // Original locations
  // Hawaii & Tropical
  "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=1920&q=80", // hawaii beach
  "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=1920&q=80", // honolulu skyline
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80", // beach
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&q=80", // overwater bungalow
  "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=80", // new york skyline
  "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1920&q=80", // las vegas
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80", // paris
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80", // london
  "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1920&q=80", // miami beach
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&q=80", // bali resort
  "https://images.unsplash.com/photo-1549144511-f099e773c147?w=1920&q=80", // dubai skyline
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1920&q=80", // paris eiffel night
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80", // bali beach
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80", // luxury infinity pool
  // European monuments
  "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&q=80", // vatican st peter's square
  "https://images.unsplash.com/photo-1542833277-f9982d1581c0?w=1920&q=80", // leaning tower of pisa
  "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1920&q=80", // rome colosseum
  "https://images.unsplash.com/photo-1554992539-5c44fc26abb1?w=1920&q=80", // rome at night
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1920&q=80", // luxury resort pool
  // California — Los Angeles
  "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=1920&q=80", // los angeles skyline
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80", // santa monica pier
  "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1920&q=80", // malibu beach
  // California — San Francisco
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=80", // golden gate bridge
  "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1920&q=80", // san francisco bay
  // California — San Diego
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80", // san diego coronado
  // Denver & ski resorts
  "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1920&q=80", // denver skyline mountains
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80", // colorado rocky mountains
  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1920&q=80", // ski slopes
  "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1920&q=80", // ski resort village
];

const POPULAR_DESTINATIONS = [
  { displayName: "Las Vegas, NV", cityName: "Las Vegas", formattedAddress: "Nevada, United States" },
  { displayName: "New York, NY", cityName: "New York", formattedAddress: "New York, United States" },
  { displayName: "Miami, FL", cityName: "Miami", formattedAddress: "Florida, United States" },
  { displayName: "Los Angeles, CA", cityName: "Los Angeles", formattedAddress: "California, United States" },
  { displayName: "Paris", cityName: "Paris", formattedAddress: "Île-de-France, France" },
  { displayName: "London", cityName: "London", formattedAddress: "England, United Kingdom" },
  { displayName: "Dubai", cityName: "Dubai", formattedAddress: "Dubai, United Arab Emirates" },
  { displayName: "Chicago, IL", cityName: "Chicago", formattedAddress: "Illinois, United States" },
  { displayName: "San Francisco, CA", cityName: "San Francisco", formattedAddress: "California, United States" },
  { displayName: "Orlando, FL", cityName: "Orlando", formattedAddress: "Florida, United States" },
  { displayName: "Cancún", cityName: "Cancun", formattedAddress: "Quintana Roo, Mexico" },
  { displayName: "Barcelona", cityName: "Barcelona", formattedAddress: "Catalonia, Spain" },
  { displayName: "Rome", cityName: "Rome", formattedAddress: "Lazio, Italy" },
  { displayName: "Tokyo", cityName: "Tokyo", formattedAddress: "Tokyo, Japan" },
  { displayName: "Sydney", cityName: "Sydney", formattedAddress: "New South Wales, Australia" },
  { displayName: "Bangkok", cityName: "Bangkok", formattedAddress: "Bangkok, Thailand" },
  { displayName: "Bali", cityName: "Bali", formattedAddress: "Bali, Indonesia" },
  { displayName: "Amsterdam", cityName: "Amsterdam", formattedAddress: "North Holland, Netherlands" },
  { displayName: "Lisbon", cityName: "Lisbon", formattedAddress: "Lisbon, Portugal" },
  { displayName: "Maldives", cityName: "Maldives", formattedAddress: "Republic of Maldives" },
];

// Popular venues/neighborhoods shown when a city is detected in autocomplete results
const CITY_LANDMARKS: Record<string, Array<{ label: string; search: string }>> = {
  "denver": [
    { label: "🎸 Red Rocks", search: "Red Rocks Amphitheatre" },
    { label: "🏈 Empower Field", search: "Empower Field at Mile High" },
    { label: "🏒 Ball Arena", search: "Ball Arena Denver" },
    { label: "🍺 Coors Field", search: "Coors Field Denver" },
    { label: "🏙️ LoDo", search: "LoDo Denver" },
    { label: "🛍️ Cherry Creek", search: "Cherry Creek Denver" },
  ],
  "new york": [
    { label: "🗽 Statue of Liberty", search: "Statue of Liberty" },
    { label: "🌿 Central Park", search: "Central Park" },
    { label: "⏱️ Times Square", search: "Times Square" },
    { label: "🌉 Brooklyn Bridge", search: "Brooklyn Bridge" },
    { label: "🏢 Empire State Bldg", search: "Empire State Building" },
    { label: "🎭 Broadway", search: "Broadway New York" },
    { label: "🛍️ SoHo", search: "SoHo New York" },
    { label: "🏀 Madison Square Garden", search: "Madison Square Garden" },
  ],
  "las vegas": [
    { label: "✨ The Strip", search: "Las Vegas Strip" },
    { label: "🎰 Fremont Street", search: "Fremont Street Las Vegas" },
    { label: "🏘️ Henderson", search: "Henderson Nevada" },
    { label: "🏔️ Summerlin", search: "Summerlin Las Vegas" },
    { label: "🏈 Allegiant Stadium", search: "Allegiant Stadium Las Vegas" },
  ],
  "miami": [
    { label: "🏖️ South Beach", search: "South Beach Miami" },
    { label: "🌆 Brickell", search: "Brickell Miami" },
    { label: "🎨 Wynwood", search: "Wynwood Miami" },
    { label: "🌴 Coral Gables", search: "Coral Gables" },
    { label: "⛵ Coconut Grove", search: "Coconut Grove Miami" },
  ],
  "chicago": [
    { label: "🏙️ The Loop", search: "The Loop Chicago" },
    { label: "🛍️ Magnificent Mile", search: "Magnificent Mile Chicago" },
    { label: "⚾ Wrigley Field", search: "Wrigleyville Chicago" },
    { label: "🌊 Navy Pier", search: "Navy Pier Chicago" },
    { label: "🌳 Lincoln Park", search: "Lincoln Park Chicago" },
  ],
  "los angeles": [
    { label: "🎬 Hollywood", search: "Hollywood Los Angeles" },
    { label: "💎 Beverly Hills", search: "Beverly Hills" },
    { label: "🌊 Santa Monica", search: "Santa Monica" },
    { label: "🎡 Venice Beach", search: "Venice Beach Los Angeles" },
    { label: "🌴 Malibu", search: "Malibu California" },
  ],
  "san francisco": [
    { label: "🌉 Golden Gate", search: "Golden Gate Bridge" },
    { label: "🦭 Fisherman's Wharf", search: "Fisherman's Wharf San Francisco" },
    { label: "🏝️ Alcatraz Area", search: "Fisherman's Wharf San Francisco" },
    { label: "🏘️ Nob Hill", search: "Nob Hill San Francisco" },
    { label: "🌈 Castro", search: "Castro San Francisco" },
  ],
  "boston": [
    { label: "⚾ Fenway Park", search: "Fenway Park Boston" },
    { label: "🏛️ Faneuil Hall", search: "Faneuil Hall Boston" },
    { label: "🌿 Boston Common", search: "Boston Common" },
    { label: "🎓 Cambridge", search: "Cambridge Massachusetts" },
  ],
  "seattle": [
    { label: "🐟 Pike Place Market", search: "Pike Place Market Seattle" },
    { label: "🗼 Space Needle", search: "Space Needle Seattle" },
    { label: "🎨 Capitol Hill", search: "Capitol Hill Seattle" },
  ],
  "nashville": [
    { label: "🎸 Broadway/Honky Tonk", search: "Broadway Nashville" },
    { label: "🎵 Music Row", search: "Music Row Nashville" },
    { label: "🏘️ The Gulch", search: "The Gulch Nashville" },
    { label: "🌳 12 South", search: "12 South Nashville" },
  ],
  "new orleans": [
    { label: "🎷 French Quarter", search: "French Quarter" },
    { label: "🎺 Bourbon Street", search: "Bourbon Street New Orleans" },
    { label: "🌿 Garden District", search: "Garden District New Orleans" },
  ],
  "orlando": [
    { label: "🏰 Walt Disney World", search: "Walt Disney World" },
    { label: "🎢 Universal Studios", search: "Universal Studios Orlando" },
    { label: "🌴 International Drive", search: "International Drive Orlando" },
  ],
  "honolulu": [
    { label: "🏖️ Waikiki Beach", search: "Waikiki Beach Honolulu" },
    { label: "🌋 Diamond Head", search: "Diamond Head Honolulu" },
    { label: "⚓ Pearl Harbor", search: "Pearl Harbor Honolulu" },
  ],
  "washington": [
    { label: "🏛️ National Mall", search: "National Mall Washington DC" },
    { label: "🌸 Georgetown", search: "Georgetown Washington DC" },
    { label: "⚾ Capitol Hill", search: "Capitol Hill Washington DC" },
    { label: "🌊 Dupont Circle", search: "Dupont Circle Washington DC" },
  ],
};

interface SearchHeroProps {
  variant?: "hero" | "navbar";
  heroImage?: string;
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
}

export default function SearchHero({
  variant = "hero",
  heroImage: propHeroImage,
  initialDestination = "",
  initialCheckIn,
  initialCheckOut,
  initialGuests = "2",
}: SearchHeroProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [destination, setDestination] = useState(initialDestination);
  const [placeId, setPlaceId] = useState("");

  const selectedHeroImage = useMemo(
    () => HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)],
    [],
  );
  const heroImage = propHeroImage || selectedHeroImage;

  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>(
    () => {
      if (initialCheckIn && initialCheckOut) {
        try {
          return {
            from: new Date(initialCheckIn),
            to: new Date(initialCheckOut),
          };
        } catch {}
      }
      return undefined;
    },
  );

  const [rooms, setRooms] = useState<{ adults: number; children: number }[]>(
    () => {
      const total = parseInt(initialGuests) || 2;
      return [{ adults: total, children: 0 }];
    },
  );

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showMobileDestSheet, setShowMobileDestSheet] = useState(false);

  const [recentSearches, setRecentSearches] = useState<{ name: string; placeId?: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem("luxvibe_recent_searches") || "[]"); } catch { return []; }
  });

  const saveRecentSearch = (name: string, placeId?: string) => {
    if (!name || name === "Around my area") return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.name !== name);
      const updated = [{ name, placeId }, ...filtered].slice(0, 5);
      localStorage.setItem("luxvibe_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentSearch = (name: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.name !== name);
      localStorage.setItem("luxvibe_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const [dateOpen, setDateOpen] = useState(false);
  const [mobileDateOpen, setMobileDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [mobileGuestsOpen, setMobileGuestsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarWidth, setCalendarWidth] = useState<number | undefined>();
  const [selectionStep, setSelectionStep] = useState<"checkin" | "checkout">(
    "checkin",
  );
  const [geoLoading, setGeoLoading] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const mobileAutocompleteRef = useRef<HTMLDivElement>(null);
  const desktopSearchBarRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const datesButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
      saveRecentSearch(initialDestination);
    }
  }, [initialDestination]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!desktopSearchBarRef.current) return;
    const measure = () =>
      setCalendarWidth(desktopSearchBarRef.current?.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(desktopSearchBarRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
      if (
        mobileAutocompleteRef.current &&
        !mobileAutocompleteRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: places = [], isLoading: placesLoading } = useQuery({
    queryKey: ["/api/places", destination],
    enabled: destination.length >= 2 && showAutocomplete,
    staleTime: 60000,
    queryFn: async () => {
      const res = await fetch(
        `/api/places?q=${encodeURIComponent(destination)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch places");
      return res.json();
    },
  });

  const totalAdults = rooms.reduce((acc, r) => acc + r.adults, 0);
  const totalChildren = rooms.reduce((acc, r) => acc + r.children, 0);
  const totalGuests = totalAdults + totalChildren;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (placeId) {
      params.set("placeId", placeId);
      params.set("destination", destination);
      saveRecentSearch(destination, placeId);
    } else if (destination && destination !== "Around my area") {
      params.set("destination", destination);
      saveRecentSearch(destination);
    }
    if (date?.from) params.set("checkIn", format(date.from, "yyyy-MM-dd"));
    if (date?.to) params.set("checkOut", format(date.to, "yyyy-MM-dd"));
    params.set("guests", totalGuests.toString());
    setLocation(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location unavailable",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setShowAutocomplete(false);
        // Use existing confirmed dates, or fall back to +7/+14 days from today
        const checkInDate = date?.from ?? addDays(new Date(), 7);
        const checkOutDate = date?.to ?? addDays(new Date(), 14);
        const params = new URLSearchParams();
        params.set("nearMe", "1");
        params.set("lat", pos.coords.latitude.toString());
        params.set("lng", pos.coords.longitude.toString());
        params.set("checkIn", format(checkInDate, "yyyy-MM-dd"));
        params.set("checkOut", format(checkOutDate, "yyyy-MM-dd"));
        params.set("guests", totalGuests.toString());
        setDestination("Around my area");
        setLocation(`/?${params.toString()}`);
      },
      (err) => {
        setGeoLoading(false);
        const msg =
          err.code === 1
            ? "Please allow location access in your browser, then try again."
            : "Could not determine your location. Please try again.";
        toast({
          title: "Location access denied",
          description: msg,
          variant: "destructive",
        });
      },
      { timeout: 8000 },
    );
  };

  const toggleCalendar = () => {
    if (dateOpen) {
      setDateOpen(false);
    } else {
      setSelectionStep("checkin");
      setDateOpen(true);
      setGuestsOpen(false);
      setShowAutocomplete(false);
    }
  };

  const openCalendar = () => {
    setSelectionStep("checkin");
    setDateOpen(true);
    setGuestsOpen(false);
    setShowAutocomplete(false);
  };

  // onDayClick handles the check-in step — captures the exact clicked day regardless
  // of what the library computes for the range. onSelect handles the checkout step.
  const handleDayClick = (day: Date, modifiers: any) => {
    if (
      selectionStep === "checkin" &&
      !modifiers.disabled &&
      !modifiers.outside
    ) {
      setDate({ from: day, to: undefined });
      setSelectionStep("checkout");
    }
  };

  const handleDateSelect = (range: any, autoClose = false) => {
    // Checkin step is handled entirely by onDayClick above — skip here
    if (selectionStep === "checkin") return;

    // Checkout step: selected={from} anchors the library, so range.to = clicked date
    if (!range || !date?.from) return;

    if (range.to && range.to > date.from) {
      setDate({ from: date.from, to: range.to });
      if (autoClose) {
        setTimeout(() => {
          setDateOpen(false);
          setSelectionStep("checkin");
        }, 300);
      } else {
        setSelectionStep("checkin");
      }
    } else if (range.from && range.from !== date.from) {
      // User clicked before/on the anchor — restart check-in from that date
      setDate({ from: range.from, to: undefined });
      setSelectionStep("checkout");
    }
  };

  const mobileDateLabel =
    date?.from && date?.to
      ? `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`
      : "Add dates";

  const desktopDateLabel =
    date?.from && date?.to
      ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}`
      : "Add dates";

  const mobileGuestsLabel = `${rooms.length} ${rooms.length === 1 ? "Room" : "Rooms"}, ${totalGuests} ${totalGuests === 1 ? "guest" : "guests"}`;
  const desktopGuestsLabel = `${rooms.length} ${rooms.length === 1 ? "Room" : "Rooms"}, ${totalGuests} ${totalGuests === 1 ? "Guest" : "Guests"}`;

  const calendarHeader =
    selectionStep === "checkin"
      ? "When do you want to check in?"
      : "When do you want to check out?";

  const isCheckoutStep = selectionStep === "checkout";

  const nearMeButton = (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        handleNearMe();
      }}
      disabled={geoLoading}
      className="w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/40"
    >
      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
        {geoLoading ? (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800 dark:text-foreground">
          Around my area
        </div>
        <div className="text-xs text-gray-400">
          Find hotels near your current location
        </div>
      </div>
    </button>
  );

  const autocompleteDropdown = showAutocomplete && (
    <div className="absolute top-full left-0 z-[200] mt-2 bg-white dark:bg-card border border-border rounded-xl shadow-2xl overflow-hidden w-full min-w-[280px] max-h-[380px] overflow-y-auto">
      {nearMeButton}
      {destination.length < 2 && recentSearches.length > 0 && (
        <div className="border-t border-border/50">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Recent searches</span>
          </div>
          {recentSearches.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-muted/40 group cursor-pointer border-b border-border/30 last:border-none"
              onMouseDown={(e) => {
                e.preventDefault();
                setDestination(s.name);
                if (s.placeId) setPlaceId(s.placeId);
                setShowAutocomplete(false);
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground truncate">{s.name}</span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 dark:hover:bg-muted"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  removeRecentSearch(s.name);
                }}
                aria-label="Remove"
                data-testid={`button-remove-recent-${s.name}`}
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
      {destination.length >= 2 && placesLoading && (
        <div className="px-4 py-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-gray-100 dark:bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
      {destination.length >= 2 &&
        !placesLoading &&
        (places as any[]).length === 0 && (
          <div className="px-4 py-4 text-sm text-gray-400 dark:text-muted-foreground text-center">
            No destinations found for "
            <span className="font-medium text-gray-600 dark:text-foreground">
              {destination}
            </span>
            "
          </div>
        )}
      {(places as any[]).map((place: any, idx: number) => {
        const types: string[] = place.types || [];
        const isHotelType =
          String(place.placeId).startsWith("hotel:") ||
          types.some((t: string) => ["lodging", "hotel"].includes(t));
        const isAirport = types.includes("airport");
        const isLocality = types.some((t: string) =>
          [
            "locality",
            "administrative_area_level_1",
            "country",
            "colloquial_area",
          ].includes(t),
        );
        const PlaceIcon = isAirport
          ? Plane
          : isHotelType
            ? BedDouble
            : isLocality
              ? Building2
              : MapPin;
        const name = place.displayName || place.placeId;
        return (
          <button
            key={place.placeId}
            className={cn(
              "w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-gray-50 dark:border-border/50 last:border-none",
              idx === 0
                ? "bg-blue-50/40 dark:bg-muted/40"
                : "hover:bg-gray-50 dark:hover:bg-muted/40",
            )}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent input blur before state updates
              if (place.hotelId) {
                setDestination(name);
                const hp = new URLSearchParams();
                const ciDate = date?.from ?? addDays(new Date(), 7);
                const coDate = date?.to ?? addDays(new Date(), 14);
                hp.set("checkIn", format(ciDate, "yyyy-MM-dd"));
                hp.set("checkOut", format(coDate, "yyyy-MM-dd"));
                const totalG = rooms.reduce((s, r) => s + r.adults + r.children, 0);
                hp.set("guests", String(totalG || 2));
                setLocation(`/hotel/${place.hotelId}?${hp.toString()}`);
              } else {
                setDestination(name);
                setPlaceId(place.placeId);
                saveRecentSearch(name, place.placeId);
              }
              setShowAutocomplete(false);
            }}
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
              <PlaceIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 dark:text-foreground truncate">
                {name}
              </div>
              {place.formattedAddress && (
                <div className="text-xs text-gray-400 dark:text-muted-foreground truncate">
                  {place.formattedAddress}
                </div>
              )}
            </div>
          </button>
        );
      })}
      {/* ── Popular in [City] landmark chips ── */}
      {(() => {
        const cityResult = (places as any[]).find((p: any) =>
          p.types?.some((t: string) => ["locality", "administrative_area_level_1", "colloquial_area"].includes(t)) &&
          !String(p.placeId).startsWith("hotel:")
        );
        if (!cityResult) return null;
        const cityKey = cityResult.displayName.toLowerCase().replace(/,.*$/, "").trim();
        const landmarks = CITY_LANDMARKS[cityKey] ??
          Object.entries(CITY_LANDMARKS).find(([k]) => cityKey.includes(k) || k.includes(cityKey))?.[1] ??
          null;
        if (!landmarks || landmarks.length === 0) return null;
        return (
          <div className="border-t border-border/50 px-3 pt-2.5 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Popular in {cityResult.displayName.replace(/,.*$/, "")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {landmarks.map((lm) => (
                <button
                  key={lm.search}
                  className="px-2.5 py-1 text-xs rounded-full border border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors font-medium whitespace-nowrap"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDestination(lm.search);
                    setPlaceId("");
                    saveRecentSearch(lm.search);
                    setShowAutocomplete(false);
                  }}
                  data-testid={`chip-landmark-${lm.search.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {lm.label}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );

  const mobileCalendarContent = (
    <div className="luxvibe-calendar px-3 pb-1">
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={isCheckoutStep ? { from: date?.from } : date}
        onSelect={(r) => handleDateSelect(r, false)}
        onDayClick={(day, modifiers) => handleDayClick(day, modifiers)}
        numberOfMonths={1}
        weekStartsOn={0}
        disabled={(d) =>
          isCheckoutStep && date?.from ? d <= date.from : d < new Date()
        }
        className="border-none p-0 w-full"
        classNames={{
          months: "flex flex-col w-full",
          month: "w-full space-y-2",
          caption: "flex justify-center pt-1 pb-2 relative items-center",
          caption_label:
            "text-sm font-semibold text-gray-900 dark:text-foreground",
          nav_button: cn(
            "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 border border-gray-200 dark:border-border rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted transition-colors",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          head_row: "flex w-full",
          head_cell:
            "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          row: "flex w-full mt-0.5",
          cell: "flex-1 h-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-10 w-10 p-0 mx-auto font-normal text-sm rounded-full aria-selected:opacity-100 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-muted transition-colors",
          day_selected:
            "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-full z-10 relative",
          day_range_middle:
            "day-range-middle aria-selected:bg-transparent aria-selected:text-white dark:aria-selected:text-white hover:bg-transparent z-10 relative",
          day_range_end:
            "day-range-end bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white z-10 relative",
          day_range_start:
            "day-range-start bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white z-10 relative",
          day_today: "font-bold text-blue-600 dark:text-blue-400",
          day_outside:
            "text-gray-300 dark:text-muted-foreground/40 aria-selected:text-gray-400",
          day_disabled:
            "text-gray-200 dark:text-muted-foreground/30 cursor-not-allowed",
          day_hidden: "invisible",
        }}
      />
    </div>
  );

  const desktopCalendarContent = (
    <div className="luxvibe-calendar relative">
      <button
        onClick={() => setDateOpen(false)}
        className="absolute top-5 right-6 text-muted-foreground hover:text-foreground transition-colors z-50"
        data-testid="button-close-calendar"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-border mb-2">
        <p
          key={calendarHeader}
          className="text-base font-bold text-gray-900 dark:text-foreground tracking-tight transition-all duration-200"
          style={{ animation: "fadeSlideIn 0.18s ease" }}
        >
          {calendarHeader}
        </p>
        {isCheckoutStep && date?.from && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
            Check-in: {format(date.from, "MMM d, yyyy")}
          </p>
        )}
      </div>
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={isCheckoutStep ? { from: date?.from } : date}
        onSelect={(r) => handleDateSelect(r, true)}
        onDayClick={(day, modifiers) => handleDayClick(day, modifiers)}
        numberOfMonths={2}
        weekStartsOn={0}
        disabled={(d) =>
          isCheckoutStep && date?.from ? d <= date.from : d < new Date()
        }
        className="px-6 pb-6 rounded-none border-none w-full"
        classNames={{
          months:
            "flex flex-row w-full [&>div:last-child]:border-l [&>div:last-child]:border-gray-200 dark:[&>div:last-child]:border-border [&>div:last-child]:pl-6 space-y-0 space-x-0",
          month: "flex-1 space-y-3 min-w-0",
          caption: "flex justify-center pt-1 pb-2 relative items-center",
          caption_label:
            "text-sm font-semibold text-gray-900 dark:text-foreground",
          nav_button: cn(
            "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 border border-gray-200 dark:border-border rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted transition-colors",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          head_row: "flex w-full",
          head_cell:
            "flex-1 text-gray-400 dark:text-muted-foreground font-medium text-xs text-center py-1",
          row: "flex w-full mt-0.5",
          cell: cn(
            "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            "[&:has([aria-selected])]:bg-blue-50 dark:[&:has([aria-selected])]:bg-blue-900/20",
            "first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
          ),
          day: "h-9 w-9 p-0 mx-auto font-normal text-sm rounded-full aria-selected:opacity-100 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-muted transition-colors",
          day_selected:
            "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-full z-10 relative",
          day_range_middle:
            "day-range-middle aria-selected:bg-transparent aria-selected:text-white dark:aria-selected:text-white hover:bg-transparent z-10 relative",
          day_range_end:
            "day-range-end bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white z-10 relative",
          day_range_start:
            "day-range-start bg-blue-600 text-white rounded-full hover:bg-blue-600 hover:text-white z-10 relative",
          day_today: "font-bold text-blue-600",
          day_outside:
            "text-gray-300 dark:text-muted-foreground/40 aria-selected:text-gray-400",
          day_disabled:
            "text-gray-200 dark:text-muted-foreground/30 cursor-not-allowed",
          day_hidden: "invisible",
        }}
      />
    </div>
  );

  const guestsContent = (
    <div className="flex flex-col w-full bg-white dark:bg-card">
      <div className="p-5 border-b border-gray-100 dark:border-border">
        <h3 className="font-bold text-base text-foreground">
          Configuring Rooms
        </h3>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {rooms.map((room, idx) => (
          <div
            key={idx}
            className={cn(
              "p-5 space-y-4",
              idx > 0 && "border-t border-gray-50 dark:border-border/50",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">
                Room {idx + 1}
              </span>
              {rooms.length > 1 && (
                <button
                  onClick={() =>
                    setRooms((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="text-xs text-red-500 font-medium hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  Adults
                </p>
                <p className="text-xs text-gray-400">Ages 13 or above</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    setRooms((prev) =>
                      prev.map((r, i) =>
                        i === idx
                          ? { ...r, adults: Math.max(1, r.adults - 1) }
                          : r,
                      ),
                    )
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-4 text-center">
                  {room.adults}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    setRooms((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, adults: r.adults + 1 } : r,
                      ),
                    )
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  Children
                </p>
                <p className="text-xs text-gray-400">Ages 0 to 17</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    setRooms((prev) =>
                      prev.map((r, i) =>
                        i === idx
                          ? { ...r, children: Math.max(0, r.children - 1) }
                          : r,
                      ),
                    )
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-4 text-center">
                  {room.children}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    setRooms((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, children: r.children + 1 } : r,
                      ),
                    )
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-5 border-t border-gray-100 dark:border-border flex gap-3">
        <Button
          variant="outline"
          className="flex-1 rounded-xl h-11 font-semibold"
          onClick={() =>
            setRooms((prev) => [...prev, { adults: 2, children: 0 }])
          }
        >
          Add room
        </Button>
        <Button
          className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          onClick={() => {
            setGuestsOpen(false);
            setMobileGuestsOpen(false);
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );

  const makeGuestsPopoverContent = (alignOffset = 0) => (
    <PopoverContent
      className="w-80 p-0 rounded-3xl shadow-2xl border border-border bg-white dark:bg-card z-[100]"
      align="end"
      alignOffset={alignOffset}
      sideOffset={12}
    >
      {guestsContent}
    </PopoverContent>
  );

  // ── NAVBAR VARIANT ──
  if (variant === "navbar") {
    return (
      <div className="flex items-center w-full max-w-xl relative">
        {/* Hidden centered trigger so the calendar popover centers on the whole bar */}
        <Popover
          open={dateOpen}
          onOpenChange={(open) => {
            setDateOpen(open);
            if (open) setGuestsOpen(false);
          }}
        >
          <PopoverTrigger asChild>
            <span
              className="absolute left-1/2 top-0 w-px h-full pointer-events-none"
              aria-hidden="true"
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-[600px] p-0 rounded-3xl shadow-2xl border border-border bg-white dark:bg-card z-[100]"
            align="center"
            sideOffset={12}
          >
            {desktopCalendarContent}
          </PopoverContent>
        </Popover>

        <div className="flex w-full bg-white dark:bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow items-center overflow-visible p-1 gap-0 h-10">
          <div
            className="flex-1 flex items-center px-4 min-w-0 relative h-full border-r border-border"
            ref={autocompleteRef}
          >
            <input
              type="text"
              placeholder="Enter a destination"
              className="text-[13px] text-gray-700 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 truncate w-full font-medium"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setPlaceId("");
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              onKeyDown={handleKeyDown}
              data-testid="input-destination-navbar"
            />
            {autocompleteDropdown}
          </div>

          <button
            className="px-4 h-full hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left border-r border-border flex items-center shrink-0"
            onClick={() => {
              setDateOpen((o) => !o);
              setGuestsOpen(false);
            }}
            data-testid="button-dates-navbar"
          >
            <span className="text-[13px] text-gray-700 dark:text-foreground truncate font-medium whitespace-nowrap">
              {mobileDateLabel}
            </span>
          </button>

          <Popover
            open={guestsOpen}
            onOpenChange={(open) => {
              setGuestsOpen(open);
              if (open) setDateOpen(false);
            }}
          >
            <PopoverTrigger asChild>
              <button
                className="px-4 h-full hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-left flex items-center shrink-0"
                data-testid="button-guests-navbar"
              >
                <span className="text-[13px] text-gray-700 dark:text-foreground truncate font-medium whitespace-nowrap">
                  {desktopGuestsLabel}
                </span>
              </button>
            </PopoverTrigger>
            {makeGuestsPopoverContent(0)}
          </Popover>

          <button
            onClick={handleSearch}
            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-all shadow-sm shrink-0 ml-1 mr-0.5"
            data-testid="button-search-navbar"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── HERO VARIANT ──
  return (
    <>
      {/* ── MOBILE layout (below md) ── */}
      <div className="md:hidden">
        <div className="relative h-[320px] overflow-hidden bg-black">
          <img
            src={heroImage}
            alt="Luxury Hotel"
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).src = santoriniWater; }}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <h1 className="text-[42px] font-bold text-white leading-tight mb-2 drop-shadow-lg">
              Luxury Stays.
              <br />
              Unbeatable Rates.
            </h1>
            <p className="text-white/90 text-base font-medium drop-shadow-md">
              Discover stays that redefine extraordinary
            </p>
          </div>
        </div>

        <div className="relative -mt-12 mx-4 z-10 pb-2">
          {/* Date Dialog */}
          <Dialog
            open={mobileDateOpen}
            onOpenChange={(open) => {
              if (!open) {
                setSelectionStep("checkin");
              }
              setMobileDateOpen(open);
            }}
          >
            <DialogContent className="w-[calc(100vw-32px)] max-w-sm p-0 rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
              <DialogTitle className="sr-only">{calendarHeader}</DialogTitle>
              <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-border">
                <div>
                  <h3
                    key={calendarHeader}
                    className="font-bold text-base text-foreground"
                    style={{ animation: "fadeSlideIn 0.18s ease" }}
                  >
                    {calendarHeader}
                  </h3>
                  {isCheckoutStep && date?.from && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
                      Check-in: {format(date.from, "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              {mobileCalendarContent}
              <div className="px-5 pb-5 pt-2">
                <button
                  onClick={() => {
                    if (date?.from && date?.to) setMobileDateOpen(false);
                  }}
                  disabled={!date?.from || !date?.to}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-sm transition-colors",
                    date?.from && date?.to
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 dark:bg-muted text-gray-400 dark:text-muted-foreground cursor-not-allowed",
                  )}
                  data-testid="button-confirm-dates"
                >
                  {date?.from && date?.to
                    ? "Confirm dates"
                    : isCheckoutStep
                      ? "Select check-out date"
                      : "Select check-in date"}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Guests Dialog */}
          <Dialog open={mobileGuestsOpen} onOpenChange={setMobileGuestsOpen}>
            <DialogContent className="w-[calc(100vw-32px)] max-w-sm p-0 rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
              <DialogTitle className="sr-only">Guests</DialogTitle>
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <h3 className="font-bold text-base text-foreground">Guests</h3>
              </div>
              {guestsContent}
              <div className="px-5 pb-5">
                <button
                  onClick={() => setMobileGuestsOpen(false)}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm"
                >
                  Confirm
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <div
            className="bg-white dark:bg-card rounded-3xl shadow-2xl relative"
            ref={mobileAutocompleteRef}
          >
            {showAutocomplete && !showMobileDestSheet && (
              <div className="absolute bottom-full left-0 z-[200] mb-1 bg-white dark:bg-card border border-border rounded-xl shadow-2xl overflow-hidden w-full max-h-48 overflow-y-auto">
                {nearMeButton}
                {destination.length >= 2 && placesLoading && (
                  <div className="px-4 py-3 space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 animate-pulse"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-muted shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-muted" />
                          <div className="h-2.5 w-1/2 rounded bg-gray-100 dark:bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {destination.length >= 2 &&
                  !placesLoading &&
                  (places as any[]).length === 0 && (
                    <div className="px-4 py-4 text-sm text-gray-400 dark:text-muted-foreground text-center">
                      No destinations found for "
                      <span className="font-medium text-gray-600 dark:text-foreground">
                        {destination}
                      </span>
                      "
                    </div>
                  )}
                {(places as any[]).map((place: any, idx: number) => {
                  const types: string[] = place.types || [];
                  const isHotelType =
                    String(place.placeId).startsWith("hotel:") ||
                    types.some((t: string) => ["lodging", "hotel"].includes(t));
                  const isAirport = types.includes("airport");
                  const isLocality = types.some((t: string) =>
                    [
                      "locality",
                      "administrative_area_level_1",
                      "country",
                      "colloquial_area",
                    ].includes(t),
                  );
                  const PlaceIcon = isAirport
                    ? Plane
                    : isHotelType
                      ? BedDouble
                      : isLocality
                        ? Building2
                        : MapPin;
                  const name = place.displayName || place.placeId;
                  return (
                    <button
                      key={place.placeId}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-gray-50 dark:border-border/50 last:border-none",
                        idx === 0
                          ? "bg-blue-50/40 dark:bg-muted/40"
                          : "hover:bg-gray-50 dark:hover:bg-muted/40",
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (place.hotelId) {
                          setDestination(name);
                          const hp = new URLSearchParams();
                          const ciDate = date?.from ?? addDays(new Date(), 7);
                          const coDate = date?.to ?? addDays(new Date(), 14);
                          hp.set("checkIn", format(ciDate, "yyyy-MM-dd"));
                          hp.set("checkOut", format(coDate, "yyyy-MM-dd"));
                          const totalG = rooms.reduce((s, r) => s + r.adults + r.children, 0);
                          hp.set("guests", String(totalG || 2));
                          setLocation(`/hotel/${place.hotelId}?${hp.toString()}`);
                        } else {
                          setDestination(name);
                          setPlaceId(place.placeId);
                          saveRecentSearch(name, place.placeId);
                        }
                        setShowAutocomplete(false);
                      }}
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center shrink-0">
                        <PlaceIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-800 dark:text-foreground truncate">
                          {name}
                        </div>
                        {place.formattedAddress && (
                          <div className="text-xs text-gray-400 dark:text-muted-foreground truncate">
                            {place.formattedAddress}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
                {/* ── Popular in [City] landmark chips (mobile compact) ── */}
                {(() => {
                  const cityResult = (places as any[]).find((p: any) =>
                    p.types?.some((t: string) => ["locality", "administrative_area_level_1", "colloquial_area"].includes(t)) &&
                    !String(p.placeId).startsWith("hotel:")
                  );
                  if (!cityResult) return null;
                  const cityKey = cityResult.displayName.toLowerCase().replace(/,.*$/, "").trim();
                  const landmarks = CITY_LANDMARKS[cityKey] ??
                    Object.entries(CITY_LANDMARKS).find(([k]) => cityKey.includes(k) || k.includes(cityKey))?.[1] ??
                    null;
                  if (!landmarks || landmarks.length === 0) return null;
                  return (
                    <div className="border-t border-border/50 px-3 pt-2 pb-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Popular in {cityResult.displayName.replace(/,.*$/, "")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {landmarks.map((lm) => (
                          <button
                            key={lm.search}
                            className="px-2 py-0.5 text-[11px] rounded-full border border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors font-medium whitespace-nowrap"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setDestination(lm.search);
                              setPlaceId("");
                              saveRecentSearch(lm.search);
                              setShowAutocomplete(false);
                            }}
                          >
                            {lm.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className="relative px-5 py-4 border-b border-gray-100 dark:border-border">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter a destination"
                  className="flex-1 text-base text-gray-800 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 min-w-0"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setPlaceId("");
                    setShowAutocomplete(true);
                  }}
                  onFocus={() => {
                    setShowMobileDestSheet(true);
                    setShowAutocomplete(false);
                  }}
                  onKeyDown={handleKeyDown}
                  data-testid="input-destination-mobile"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (mobileDateOpen) {
                  setMobileDateOpen(false);
                } else {
                  setSelectionStep("checkin");
                  setMobileDateOpen(true);
                }
              }}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-border text-left active:bg-gray-50 dark:active:bg-muted/30 transition-colors"
              data-testid="button-date-mobile"
            >
              <CalendarDays className="w-5 h-5 text-gray-400 shrink-0" />
              <span
                className={cn(
                  "text-base",
                  date?.from && date?.to
                    ? "text-gray-800 dark:text-foreground"
                    : "text-gray-400",
                )}
              >
                {mobileDateLabel}
              </span>
            </button>
            <button
              onClick={() => setMobileGuestsOpen(true)}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-border text-left active:bg-gray-50 dark:active:bg-muted/30 transition-colors"
              data-testid="button-guests-mobile"
            >
              <Users className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-base text-gray-800 dark:text-foreground">
                {mobileGuestsLabel}
              </span>
            </button>
            <div className="p-4">
              <button
                onClick={handleSearch}
                className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
                data-testid="button-search"
              >
                <Search className="w-5 h-5" />
                {t("search.search")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile temptation chips ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 px-2 pb-2">
          <span className="text-xs text-gray-500 dark:text-muted-foreground font-medium mr-1">
            Try:
          </span>
          {[
            {
              label: "Romantic Getaway",
              icon: Heart,
              query: "romantic getaway hotel with couples spa",
            },
            {
              label: "Beach Paradise",
              icon: Waves,
              query: "beachfront resort with ocean view and pool",
            },
            {
              label: "Luxury Escape",
              icon: Gem,
              query: "luxury five star hotel with premium amenities",
            },
          ].map(({ label, icon: Icon, query }) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 3);
            const params = new URLSearchParams({
              aiSearch: query,
              checkIn: tomorrow.toISOString().split("T")[0],
              checkOut: dayAfter.toISOString().split("T")[0],
              guests: "2",
            });
            return (
              <button
                key={label}
                onClick={() => setLocation(`/?${params.toString()}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-muted text-gray-700 dark:text-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-gray-200 dark:border-border"
                data-testid={`chip-vibe-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-luxe"))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            data-testid="chip-ask-luxe-mobile"
          >
            <Sparkles className="w-3 h-3" />
            Ask Luxe
          </button>
        </div>
      </div>

      {/* ── Mobile full-screen destination search sheet ── */}
      <AnimatePresence>
        {showMobileDestSheet && (
          <motion.div
            className="fixed inset-0 z-[300] bg-background flex flex-col md:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border shrink-0">
              <button
                onClick={() => setShowMobileDestSheet(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
                data-testid="button-close-dest-sheet"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search destinations..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setPlaceId("");
                    setShowAutocomplete(true);
                  }}
                  data-testid="input-destination-sheet"
                />
                {destination.length > 0 && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDestination("");
                      setPlaceId("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable results */}
            <div className="flex-1 overflow-y-auto">
              {/* Around my area */}
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowMobileDestSheet(false);
                  handleNearMe();
                }}
                disabled={geoLoading}
                className="w-full text-left px-4 py-3.5 transition-colors flex items-center gap-4 border-b border-border hover:bg-muted/40 active:bg-muted/60"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                  {geoLoading ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Around my area</div>
                  <div className="text-xs text-muted-foreground">Find hotels near your current location</div>
                </div>
              </button>

              {/* Recent searches (shown when < 2 chars typed) */}
              {destination.length < 2 && recentSearches.length > 0 && (
                <>
                  <div className="px-4 pt-4 pb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent searches</span>
                  </div>
                  {recentSearches.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center gap-4 px-4 py-3 border-b border-border/50 hover:bg-muted/40 active:bg-muted/60 group cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDestination(s.name);
                        if (s.placeId) setPlaceId(s.placeId);
                        setShowMobileDestSheet(false);
                        setShowAutocomplete(false);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">{s.name}</span>
                      <button
                        className="opacity-0 group-hover:opacity-60 transition-opacity p-1.5"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeRecentSearch(s.name);
                        }}
                        aria-label="Remove"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Popular destinations (shown when < 2 chars typed) */}
              {destination.length < 2 && (
                <>
                  <div className="px-4 pt-4 pb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Popular destinations</span>
                  </div>
                  {POPULAR_DESTINATIONS.map((place) => (
                    <button
                      key={place.cityName}
                      className="w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-border/50 last:border-none hover:bg-muted/40 active:bg-muted/60"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDestination(place.cityName);
                        setPlaceId("");
                        setShowMobileDestSheet(false);
                        setShowAutocomplete(false);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{place.displayName}</div>
                        <div className="text-xs text-muted-foreground truncate">{place.formattedAddress}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Loading skeletons */}
              {destination.length >= 2 && placesLoading && (
                <div className="px-4 py-3 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-2/3 rounded bg-muted" />
                        <div className="h-2.5 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {destination.length >= 2 && !placesLoading && (places as any[]).length === 0 && (
                <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                  No destinations found for "<span className="font-medium text-foreground">{destination}</span>"
                </div>
              )}

              {/* API results */}
              {destination.length >= 2 && !placesLoading && (places as any[]).map((place: any, idx: number) => {
                const types: string[] = place.types || [];
                const isHotelType =
                  String(place.placeId).startsWith("hotel:") ||
                  types.some((t: string) => ["lodging", "hotel"].includes(t));
                const isAirport = types.includes("airport");
                const isLocality = types.some((t: string) =>
                  ["locality", "administrative_area_level_1", "country", "colloquial_area"].includes(t)
                );
                const PlaceIcon = isAirport ? Plane : isHotelType ? BedDouble : isLocality ? Building2 : MapPin;
                const name = place.displayName || place.placeId;
                return (
                  <button
                    key={place.placeId}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-border/50 last:border-none",
                      idx === 0 ? "bg-blue-50/40 dark:bg-muted/40" : "hover:bg-muted/40 active:bg-muted/60",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (place.hotelId) {
                        setDestination(name);
                        const hp = new URLSearchParams();
                        const ciDate = date?.from ?? addDays(new Date(), 7);
                        const coDate = date?.to ?? addDays(new Date(), 14);
                        hp.set("checkIn", format(ciDate, "yyyy-MM-dd"));
                        hp.set("checkOut", format(coDate, "yyyy-MM-dd"));
                        const totalG = rooms.reduce((s, r) => s + r.adults + r.children, 0);
                        hp.set("guests", String(totalG || 2));
                        setShowMobileDestSheet(false);
                        setLocation(`/hotel/${place.hotelId}?${hp.toString()}`);
                      } else {
                        setDestination(name);
                        setPlaceId(place.placeId);
                        saveRecentSearch(name, place.placeId);
                        setShowMobileDestSheet(false);
                        setShowAutocomplete(false);
                      }
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <PlaceIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{name}</div>
                      {place.formattedAddress && (
                        <div className="text-xs text-muted-foreground truncate">{place.formattedAddress}</div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* ── Popular in [City] landmark chips (mobile sheet) ── */}
              {destination.length >= 2 && !placesLoading && (() => {
                const cityResult = (places as any[]).find((p: any) =>
                  p.types?.some((t: string) => ["locality", "administrative_area_level_1", "colloquial_area"].includes(t)) &&
                  !String(p.placeId).startsWith("hotel:")
                );
                if (!cityResult) return null;
                const cityKey = cityResult.displayName.toLowerCase().replace(/,.*$/, "").trim();
                const landmarks = CITY_LANDMARKS[cityKey] ??
                  Object.entries(CITY_LANDMARKS).find(([k]) => cityKey.includes(k) || k.includes(cityKey))?.[1] ??
                  null;
                if (!landmarks || landmarks.length === 0) return null;
                return (
                  <div className="border-t border-border/50 px-4 pt-3 pb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      Popular in {cityResult.displayName.replace(/,.*$/, "")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {landmarks.map((lm) => (
                        <button
                          key={lm.search}
                          className="px-2.5 py-1 text-xs rounded-full border border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors font-medium whitespace-nowrap"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDestination(lm.search);
                            setPlaceId("");
                            saveRecentSearch(lm.search);
                            setShowMobileDestSheet(false);
                            setShowAutocomplete(false);
                          }}
                        >
                          {lm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Matching popular destinations (supplement API results) */}
              {destination.length >= 2 && !placesLoading && (() => {
                const apiNames = new Set((places as any[]).map((p: any) => (p.displayName || "").toLowerCase()));
                const matching = POPULAR_DESTINATIONS.filter(
                  (p) =>
                    (p.displayName.toLowerCase().includes(destination.toLowerCase()) ||
                     p.cityName.toLowerCase().includes(destination.toLowerCase())) &&
                    !apiNames.has(p.cityName.toLowerCase())
                );
                if (matching.length === 0) return null;
                return (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggestions</span>
                    </div>
                    {matching.map((place) => (
                      <button
                        key={place.cityName}
                        className="w-full text-left px-4 py-3 transition-colors flex items-center gap-4 border-b border-border/50 last:border-none hover:bg-muted/40 active:bg-muted/60"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDestination(place.cityName);
                          setPlaceId("");
                          setShowMobileDestSheet(false);
                          setShowAutocomplete(false);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{place.displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">{place.formattedAddress}</div>
                        </div>
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP layout (md+) ── */}
      <div className="hidden md:block relative w-full h-[638px]">
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          <img
            src={heroImage}
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).src = santoriniWater; }}
          />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center h-full">
          <div className="mb-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-3 drop-shadow-lg leading-tight">
              Luxury Stays. Unbeatable Rates.
            </h1>
            <p className="text-white text-lg font-medium tracking-wide mb-4">
              Discover stays that redefine extraordinary
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-white text-sm font-medium drop-shadow-md">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 opacity-90" />
                <span>2M+ Hotels Worldwide</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 opacity-90" />
                <span>190+ Countries</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>4.9/5 Guest Rating</span>
              </div>
            </div>
          </div>

          {/* Desktop search bar + calendar anchored together */}
          <div className="w-full max-w-4xl relative" ref={desktopSearchBarRef}>
            {/* Hidden Popover trigger pinned to the left edge for calendar alignment */}
            <Popover
              open={dateOpen && !isMobile}
              onOpenChange={(open) => {
                if (!open) {
                  setDateOpen(false);
                  return;
                }
                openCalendar();
              }}
            >
              <PopoverTrigger asChild>
                <span
                  className="absolute inset-y-0 left-0 w-px pointer-events-none"
                  aria-hidden="true"
                />
              </PopoverTrigger>
              <PopoverContent
                style={{ width: calendarWidth ?? "auto" }}
                className="p-0 border border-gray-200 dark:border-border shadow-2xl rounded-xl z-[100] bg-white dark:bg-card overflow-hidden"
                align="start"
                sideOffset={8}
                onInteractOutside={(e) => {
                  if (datesButtonRef.current?.contains(e.target as Node))
                    return;
                  setDateOpen(false);
                }}
              >
                {desktopCalendarContent}
              </PopoverContent>
            </Popover>

            {/* Guests popover */}
            <Popover
              open={guestsOpen && !isMobile}
              onOpenChange={(open) => {
                setGuestsOpen(open);
                if (open) setDateOpen(false);
              }}
            >
              <PopoverTrigger asChild>
                <span
                  className="absolute inset-y-0 right-16 w-px pointer-events-none"
                  aria-hidden="true"
                />
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0 rounded-3xl shadow-2xl border border-border bg-white dark:bg-card z-[100]"
                align="end"
                sideOffset={8}
              >
                {guestsContent}
              </PopoverContent>
            </Popover>

            {/* The visible search bar */}
            <div className="w-full bg-white dark:bg-[#0f172a] rounded-xl shadow-2xl flex items-stretch border border-gray-200 dark:border-blue-500/30">
              {/* Destination */}
              <div
                className="flex-[1.3] px-5 py-4 border-r border-gray-200 dark:border-border relative flex flex-col items-start"
                ref={autocompleteRef}
              >
                <p className="text-xs font-bold text-gray-500 dark:text-muted-foreground mb-0.5 uppercase tracking-wider text-left w-full">
                  DESTINATION
                </p>
                <input
                  ref={desktopInputRef}
                  type="text"
                  placeholder="Enter a destination"
                  className="w-full text-sm text-gray-900 dark:text-foreground bg-transparent outline-none border-none placeholder:text-gray-400 font-semibold text-left"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setPlaceId("");
                    setShowAutocomplete(true);
                    setDateOpen(false);
                    setGuestsOpen(false);
                  }}
                  onFocus={() => {
                    setShowAutocomplete(true);
                    setDateOpen(false);
                    setGuestsOpen(false);
                  }}
                  onKeyDown={handleKeyDown}
                  data-testid="input-destination-desktop"
                />
                {autocompleteDropdown}
              </div>

              {/* Dates */}
              <button
                ref={datesButtonRef}
                className="flex-1 px-5 py-4 hover:bg-gray-50 dark:hover:bg-muted/20 transition-colors text-left border-r border-gray-200 dark:border-border"
                onClick={toggleCalendar}
                data-testid="button-dates-desktop"
              >
                <p className="text-xs font-bold text-gray-500 dark:text-muted-foreground mb-0.5 uppercase tracking-wider">
                  DATES
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  {desktopDateLabel}
                </p>
              </button>

              {/* Guests */}
              <button
                className="flex-1 px-5 py-4 hover:bg-gray-50 dark:hover:bg-muted/20 transition-colors text-left"
                onClick={() => {
                  setGuestsOpen(true);
                  setDateOpen(false);
                  setShowAutocomplete(false);
                }}
                data-testid="button-guests-desktop"
              >
                <p className="text-xs font-bold text-gray-500 dark:text-muted-foreground mb-0.5 uppercase tracking-wider">
                  GUESTS
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  {desktopGuestsLabel}
                </p>
              </button>

              {/* Search button */}
              <div className="flex items-center px-3">
                <button
                  onClick={handleSearch}
                  className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-md active:scale-95"
                  data-testid="button-search-desktop"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Desktop temptation chips ── */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            <span className="text-white/60 text-sm font-medium mr-1">Try:</span>
            {[
              {
                label: "Romantic Getaway",
                icon: Heart,
                query: "romantic getaway hotel with couples spa",
              },
              {
                label: "Beach Paradise",
                icon: Waves,
                query: "beachfront resort with ocean view and pool",
              },
              {
                label: "Luxury Escape",
                icon: Gem,
                query: "luxury five star hotel with premium amenities",
              },
            ].map(({ label, icon: Icon, query }) => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const dayAfter = new Date();
              dayAfter.setDate(dayAfter.getDate() + 3);
              const params = new URLSearchParams({
                aiSearch: query,
                checkIn: tomorrow.toISOString().split("T")[0],
                checkOut: dayAfter.toISOString().split("T")[0],
                guests: "2",
              });
              return (
                <button
                  key={label}
                  onClick={() => setLocation(`/?${params.toString()}`)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all"
                  data-testid={`chip-vibe-desktop-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-luxe"))}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-all shadow-md border border-primary/40"
              data-testid="chip-ask-luxe-desktop"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask Luxe
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

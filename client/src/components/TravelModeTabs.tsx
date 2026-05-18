import { useLocation } from "wouter";
import { Building2, Plane, Ticket, Car } from "lucide-react";

type TabMode = "hotels" | "flights" | "cars" | "events";

const TABS: { key: TabMode; label: string; icon: React.ElementType; href: string }[] = [
  { key: "hotels",  label: "Hotels",  icon: Building2, href: "/" },
  { key: "flights", label: "Flights", icon: Plane,     href: "/flights" },
  { key: "cars",    label: "Cars",    icon: Car,       href: "/car-rental" },
  { key: "events",  label: "Events",  icon: Ticket,    href: "/event-travel" },
];

interface Props {
  active: TabMode;
  variant?: "hero" | "card";
  className?: string;
  onTabChange?: (key: TabMode) => void;
}

export function TravelModeTabs({ active, variant = "card", className = "", onTabChange }: Props) {
  const [, navigate] = useLocation();

  function handleClick(key: TabMode, href: string) {
    if (onTabChange) {
      onTabChange(key);
    } else {
      navigate(href);
    }
  }

  if (variant === "hero") {
    return (
      <div className={`flex items-center justify-center gap-2 mb-5 ${className}`}>
        {TABS.map(({ key, label, icon: Icon, href }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleClick(key, href)}
            data-testid={`tab-travel-${key}`}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all select-none ${
              active === key
                ? "bg-white text-gray-900 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/35 backdrop-blur-sm border border-white/20"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex justify-center border-b border-border ${className}`}>
      {TABS.map(({ key, label, icon: Icon, href }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleClick(key, href)}
          data-testid={`tab-travel-${key}`}
          className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 -mb-px transition-all select-none whitespace-nowrap ${
            active === key
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="w-[17px] h-[17px]" />
          {label}
        </button>
      ))}
    </div>
  );
}

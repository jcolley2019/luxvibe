import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/context/preferences";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, CalendarDays, Globe, KeyRound, X, Lightbulb, Moon, Sun,
  Heart, Users, BookOpen, Plane, DollarSign, Building2, Eye, Sparkles,
  Home, Ticket, Menu, ChevronDown, Gift, Clock, Settings,
} from "lucide-react";
import { useFavorites } from "@/context/favorites";
import { AuthModal } from "@/components/AuthModal";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("lv_theme_v2") === "dark"; }
    catch { return false; }
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("lv_theme_v2", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("lv_theme_v2", "light");
    }
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

function useFavoritesCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const read = () => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith("wishlist_") && localStorage.getItem(k) === "1");
        setCount(keys.length);
      } catch { setCount(0); }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, []);
  return count;
}

const LANGUAGES = [
  { name: "English",   code: "EN", flag: "🇺🇸" },
  { name: "Français",  code: "FR", flag: "🇫🇷" },
  { name: "Türkçe",   code: "TR", flag: "🇹🇷" },
  { name: "Nederlands",code: "NL", flag: "🇳🇱" },
  { name: "Español",  code: "ES", flag: "🇪🇸" },
  { name: "Deutsch",  code: "DE", flag: "🇩🇪" },
  { name: "Italiano", code: "IT", flag: "🇮🇹" },
  { name: "العربية",  code: "AR", flag: "🇸🇦" },
  { name: "Português",code: "PT", flag: "🇵🇹" },
  { name: "Ελληνικά", code: "EL", flag: "🇬🇷" },
  { name: "Română",   code: "RO", flag: "🇷🇴" },
  { name: "Русский",  code: "RU", flag: "🇷🇺" },
  { name: "日本語",   code: "JA", flag: "🇯🇵" },
  { name: "中文",     code: "ZH", flag: "🇨🇳" },
  { name: "한국어",   code: "KO", flag: "🇰🇷" },
];

const CURRENCIES = [
  { name: "US Dollar",       code: "USD", symbol: "$"   },
  { name: "Euro",            code: "EUR", symbol: "€"   },
  { name: "British Pound",   code: "GBP", symbol: "£"   },
  { name: "Japanese Yen",    code: "JPY", symbol: "¥"   },
  { name: "Canadian Dollar", code: "CAD", symbol: "C$"  },
  { name: "Australian Dollar",code:"AUD", symbol: "A$"  },
  { name: "Swiss Franc",     code: "CHF", symbol: "CHF" },
  { name: "UAE Dirham",      code: "AED", symbol: "د.إ" },
];

const GUIDE_TIPS = [
  { icon: "✦", title: "Pick from the dropdown for best results", text: "When you type a destination, select a suggestion from the list — this gives the search engine a precise location and returns far more hotels." },
  { icon: "♠", title: "Searching Las Vegas? Try \"Las Vegas Strip\"", text: "Type \"Las Vegas Strip\" and choose from the dropdown to surface the iconic Strip resorts — Bellagio, MGM Grand, Caesars Palace, and more." },
  { icon: "✧", title: "Use Vibe search for inspiration", text: "Switch to the Vibe tab in the search bar and describe your dream stay — \"romantic beachfront resort\" or \"luxury casino with a rooftop pool\" — and AI will find it." },
  { icon: "★", title: "4 & 5-star hotels shown by default", text: "Results are curated to luxury properties. Use the star filter in the sidebar to include 3-star or budget options at any time." },
  { icon: "🛏", title: "Adjust dates on the hotel page", text: "On any hotel details page, use the compact search bar in the header to change your dates and see updated room rates instantly." },
  { icon: "🔒", title: "Secure booking in 3 steps", text: "Select a room → fill in your guest details → pay with our secure payment system. Your booking confirmation appears instantly." },
];

function LanguageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currency, language, setCurrency, setLanguage } = usePreferences();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"language" | "currency">("language");
  const [langSearch, setLangSearch] = useState("");
  const filteredLangs = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">{t("nav.choose_lang_currency")}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-6 border-b border-border mb-5">
            {(["language", "currency"] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === tabKey ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-${tabKey}`}
              >
                {tabKey === "language" ? t("nav.language") : t("nav.currency")}
              </button>
            ))}
          </div>
          {tab === "language" ? (
            <>
              <div className="relative mb-4">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("nav.search_language")}
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="input-lang-search"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredLangs.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); onClose(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${language === lang.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
                    data-testid={`lang-option-${lang.code}`}
                  >
                    <span className="text-2xl leading-none">{lang.flag}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{lang.name}</div>
                      <div className="text-xs text-muted-foreground">{lang.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
              {CURRENCIES.map(cur => (
                <button
                  key={cur.code}
                  onClick={() => { setCurrency(cur.code); onClose(); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${currency === cur.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
                  data-testid={`currency-option-${cur.code}`}
                >
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">{cur.symbol}</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{cur.code}</div>
                    <div className="text-xs text-muted-foreground truncate">{cur.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Navbar({ centralSlot }: { centralSlot?: React.ReactNode }) {
  const { user, logout, isAuthenticated, openLoginModal, closeLoginModal, loginModalOpen } = useAuth();

  const { data: loyaltyPoints } = useQuery<{ points: number; upcomingPoints: number; exists: boolean }>({
    queryKey: ["/api/loyalty/points"],
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
  const { currency, language, timeFormat, setTimeFormat } = usePreferences();
  const { t } = useTranslation();
  const { dark, toggle: toggleDark } = useDarkMode();
  const favCount = useFavoritesCount();
  const [langOpen, setLangOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tipsOpen) return;
    function handleClick(e: MouseEvent) {
      if (tipsRef.current && !tipsRef.current.contains(e.target as Node)) setTipsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [tipsOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const hasFavorites = favCount > 0;

  const EXPLORE_LINKS = [
    { label: "Journal",  href: "/blog",         icon: BookOpen },
    { label: "Flights",  href: "/flights",       icon: Plane   },
    { label: "Events",   href: "/event-travel",  icon: Ticket  },
  ];

  return (
    <>
      <LanguageModal open={langOpen} onClose={() => setLangOpen(false)} />
      <AuthModal open={loginModalOpen} onClose={closeLoginModal} />

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">

          {/* ── Left: Logo + Desktop Explore Dropdown ── */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              aria-label="Luxvibe – home"
              className="flex items-center gap-1.5 shrink-0"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <span
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                className="text-2xl font-semibold tracking-[0.15em] text-foreground uppercase"
              >
                Luxvibe
              </span>
            </Link>

            {/* Desktop Explore dropdown — hidden on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-explore-menu"
                >
                  Explore
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 mt-1">
                {EXPLORE_LINKS.map(({ label, href, icon: Icon }) => (
                  <DropdownMenuItem key={label} asChild>
                    <Link
                      href={href}
                      className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm"
                      data-testid={`desktop-nav-${label.toLowerCase()}`}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Center: optional compact search slot (hotel pages) ── */}
          {centralSlot && (
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-xl hidden md:flex justify-center pointer-events-none">
              <div className="pointer-events-auto">{centralSlot}</div>
            </div>
          )}

          {/* ── Right: desktop utility icons + auth / mobile hamburger ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Language / Currency — desktop only */}
            <button
              onClick={() => setLangOpen(true)}
              aria-label="Language and currency settings"
              className="hidden md:flex h-9 px-2 rounded-full border border-border items-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
              data-testid="button-language"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium hidden lg:inline">{language}</span>
            </button>

            {/* Site guide — desktop only */}
            <div className="hidden md:block relative" ref={tipsRef}>
              <button
                onClick={() => setTipsOpen(o => !o)}
                aria-label="Luxvibe site guide"
                aria-expanded={tipsOpen}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${tipsOpen ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50"}`}
                data-testid="button-site-guide"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
              {tipsOpen && (
                <div className="absolute top-11 right-0 w-80 bg-white dark:bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">Luxvibe Guide</span>
                    </div>
                    <button onClick={() => setTipsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                    {GUIDE_TIPS.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-lg leading-none shrink-0 mt-0.5">{tip.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">{tip.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{tip.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-4 pt-1 border-t border-border">
                    <p className="text-[11px] text-muted-foreground text-center">Luxvibe — Luxury hotel booking made simple</p>
                  </div>
                </div>
              )}
            </div>

            {/* Manage Bookings key — desktop only */}
            <Link
              href="/manage-booking"
              aria-label="Manage your bookings"
              className="hidden md:flex w-9 h-9 rounded-full border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
              data-testid="button-manage-bookings"
            >
              <KeyRound className="w-4 h-4" />
            </Link>

            {/* Settings dropdown — desktop only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Settings"
                  className="hidden md:flex w-9 h-9 rounded-full border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
                  data-testid="button-settings-desktop"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52" align="end">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Preferences
                </div>
                <DropdownMenuItem
                  onClick={toggleDark}
                  className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm"
                  data-testid="button-settings-theme-toggle"
                >
                  {dark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
                  {dark ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTimeFormat(timeFormat === "12h" ? "24h" : "12h")}
                  className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm"
                  data-testid="button-settings-time-format"
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Time Format
                  <span className="ml-auto text-xs text-muted-foreground">
                    {timeFormat === "12h" ? "12h" : "24h"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth — desktop user menu OR login button */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1" data-testid="button-user-avatar">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(user?.firstName?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
                    <Avatar className="h-10 w-10 border border-border shrink-0">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {(user?.firstName?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      {(user?.firstName || user?.lastName) && (
                        <p className="font-semibold text-sm text-foreground truncate">
                          {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                        </p>
                      )}
                      {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                    </div>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem asChild>
                      <Link href="/" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <Home className="w-4 h-4 text-muted-foreground" /> Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-bookings" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" /> {t("nav.my_bookings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <Heart className={`w-4 h-4 ${hasFavorites ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        My Favorites
                        {hasFavorites && (
                          <span className="ml-auto text-xs font-bold bg-red-100 dark:bg-red-950/50 text-red-600 px-1.5 py-0.5 rounded-full">{favCount}</span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    {(loyaltyPoints?.points ?? 0) > 0 && (
                      <div className="mx-2 my-1 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                          <Gift className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">{loyaltyPoints!.points.toLocaleString()} Luxvibe points</p>
                          {(loyaltyPoints!.upcomingPoints ?? 0) > 0 && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-300">+{loyaltyPoints!.upcomingPoints} upcoming</p>
                          )}
                        </div>
                      </div>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/invite" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" /> Invite Friends &amp; Referrals
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference</div>
                    <DropdownMenuItem asChild>
                      <Link href="/currencies" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" /> Currencies
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/hotel-facilities" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <Building2 className="w-4 h-4 text-muted-foreground" /> Hotel Facilities
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/room-views" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <Eye className="w-4 h-4 text-muted-foreground" /> Room Views
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/room-amenities" className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm">
                        <Sparkles className="w-4 h-4 text-muted-foreground" /> Room Amenities
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleDark} className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm" data-testid="button-theme-toggle">
                      {dark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
                      {dark ? "Light Mode" : "Dark Mode"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeFormat(timeFormat === "12h" ? "24h" : "12h")} className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm" data-testid="button-time-format-toggle">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Time Format
                      <span className="ml-auto text-xs text-muted-foreground">{timeFormat === "12h" ? "12h" : "24h"}</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => logout()} className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4" /> {t("nav.logout")}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => openLoginModal()}
                className="hidden md:flex ml-1 h-9 px-5 rounded-full text-sm font-semibold"
                data-testid="button-login"
              >
                {t("nav.login")}
              </Button>
            )}

            {/* Mobile: Login or Avatar + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-9 w-9 rounded-full p-0 flex items-center justify-center"
                  data-testid="button-mobile-avatar"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(user?.firstName?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <Button
                  onClick={() => openLoginModal()}
                  className="h-9 px-4 rounded-full text-sm font-semibold"
                  data-testid="button-login"
                >
                  {t("nav.login")}
                </Button>
              )}
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile slide-in drawer (from right) ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[201] w-[85vw] max-w-sm bg-background shadow-2xl flex flex-col md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-xl font-semibold tracking-[0.15em] text-foreground uppercase">
                  Luxvibe
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-close-mobile-menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer scrollable body */}
              <div className="flex-1 overflow-y-auto py-3">

                {/* Auth section at top when logged in */}
                {isAuthenticated && (
                  <div className="flex items-center gap-3 px-5 py-4 mb-1 border-b border-border">
                    <Avatar className="h-11 w-11 border border-border shrink-0">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(user?.firstName?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account"}
                      </p>
                      {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                    </div>
                  </div>
                )}

                {/* Navigation section */}
                <div className="px-3 pt-2">
                  <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Navigate</p>
                  {[
                    { label: "Home",    href: "/",            icon: Home    },
                    { label: "Journal", href: "/blog",         icon: BookOpen},
                    { label: "Flights", href: "/flights",      icon: Plane   },
                    { label: "Events",  href: "/event-travel", icon: Ticket  },
                  ].map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                      data-testid={`mobile-nav-${label.toLowerCase()}`}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-border mx-3 my-3" />

                {/* Settings section */}
                <div className="px-3">
                  <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Settings</p>

                  <button
                    onClick={() => { setLangOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                    data-testid="mobile-nav-language"
                  >
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    Language &amp; Currency
                    <span className="ml-auto text-xs text-muted-foreground font-normal">{language}</span>
                  </button>

                  <Link
                    href="/manage-booking"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                    data-testid="mobile-nav-manage-booking"
                  >
                    <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                    Manage My Bookings
                  </Link>

                  <button
                    onClick={toggleDark}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                    data-testid="mobile-nav-dark-mode"
                  >
                    {dark ? <Sun className="w-4 h-4 text-muted-foreground shrink-0" /> : <Moon className="w-4 h-4 text-muted-foreground shrink-0" />}
                    {dark ? "Light Mode" : "Dark Mode"}
                  </button>

                  <button
                    onClick={() => setTimeFormat(timeFormat === "12h" ? "24h" : "12h")}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                    data-testid="mobile-nav-time-format"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    Time Format
                    <span className="ml-auto text-xs text-muted-foreground font-normal">{timeFormat === "12h" ? "12h" : "24h"}</span>
                  </button>
                </div>

                {/* Authenticated extras */}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-border mx-3 my-3" />
                    <div className="px-3">
                      <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">My Account</p>
                      <Link
                        href="/my-bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                        data-testid="mobile-nav-my-bookings"
                      >
                        <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                        {t("nav.my_bookings")}
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                        data-testid="mobile-nav-favorites"
                      >
                        <Heart className={`w-4 h-4 shrink-0 ${hasFavorites ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        My Favorites
                        {hasFavorites && (
                          <span className="ml-auto text-xs font-bold bg-red-100 dark:bg-red-950/50 text-red-600 px-1.5 py-0.5 rounded-full">{favCount}</span>
                        )}
                      </Link>
                      <Link
                        href="/invite"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                        data-testid="mobile-nav-invite"
                      >
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        Invite Friends &amp; Referrals
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer footer — logout or login */}
              <div className="shrink-0 px-5 py-4 border-t border-border">
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
                    data-testid="mobile-nav-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("nav.logout")}
                  </button>
                ) : (
                  <Button
                    onClick={() => { openLoginModal(); setMobileMenuOpen(false); }}
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                    data-testid="mobile-nav-login"
                  >
                    {t("nav.login")}
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

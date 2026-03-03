import { useState, useRef, useEffect } from "react";
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
import { LogOut, User, CalendarDays, Globe, KeyRound, X, Lightbulb, Moon, Sun, Heart } from "lucide-react";

// ... inside the Navbar component, find the Manage Bookings block and add Favorites after it
            {/* Favorites */}
            <div className="relative">
              <Link href="/favorites">
                <button
                  onMouseEnter={() => setFavoritesTooltip(true)}
                  onMouseLeave={() => setFavoritesTooltip(false)}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
                  data-testid="button-favorites"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </Link>
              {favoritesTooltip && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Favorites
                </div>
              )}
            </div>

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("lv_theme_v2") === "dark";
    } catch { return false; }
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

const LANGUAGES = [
  { name: "English", code: "EN", flag: "🇺🇸" },
  { name: "Français", code: "FR", flag: "🇫🇷" },
  { name: "Türkçe", code: "TR", flag: "🇹🇷" },
  { name: "Nederlands", code: "NL", flag: "🇳🇱" },
  { name: "Español", code: "ES", flag: "🇪🇸" },
  { name: "Deutsch", code: "DE", flag: "🇩🇪" },
  { name: "Italiano", code: "IT", flag: "🇮🇹" },
  { name: "العربية", code: "AR", flag: "🇸🇦" },
  { name: "Português", code: "PT", flag: "🇵🇹" },
  { name: "Ελληνικά", code: "EL", flag: "🇬🇷" },
  { name: "Română", code: "RO", flag: "🇷🇴" },
  { name: "Русский", code: "RU", flag: "🇷🇺" },
  { name: "日本語", code: "JA", flag: "🇯🇵" },
  { name: "中文", code: "ZH", flag: "🇨🇳" },
  { name: "한국어", code: "KO", flag: "🇰🇷" },
];

const CURRENCIES = [
  { name: "US Dollar", code: "USD", symbol: "$" },
  { name: "Euro", code: "EUR", symbol: "€" },
  { name: "British Pound", code: "GBP", symbol: "£" },
  { name: "Japanese Yen", code: "JPY", symbol: "¥" },
  { name: "Canadian Dollar", code: "CAD", symbol: "C$" },
  { name: "Australian Dollar", code: "AUD", symbol: "A$" },
  { name: "Swiss Franc", code: "CHF", symbol: "CHF" },
  { name: "UAE Dirham", code: "AED", symbol: "د.إ" },
];

const GUIDE_TIPS = [
  {
    icon: "✦",
    title: "Pick from the dropdown for best results",
    text: "When you type a destination, select a suggestion from the list — this gives the search engine a precise location and returns far more hotels.",
  },
  {
    icon: "♠",
    title: "Searching Las Vegas? Try \"Las Vegas Strip\"",
    text: "Type \"Las Vegas Strip\" and choose from the dropdown to surface the iconic Strip resorts — Bellagio, MGM Grand, Caesars Palace, and more.",
  },
  {
    icon: "✧",
    title: "Use Vibe search for inspiration",
    text: "Switch to the Vibe tab in the search bar and describe your dream stay — \"romantic beachfront resort\" or \"luxury casino with a rooftop pool\" — and AI will find it.",
  },
  {
    icon: "★",
    title: "4 & 5-star hotels shown by default",
    text: "Results are curated to luxury properties. Use the star filter in the sidebar to include 3-star or budget options at any time.",
  },
  {
    icon: "🛏",
    title: "Adjust dates on the hotel page",
    text: "On any hotel details page, use the compact search bar in the header to change your dates and see updated room rates instantly.",
  },
  {
    icon: "🔒",
    title: "Secure booking in 3 steps",
    text: "Select a room → fill in your guest details → pay with our secure payment system. Your booking confirmation appears instantly.",
  },
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
              <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
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
            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
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

function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <span
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-3xl font-semibold tracking-[0.18em] text-foreground uppercase"
            >
              Luxvibe
            </span>
          </div>

          <div className="text-center mb-7">
            <h2 className="text-xl font-bold text-foreground mb-2">{t("nav.sign_in")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("nav.sign_in_sub")}
            </p>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full h-11 text-sm font-semibold rounded-full"
            data-testid="button-login-continue"
          >
            {t("nav.continue_replit")}
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Navbar({ centralSlot }: { centralSlot?: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { currency, language } = usePreferences();
  const { t } = useTranslation();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [langOpen, setLangOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [keysTooltip, setKeysTooltip] = useState(false);
  const [langTooltip, setLangTooltip] = useState(false);
  const [favoritesTooltip, setFavoritesTooltip] = useState(false);
  const [guideTooltip, setGuideTooltip] = useState(false);
  const [loginTooltip, setLoginTooltip] = useState(false);
  const [darkTooltip, setDarkTooltip] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const tipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tipsOpen) return;
    function handleClick(e: MouseEvent) {
      if (tipsRef.current && !tipsRef.current.contains(e.target as Node)) {
        setTipsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [tipsOpen]);

  return (
    <>
      <LanguageModal open={langOpen} onClose={() => setLangOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-lg xs:text-xl sm:text-2xl font-semibold tracking-[0.1em] sm:tracking-[0.18em] text-foreground uppercase"
            >
              Luxvibe
            </span>
          </Link>

          {/* Central slot (compact search bar on hotel pages) */}
          {centralSlot && (
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-xl hidden md:flex justify-center">
              {centralSlot}
            </div>
          )}

          {/* Right side icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language / Currency */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(true)}
                onMouseEnter={() => setLangTooltip(true)}
                onMouseLeave={() => setLangTooltip(false)}
                className="h-9 px-2 rounded-full border border-border flex items-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
                data-testid="button-language"
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase">{language}</span>
              </button>
              {langTooltip && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                  {t("nav.language_currency")}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <div className="relative">
              <button
                onClick={toggleDark}
                onMouseEnter={() => setDarkTooltip(true)}
                onMouseLeave={() => setDarkTooltip(false)}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
                data-testid="button-theme-toggle"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {darkTooltip && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                  {dark ? "Light mode" : "Dark mode"}
                </div>
              )}
            </div>

            {/* Lightbulb — site guide - hidden on small mobile */}
            <div className="hidden xs:relative xs:block" ref={tipsRef}>
              <button
                onClick={() => setTipsOpen(o => !o)}
                onMouseEnter={() => setGuideTooltip(true)}
                onMouseLeave={() => setGuideTooltip(false)}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${tipsOpen ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50"}`}
                data-testid="button-site-guide"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
              {guideTooltip && !tipsOpen && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Luxvibe Guide
                </div>
              )}

              {tipsOpen && (
                <div className="absolute top-11 right-0 w-80 bg-white dark:bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">Luxvibe Guide</span>
                    </div>
                    <button
                      onClick={() => setTipsOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tips list */}
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
                    <p className="text-[11px] text-muted-foreground text-center">
                      Luxvibe — Luxury hotel booking made simple
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Manage Bookings */}
            <div className="relative">
              <Link href="/manage-booking">
                <button
                  onMouseEnter={() => setKeysTooltip(true)}
                  onMouseLeave={() => setKeysTooltip(false)}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
                  data-testid="button-manage-bookings"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              </Link>
              {keysTooltip && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                  {t("nav.manage_bookings")}
                </div>
              )}
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(user?.firstName?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.firstName && <p className="font-medium">{user.firstName} {user.lastName}</p>}
                      {user?.email && <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-bookings" className="cursor-pointer">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {t("nav.my_bookings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="relative">
                <Button
                  onClick={() => setLoginOpen(true)}
                  onMouseEnter={() => setLoginTooltip(true)}
                  onMouseLeave={() => setLoginTooltip(false)}
                  className="ml-1 h-9 px-5 rounded-full text-sm font-semibold"
                  data-testid="button-login"
                >
                  {t("nav.login")}
                </Button>
                {loginTooltip && (
                  <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                    {t("nav.login_tooltip")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

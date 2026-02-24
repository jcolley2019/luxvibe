import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
import { LogOut, User, CalendarDays, Globe, KeyRound, X } from "lucide-react";

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

function LanguageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"language" | "currency">("language");
  const [selectedLang, setSelectedLang] = useState("EN");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
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
            <DialogTitle className="text-xl font-bold">Choose a language and currency</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-border mb-5">
            {(["language", "currency"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-${t}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "language" ? (
            <>
              <div className="relative mb-4">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for a language"
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
                    onClick={() => { setSelectedLang(lang.code); onClose(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selectedLang === lang.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
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
                  onClick={() => { setSelectedCurrency(cur.code); onClose(); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selectedCurrency === cur.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
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
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <span
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-3xl font-semibold tracking-[0.18em] text-foreground uppercase"
            >
              Luxvibe
            </span>
          </div>

          <div className="text-center mb-7">
            <h2 className="text-xl font-bold text-foreground mb-2">Sign in and start booking</h2>
            <p className="text-sm text-muted-foreground">
              Discover luxury hotels and manage your reservations with ease.
            </p>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full h-11 text-sm font-semibold rounded-full"
            data-testid="button-login-continue"
          >
            Continue with Replit
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

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [keysTooltip, setKeysTooltip] = useState(false);

  return (
    <>
      <LanguageModal open={langOpen} onClose={() => setLangOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-2xl font-semibold tracking-[0.18em] text-foreground uppercase"
            >
              Luxvibe
            </span>
          </Link>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            {/* Language / Currency */}
            <button
              onClick={() => setLangOpen(true)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
              title="Language & Currency"
              data-testid="button-language"
            >
              <Globe className="w-4 h-4" />
            </button>

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
                <div className="absolute top-11 right-0 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Manage my bookings
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
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setLoginOpen(true)}
                className="ml-1 h-9 px-5 rounded-full text-sm font-semibold"
                data-testid="button-login"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

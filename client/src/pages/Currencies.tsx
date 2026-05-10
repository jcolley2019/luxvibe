import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Search, DollarSign } from "lucide-react";

interface Currency {
  code: string;
  currency: string;
  countries: string[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "$", AUD: "$", CHF: "Fr",
  CNY: "¥", HKD: "$", SGD: "$", INR: "₹", MXN: "$", BRL: "R$", ZAR: "R",
  AED: "د.إ", SAR: "﷼", QAR: "ر.ق", KWD: "د.ك", BHD: ".د.ب", OMR: "﷼",
  THB: "฿", MYR: "RM", IDR: "Rp", PHP: "₱", KRW: "₩", TWD: "$",
  TRY: "₺", RUB: "₽", PLN: "zł", CZK: "Kč", HUF: "Ft", RON: "lei",
  DKK: "kr", SEK: "kr", NOK: "kr", ISK: "kr", NZD: "$", FJD: "$",
  MAD: "د.م.", EGP: "£", NGN: "₦", GHS: "₵", KZT: "₸", UAH: "₴",
  ILS: "₪", JOD: "JD", LKR: "₨", PKR: "₨", VND: "₫", COP: "$",
  ARS: "$", CLP: "$", PEN: "S/", DOP: "$", MUR: "₨", MNT: "₮",
};

const CURRENCY_FLAG: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CAD: "🇨🇦", AUD: "🇦🇺",
  CHF: "🇨🇭", CNY: "🇨🇳", HKD: "🇭🇰", SGD: "🇸🇬", INR: "🇮🇳", MXN: "🇲🇽",
  BRL: "🇧🇷", ZAR: "🇿🇦", AED: "🇦🇪", SAR: "🇸🇦", QAR: "🇶🇦", KWD: "🇰🇼",
  BHD: "🇧🇭", OMR: "🇴🇲", THB: "🇹🇭", MYR: "🇲🇾", IDR: "🇮🇩", PHP: "🇵🇭",
  KRW: "🇰🇷", TWD: "🇹🇼", TRY: "🇹🇷", RUB: "🇷🇺", PLN: "🇵🇱", CZK: "🇨🇿",
  HUF: "🇭🇺", RON: "🇷🇴", DKK: "🇩🇰", SEK: "🇸🇪", NOK: "🇳🇴", ISK: "🇮🇸",
  NZD: "🇳🇿", FJD: "🇫🇯", MAD: "🇲🇦", EGP: "🇪🇬", NGN: "🇳🇬", GHS: "🇬🇭",
  KZT: "🇰🇿", UAH: "🇺🇦", ILS: "🇮🇱", JOD: "🇯🇴", LKR: "🇱🇰", PKR: "🇵🇰",
  VND: "🇻🇳", COP: "🇨🇴", ARS: "🇦🇷", CLP: "🇨🇱", PEN: "🇵🇪", DOP: "🇩🇴",
  MUR: "🇲🇺", MNT: "🇲🇳", MYR2: "🇲🇾", AMD: "🇦🇲", AZN: "🇦🇿", CVE: "🇨🇻",
  GEL: "🇬🇪", XOF: "🌍",
};

export default function Currencies() {
  const [search, setSearch] = useState("");

  const { data: currencies = [], isLoading } = useQuery<Currency[]>({
    queryKey: ["/api/data/currencies"],
  });

  const filtered = currencies.filter(c => {
    const q = search.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q) ||
      c.countries.some(co => co.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Supported Currencies</h1>
              <p className="text-sm text-muted-foreground">All currencies available for hotel pricing</p>
            </div>
          </div>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search currency or country…"
            className="pl-9"
            data-testid="input-currency-search"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} currencies</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <div
                  key={c.code}
                  className="bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/30 transition-all"
                  data-testid={`card-currency-${c.code}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{CURRENCY_FLAG[c.code] || "💱"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-base">{c.code}</span>
                        {CURRENCY_SYMBOLS[c.code] && (
                          <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                            {CURRENCY_SYMBOLS[c.code]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{c.currency}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {c.countries.slice(0, 3).join(" · ")}
                    {c.countries.length > 3 && (
                      <span className="text-primary/70"> +{c.countries.length - 3} more</span>
                    )}
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

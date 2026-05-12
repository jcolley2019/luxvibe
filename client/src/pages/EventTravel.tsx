import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Hotel,
  Ticket,
  MapPin,
  Music,
  Trophy,
  Drama,
  Users,
  PartyPopper,
  ArrowRight,
  Search,
  CheckCircle2,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";

// Images grouped by category so the carousel never shows two of the same type back-to-back
const HERO_CATEGORY_IMAGES: { category: string; url: string }[] = [
  // NFL — 3 stadiums
  { category: "nfl", url: "https://images.unsplash.com/photo-1557174949-3b1f5b2e8fac?w=1920&q=80" },  // aerial field
  { category: "nfl", url: "https://images.unsplash.com/photo-1560354765-02010876efff?w=1920&q=80" },  // Chargers stadium sunset crowd
  { category: "nfl", url: "https://images.unsplash.com/photo-1566349872260-a1d88307b698?w=1920&q=80" }, // FedEx Field panoramic
  // NHL — 3 arenas
  { category: "nhl", url: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=1920&q=80" }, // existing
  { category: "nhl", url: "https://images.unsplash.com/photo-1701361172842-b132f9b09948?w=1920&q=80" }, // empty NHL ice rink
  { category: "nhl", url: "https://images.unsplash.com/photo-1742637747283-5d50e82f7b50?w=1920&q=80" }, // hockey game packed arena
  // MLB — 4 ballparks
  { category: "mlb", url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1920&q=80" }, // existing
  { category: "mlb", url: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=1920&q=80" }, // aerial baseball stadium
  { category: "mlb", url: "https://images.unsplash.com/photo-1464701116432-f476204d6c45?w=1920&q=80" }, // green ballpark skyline
  { category: "mlb", url: "https://images.unsplash.com/photo-1623947454404-c5efce008360?w=1920&q=80" }, // fans watching daytime game
  // NBA — 4 arenas
  { category: "nba", url: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=1920&q=80" }, // existing
  { category: "nba", url: "https://images.unsplash.com/photo-1533923156502-be31530547c4?w=1920&q=80" }, // basketball court
  { category: "nba", url: "https://images.unsplash.com/photo-1563506644863-444710df1e03?w=1920&q=80" }, // players on court
  { category: "nba", url: "https://images.unsplash.com/photo-1572454181157-0b40dd7667fe?w=1920&q=80" }, // arena crowd
  // Soccer
  { category: "soccer",   url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80" },
  // Concerts — 4 shots
  { category: "concert", url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80" },
  { category: "concert", url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80" },
  { category: "concert", url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=80" },
  { category: "concert", url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&q=80" },
  // Festivals — 3 shots
  { category: "festival", url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1920&q=80" },
  { category: "festival", url: "https://images.unsplash.com/photo-1593621198039-c87c6f91cbb1?w=1920&q=80" }, // Red Rocks
  { category: "festival", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80" },
  // Theater — 2 shots
  { category: "theater", url: "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=1920&q=80" },
  { category: "theater", url: "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=1920&q=80" },
  // Comedy
  { category: "comedy",  url: "https://images.unsplash.com/photo-1611956425642-d5a8169abd63?w=1920&q=80" },
];

// Build a shuffled sequence picking one image per category, ensuring no two
// consecutive items share a category. Pass `lastCategory` to also prevent a
// match at the seam between two rounds.
function buildHeroSequence(lastCategory?: string): string[] {
  // Collect one random pick per category
  const groups = new Map<string, string[]>();
  for (const item of HERO_CATEGORY_IMAGES) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category)!.push(item.url);
  }
  let picks = Array.from(groups.entries()).map(([cat, urls]) => ({
    category: cat,
    url: urls[Math.floor(Math.random() * urls.length)],
  }));

  // Fisher-Yates shuffle
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }

  // Fix seam: first item must differ from the last category of the previous round
  if (lastCategory && picks[0].category === lastCategory) {
    const swap = picks.findIndex((p, idx) => idx > 0 && p.category !== lastCategory);
    if (swap !== -1) [picks[0], picks[swap]] = [picks[swap], picks[0]];
  }

  // Fix any consecutive same-category pairs within the sequence
  for (let i = 0; i < picks.length - 1; i++) {
    if (picks[i].category === picks[i + 1].category) {
      for (let j = i + 2; j < picks.length; j++) {
        if (picks[j].category !== picks[i].category) {
          [picks[i + 1], picks[j]] = [picks[j], picks[i + 1]];
          break;
        }
      }
    }
  }

  return picks.map((p) => p.url);
}

// Build the initial sequence at module load time and preload the first image
// immediately — the browser starts fetching before React even mounts the component.
const _INITIAL_SEQ = buildHeroSequence();
const _preload = new window.Image();
_preload.src = _INITIAL_SEQ[0];

const STEP_FLOW = [
  {
    icon: Search,
    title: "Search a destination or date",
    description:
      "Enter a city, region, or travel date to start discovering luxury hotels and nearby events.",
  },
  {
    icon: Hotel,
    title: "Discover luxury hotels near live events",
    description:
      "Browse premium hotel options close to venues, with contextual event discovery for that destination.",
  },
  {
    icon: CheckCircle2,
    title: "Book your hotel on LuxVibe",
    description:
      "Complete your hotel reservation securely through LuxVibe's booking flow. No bundled ticket checkout.",
  },
  {
    icon: MapPin,
    title: "See relevant events nearby",
    description:
      "View concerts, sports, theater, and festivals happening near your hotel during your stay.",
  },
  {
    icon: Ticket,
    title: "Buy tickets directly on Ticketmaster",
    description:
      "Ticket CTAs send you to Ticketmaster's official site. All purchases, fulfillment, and service are handled entirely by Ticketmaster.",
  },
];

const CATEGORIES = [
  { icon: Music, label: "Concerts & Tours", description: "Major artists, intimate venues, festival headliners" },
  { icon: Trophy, label: "Sports & Live Games", description: "NFL, NBA, MLB, NHL, MLS, college sports" },
  { icon: Drama, label: "Comedy & Theater", description: "Broadway tours, stand-up, performing arts" },
  { icon: Users, label: "Family Events", description: "Shows and experiences the whole family enjoys" },
  { icon: PartyPopper, label: "Festivals", description: "Food, music, culture, and destination festivals" },
];

const FAQS = [
  {
    q: "Does LuxVibe sell event tickets?",
    a: "No. LuxVibe does not sell, resell, hold, transfer, or guarantee event tickets. We are a luxury hotel booking and event-travel discovery platform.",
  },
  {
    q: "Are hotel bookings and ticket purchases bundled together?",
    a: "No. Hotel bookings and event ticket purchases are always completed separately, on their respective platforms. There is no combined checkout.",
  },
  {
    q: "Where do users buy tickets?",
    a: "When event ticket links are available, users are directed to Ticketmaster or another official ticketing partner to complete the purchase directly on that platform.",
  },
  {
    q: "Does LuxVibe promote resale tickets or presale codes?",
    a: "No. LuxVibe does not promote resale inventory, ticket resale, presale codes, or any discounted or guaranteed ticket access.",
  },
  {
    q: "Does LuxVibe offer ticket discounts or cashback?",
    a: "No. LuxVibe is not a coupon site, cashback platform, voucher site, loyalty or rewards partner, browser extension, subnetwork, price-comparison site, or demand-insight tool.",
  },
  {
    q: "What is LuxVibe's role in event travel?",
    a: "LuxVibe helps travelers discover luxury hotel stays near concerts, sports, theater, festivals, and destination events. Event discovery is a contextual feature — not a ticket-selling service.",
  },
  {
    q: "How does LuxVibe use event data?",
    a: "LuxVibe uses approved event data to surface relevant nearby events to travelers who are already planning hotel stays. Users are directed to official ticketing partners to complete any ticket purchases.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-card hover:bg-muted/40 transition-colors"
        data-testid={`faq-toggle-${q.substring(0, 20).toLowerCase().replace(/\s+/g, "-")}`}
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground text-sm leading-snug">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-card border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function EventTravel() {
  const [, navigate] = useLocation();
  const howItWorksRef = useRef<HTMLElement>(null);

  // Category-aware carousel — built once, regenerated seamlessly each round
  const heroSeqRef = useRef<string[]>(_INITIAL_SEQ);
  const heroSeqIdxRef = useRef(0);
  const [heroUrl, setHeroUrl] = useState<string>(_INITIAL_SEQ[0]);
  const [prevHeroUrl, setPrevHeroUrl] = useState<string | null>(null);

  // Preload the next image in the sequence so every crossfade is instant
  useEffect(() => {
    const seq = heroSeqRef.current;
    const nextIdx = (heroSeqIdxRef.current + 1) % seq.length;
    const img = new window.Image();
    img.src = seq[nextIdx];
  }, [heroUrl]);

  useEffect(() => {
    const timer = setInterval(() => {
      const seq = heroSeqRef.current;
      const nextIdx = heroSeqIdxRef.current + 1;
      setPrevHeroUrl(seq[heroSeqIdxRef.current]);
      if (nextIdx >= seq.length) {
        const lastCat = HERO_CATEGORY_IMAGES.find(
          (h) => h.url === seq[seq.length - 1]
        )?.category;
        heroSeqRef.current = buildHeroSequence(lastCat);
        heroSeqIdxRef.current = 0;
      } else {
        heroSeqIdxRef.current = nextIdx;
      }
      setHeroUrl(heroSeqRef.current[heroSeqIdxRef.current]);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.title = "Event Travel & Luxury Hotel Stays Near Concerts, Sports & Festivals | LuxVibe";

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", "Discover luxury hotels near concerts, sports, theater, and festivals. LuxVibe is an event-travel planning platform — official tickets purchased on Ticketmaster.");
    setMeta("robots", "index, follow");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://luxvibe.io/event-travel");

    const OG_IMAGE = "https://images.unsplash.com/photo-1593621198039-c87c6f91cbb1?w=1200&q=80";

    setMeta("og:type", "website", true);
    setMeta("og:title", "Event Travel & Luxury Hotel Stays | LuxVibe", true);
    setMeta("og:description", "Plan premium trips around live events. LuxVibe finds luxury hotels near venues — official ticket purchases completed on Ticketmaster.", true);
    setMeta("og:url", "https://luxvibe.io/event-travel", true);
    setMeta("og:site_name", "LuxVibe", true);
    setMeta("og:image", OG_IMAGE, true);
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "800", true);
    setMeta("og:image:alt", "Red Rocks Amphitheatre — event travel planning with LuxVibe", true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "Event Travel & Luxury Hotel Stays | LuxVibe");
    setMeta("twitter:description", "Discover luxury hotels near concerts, sports, theater, and festivals. Official tickets on Ticketmaster.");
    setMeta("twitter:image", OG_IMAGE);
    setMeta("twitter:image:alt", "Red Rocks Amphitheatre — event travel planning with LuxVibe");

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    };
    const webPageJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Event Travel & Luxury Hotel Stays Near Concerts, Sports & Festivals | LuxVibe",
      description: "LuxVibe is a luxury hotel booking and event-travel discovery platform. Official event tickets are purchased directly through Ticketmaster.",
      url: "https://luxvibe.io/event-travel",
      publisher: { "@type": "Organization", name: "LuxVibe", url: "https://luxvibe.io" },
    };
    const injectJsonLd = (id: string, data: object) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("script");
        el.setAttribute("type", "application/ld+json");
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };
    injectJsonLd("ld-faq", faqJsonLd);
    injectJsonLd("ld-webpage", webPageJsonLd);

    return () => {
      document.title = "LuxVibe — Luxury Hotel Booking";
    };
  }, []);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden h-[320px] md:h-[638px] flex flex-col justify-center px-4 bg-black">
        {/* Crossfading background images — prev fades out, current fades in */}
        {prevHeroUrl && (
          <div
            key={prevHeroUrl + "-prev"}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none"
            style={{ opacity: 0 }}
            aria-hidden="true"
          >
            <img src={prevHeroUrl} alt="" className="w-full h-full object-cover object-center" />
          </div>
        )}
        <div
          key={heroUrl}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none"
          style={{ opacity: 1 }}
          aria-hidden="true"
        >
          <img src={heroUrl} alt="" className="w-full h-full object-cover object-center" loading="eager" />
        </div>
        {/* Dark overlay — same weight as main hero */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 text-center w-full">
          <Badge variant="secondary" className="mb-5 bg-white/10 text-white border-white/20 backdrop-blur-sm text-sm px-4 py-1">
            <Ticket className="w-3.5 h-3.5 mr-1.5" />
            Event Travel Planning
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 font-serif leading-tight">
            Luxury Hotel Stays for Event-Driven Travel
          </h1>
          <p className="text-white/75 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Plan premium trips around concerts, sports, theater, festivals, and destination events. LuxVibe helps travelers discover luxury hotels near live experiences, then directs users to official ticketing partners such as Ticketmaster to complete event ticket purchases directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link href="/events">
              <Button
                size="lg"
                className="h-12 px-8 text-base shadow-lg"
                data-testid="button-explore-event-travel"
              >
                Explore Event Travel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg"
              onClick={scrollToHowItWorks}
              data-testid="button-learn-ticketing"
            >
              Learn How Ticketing Works
            </Button>
          </div>
          <p className="text-white/50 text-xs">
            Hotel bookings and event ticket purchases are completed separately. LuxVibe does not sell or resell event tickets.
          </p>
        </div>
      </section>

      {/* ── Our Ticketing Model (reviewer trust block) ── */}
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-4">
        <div className="flex items-start gap-3 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground text-base mb-2">Our Ticketing Model</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              LuxVibe helps travelers discover events near luxury hotel stays. Event tickets are not sold, resold, bundled, held, transferred, or guaranteed by LuxVibe. When available, users are sent to Ticketmaster to complete official ticket purchases directly. Hotel bookings and event ticket purchases are always completed separately on their respective platforms.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section ref={howItWorksRef} className="max-w-5xl mx-auto px-4 py-14" id="how-it-works">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">How it works</p>
          <h2 className="text-3xl font-bold text-foreground font-serif">Your complete event trip, step by step</h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-xl mx-auto">
            Search a destination or date → discover luxury hotels → see relevant nearby events → book your hotel on LuxVibe → buy event tickets directly on Ticketmaster.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {STEP_FLOW.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              <div className="flex flex-col items-start p-5 rounded-2xl border border-border bg-card h-full">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 shrink-0">
                  <step.icon className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
                </div>
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-sm">
                  {i + 1}
                </div>
                <p className="font-semibold text-foreground text-sm mb-1.5 leading-snug">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {i < STEP_FLOW.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Event Categories ── */}
      <section className="bg-muted/30 border-y border-border px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Event categories</p>
            <h2 className="text-3xl font-bold text-foreground font-serif">Every type of live event, one platform</h2>
            <p className="text-muted-foreground mt-3 text-sm">Contextual event discovery for travelers planning luxury hotel stays.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href="/events">
                  <div
                    className="group flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                    data-testid={`card-category-${cat.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <cat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{cat.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: CATEGORIES.length * 0.08 }}
            >
              <Link href="/events">
                <div className="group flex items-center justify-center gap-3 p-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer h-full min-h-[88px]">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary group-hover:underline">Browse all events</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why LuxVibe Fits Event Travel ── */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Why LuxVibe</p>
          <h2 className="text-3xl font-bold text-foreground font-serif">Built for event-driven travel</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Contextual event discovery</p>
              <p className="text-sm text-muted-foreground">
                LuxVibe surfaces events as a contextual layer for travelers already planning luxury hotel stays — not as a ticket marketplace. Event listings help travelers choose when and where to stay.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Official ticket purchase on Ticketmaster</p>
              <p className="text-sm text-muted-foreground">
                All ticket CTAs link directly to Ticketmaster's official purchase pages. Ticketmaster handles all pricing, sales, fulfillment, and customer service. LuxVibe has no involvement in the ticket transaction.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Luxury hotel stays near live events</p>
              <p className="text-sm text-muted-foreground">
                Hotel reservations are booked through LuxVibe's own secure booking flow, connecting travelers to 2M+ hotels worldwide. Hotel and ticket purchases are always separate transactions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Incremental audience for live events</p>
              <p className="text-sm text-muted-foreground">
                LuxVibe reaches a premium travel audience that books hotels before discovering local events — not deal-seekers or ticket-comparison shoppers. This drives incremental ticket demand for live event organizers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Not a Resale or Discount Platform ── */}
      <section className="bg-muted/30 border-y border-border px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-3 p-6 rounded-2xl border border-border bg-card">
            <XCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground mb-2">Not a Resale or Discount Platform</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                LuxVibe is not a voucher site, coupon site, cashback platform, loyalty or rewards partner, browser extension, subnetwork, price-comparison site, social-only presence, marketing agency, conversion tool, or demand-insight platform. LuxVibe does not promote resale inventory, presale codes, ticket discounts, or guaranteed ticket access of any kind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partnership Use Case ── */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Partnership use case</p>
          <h2 className="text-3xl font-bold text-foreground font-serif">How LuxVibe integrates event data</h2>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            LuxVibe's intended integration is to use approved event data — including venue names, event dates, locations, and affiliate links — to recommend relevant concerts, sports, theater, festivals, and live events to travelers who are planning luxury hotel stays in those destinations.
          </p>
          <p>
            Event data is used purely for contextual discovery. When a traveler clicks a ticket link, they are sent to Ticketmaster's official website to complete the purchase. LuxVibe does not intermediate, collect payment, or interact with ticket inventory in any way.
          </p>
          <p>
            LuxVibe targets a premium-travel audience that books ahead and discovers local events as part of their trip planning — an incremental audience segment not typically reached by dedicated ticket-search or resale platforms.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-muted/20 border-t border-border px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-foreground font-serif">Common questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-background border border-primary/20">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-foreground font-serif mb-1">Ready to plan your trip?</h3>
            <p className="text-sm text-muted-foreground">Browse events near you and find luxury hotel stays nearby.</p>
          </div>
          <Link href="/events">
            <Button size="lg" className="shrink-0" data-testid="button-cta-browse-events">
              Explore Event Travel
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Ticketing Disclosure ── */}
      <section id="ticketing-disclosure" className="border-t border-border bg-muted/20 px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-5 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground text-sm">Ticketing Disclosure</p>
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
            <p>
              <strong className="text-foreground">Ticket disclaimer:</strong> Event tickets are sold and fulfilled by Ticketmaster or another official ticketing partner. LuxVibe does not sell, resell, hold, transfer, or guarantee event tickets. Hotel bookings and event ticket purchases are completed separately on their respective platforms. When available, ticket purchases are completed directly through Ticketmaster or another official ticketing partner.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
            <p>
              <strong className="text-foreground">Affiliate disclosure:</strong> LuxVibe may earn a commission when users purchase tickets through eligible Ticketmaster affiliate links. This does not affect the price you pay or the availability of tickets. LuxVibe is an independent travel platform and is not affiliated with, endorsed by, or sponsored by Ticketmaster.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
            <p>
              <strong className="text-foreground">Platform type:</strong> LuxVibe is a luxury hotel booking and event-travel discovery platform. It is not a coupon site, cashback platform, voucher site, loyalty or rewards partner, browser extension, subnetwork, price-comparison site, resale marketplace, or ticket-selling service.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

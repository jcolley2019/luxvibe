import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
  Zap,
  Mic2,
  Smile,
  Star,
  Radio,
} from "lucide-react";
import { useState } from "react";

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

const EVENT_CARDS = [
  {
    label: "NFL Football",
    subtitle: "Regular season, playoffs & Super Bowl",
    icon: Trophy,
    gradient: "from-green-600 to-emerald-700",
  },
  {
    label: "NBA Basketball",
    subtitle: "Regular season, playoffs & Finals",
    icon: Zap,
    gradient: "from-orange-500 to-red-600",
  },
  {
    label: "NHL Hockey",
    subtitle: "Regular season & Stanley Cup Playoffs",
    icon: Star,
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    label: "MLB Baseball",
    subtitle: "Regular season, playoffs & World Series",
    icon: Radio,
    gradient: "from-red-500 to-rose-600",
  },
  {
    label: "NCAA College Sports",
    subtitle: "College football, March Madness & more",
    icon: Users,
    gradient: "from-amber-500 to-yellow-600",
  },
  {
    label: "Arena Concerts",
    subtitle: "Stadium tours and arena headline shows",
    icon: Music,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    label: "Intimate Venue Shows",
    subtitle: "Club shows, theater concerts, smaller stages",
    icon: Mic2,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    label: "Music Festivals",
    subtitle: "Multi-day outdoor and destination festivals",
    icon: PartyPopper,
    gradient: "from-fuchsia-500 to-pink-600",
  },
  {
    label: "Comedy Shows",
    subtitle: "Stand-up tours, comedy clubs & specials",
    icon: Smile,
    gradient: "from-yellow-400 to-amber-500",
  },
  {
    label: "Theater & Performing Arts",
    subtitle: "Broadway tours, ballet, opera & stage plays",
    icon: Drama,
    gradient: "from-teal-500 to-cyan-600",
  },
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

    setMeta("og:type", "website", true);
    setMeta("og:title", "Event Travel & Luxury Hotel Stays | LuxVibe", true);
    setMeta("og:description", "Plan premium trips around live events. LuxVibe finds luxury hotels near venues — official ticket purchases completed on Ticketmaster.", true);
    setMeta("og:url", "https://luxvibe.io/event-travel", true);
    setMeta("og:site_name", "LuxVibe", true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "Event Travel & Luxury Hotel Stays | LuxVibe");
    setMeta("twitter:description", "Discover luxury hotels near concerts, sports, theater, and festivals. Official tickets on Ticketmaster.");

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
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 pt-28 pb-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 text-center">
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

      {/* ── Event Experience Cards ── */}
      <section className="bg-muted/30 border-y border-border px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Explore by event type</p>
            <h2 className="text-3xl font-bold text-foreground font-serif">Every live experience, one platform</h2>
            <p className="text-muted-foreground mt-3 text-sm max-w-xl mx-auto">
              Discover luxury hotels near the events that matter to you. Official tickets purchased directly on Ticketmaster.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {EVENT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href="/events">
                    <div
                      className={`relative overflow-hidden rounded-xl p-5 text-left text-white bg-gradient-to-br ${card.gradient} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group cursor-pointer h-full`}
                      data-testid={`card-event-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className="w-7 h-7 mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300" />
                      <div className="text-sm font-bold leading-tight mb-1">{card.label}</div>
                      <div className="text-[11px] leading-snug opacity-75">{card.subtitle}</div>
                      <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <Icon className="w-14 h-14" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-center mt-6">
            <Link href="/events">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-sm font-semibold text-foreground transition-colors"
                data-testid="button-browse-all-events"
              >
                <MapPin className="w-4 h-4 text-primary" />
                Browse all events
                <ArrowRight className="w-4 h-4 text-primary" />
              </button>
            </Link>
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

      <Footer />
    </div>
  );
}

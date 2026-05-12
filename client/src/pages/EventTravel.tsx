import { Link } from "wouter";
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
} from "lucide-react";

const STEP_FLOW = [
  {
    icon: Search,
    title: "Search a destination or travel date",
    description: "Enter a city, venue, or date to discover events and luxury hotels in that area.",
  },
  {
    icon: Hotel,
    title: "Discover luxury hotels and relevant nearby events",
    description: "We surface premium hotel options close to your venue alongside contextual event discovery for that destination.",
  },
  {
    icon: CheckCircle2,
    title: "Book your hotel on LuxVibe",
    description: "Complete your hotel reservation securely through LuxVibe's booking flow — no account required.",
  },
  {
    icon: Ticket,
    title: "Click through to Ticketmaster to complete ticket purchases directly",
    description: "Ticket CTAs send you to Ticketmaster's official site. All ticket sales, fulfillment, and customer service are handled entirely by Ticketmaster.",
  },
];

const CATEGORIES = [
  { icon: Music, label: "Concerts & Tours", description: "Major artists, intimate venues, festival headliners" },
  { icon: Trophy, label: "Sports & Live Games", description: "NFL, NBA, MLB, NHL, MLS, college sports" },
  { icon: Drama, label: "Comedy & Theater", description: "Broadway tours, stand-up, performing arts" },
  { icon: Users, label: "Family Events", description: "Shows and experiences the whole family enjoys" },
  { icon: PartyPopper, label: "Festivals", description: "Food, music, culture, and destination festivals" },
];

export default function EventTravel() {
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
            Discover premium hotels near concerts, sports, theater, festivals, and destination events. Event tickets are purchased directly through official ticketing partners such as Ticketmaster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/events">
              <Button
                size="lg"
                className="h-12 px-8 text-base shadow-lg"
                data-testid="button-browse-events"
              >
                Browse Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg"
                data-testid="button-search-hotels-hero"
              >
                <Hotel className="w-4 h-4 mr-2" />
                Search Hotels
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Commitment block ── */}
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-4">
        <div className="flex items-start gap-3 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground text-base mb-2">Our commitment to you</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              LuxVibe does not sell, resell, hold, transfer, or guarantee event tickets. Hotel bookings and event ticket purchases are completed separately. When available, ticket purchases are completed directly on Ticketmaster.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-5xl mx-auto px-4 py-14" id="how-it-works">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">How it works</p>
          <h2 className="text-3xl font-bold text-foreground font-serif">Your complete event trip, in four steps</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEP_FLOW.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col items-start p-6 rounded-2xl border border-border bg-card h-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 shrink-0">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                  {i + 1}
                </div>
                <p className="font-semibold text-foreground mb-1.5 leading-snug">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {i < STEP_FLOW.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-muted-foreground/40" />
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

      {/* ── Feature cards ── */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Contextual event discovery</p>
              <p className="text-sm text-muted-foreground">
                LuxVibe surfaces event listings as a contextual discovery layer for travelers planning luxury hotel stays. We are an event-travel planning platform, not a ticket seller.
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
              <p className="font-semibold text-foreground mb-1">Luxury hotel stays near events</p>
              <p className="text-sm text-muted-foreground">
                Hotel reservations are booked through LuxVibe's secure booking flow, connecting you to 2M+ hotels worldwide. Hotel and ticket purchases are always separate transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 pb-14">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-background border border-primary/20">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-foreground font-serif mb-1">Ready to plan your trip?</h3>
            <p className="text-sm text-muted-foreground">Browse events near you and find the perfect luxury hotel stays nearby.</p>
          </div>
          <Link href="/events">
            <Button size="lg" className="shrink-0" data-testid="button-cta-browse-events">
              Browse Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Disclosures ── */}
      <section id="ticketing-disclosure" className="border-t border-border bg-muted/20 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
            <p>
              <strong className="text-foreground">Ticket disclaimer:</strong> Event tickets are sold and fulfilled by Ticketmaster. LuxVibe does not sell, resell, hold, transfer, or guarantee event tickets. Hotel bookings and event ticket purchases are completed separately on their respective platforms.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
            <p>
              <strong className="text-foreground">Affiliate disclosure:</strong> LuxVibe may earn a commission when users purchase tickets through eligible Ticketmaster affiliate links. This does not affect the price you pay or the availability of tickets.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

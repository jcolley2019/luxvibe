import { useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Car, ArrowRight, MapPin, ShieldCheck, Clock, Star, Bell,
} from "lucide-react";
import { TravelModeTabs } from "@/components/TravelModeTabs";

const FEATURES = [
  {
    icon: MapPin,
    title: "Pick-up at 5,000+ locations",
    description: "Airport desks, city centres, and hotel drop-offs covered worldwide.",
  },
  {
    icon: ShieldCheck,
    title: "Fully insured options",
    description: "Compare CDW, liability, and full-coverage plans from top carriers at checkout.",
  },
  {
    icon: Clock,
    title: "Flexible cancellation",
    description: "Free cancellation on most bookings up to 48 hours before pick-up.",
  },
  {
    icon: Star,
    title: "Luxury & premium fleets",
    description: "SUVs, executive sedans, convertibles, and exotic models from top brands.",
  },
];

export default function CarRental() {
  useEffect(() => {
    document.title = "Car Rental — Coming Soon | LuxVibe";
    return () => { document.title = "LuxVibe — Luxury Hotel Booking"; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Back button ── */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-home"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[480px] md:h-[638px] flex flex-col justify-center px-4 py-16 md:py-0 bg-black">
        <img
          src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1920&q=80"
          alt="Luxury rental car on open road"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 text-center w-full">
          {/* Travel mode tabs floating on the hero */}
          <TravelModeTabs active="cars" variant="hero" className="mb-8" />

          <Badge
            variant="secondary"
            className="mb-5 bg-white/10 text-white border-white/20 backdrop-blur-sm text-sm px-4 py-1"
          >
            <Car className="w-3.5 h-3.5 mr-1.5" />
            Car Rental
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-5 font-serif leading-tight">
            Rent the Perfect Car for Your Journey
          </h1>
          <p className="text-white/75 text-sm sm:text-base md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            From airport pick-up to hotel drop-off — compare luxury, economy, and SUV rentals
            from top carriers worldwide. Launching soon.
          </p>

          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
            <Bell className="w-5 h-5 text-white/80 shrink-0" />
            <span className="text-white font-semibold text-base">Car Rental Search — Coming Soon</span>
          </div>

          <p className="text-white/45 text-xs mt-5">
            We're finalising partnerships with leading rental carriers. Check back soon.
          </p>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">What to expect</p>
          <h2 className="text-3xl font-bold text-foreground font-serif">Everything you need in one place</h2>
          <p className="text-muted-foreground mt-3 text-base max-w-xl mx-auto">
            When car rental launches, you'll be able to search, compare, and book directly alongside your hotel and flights.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-start p-6 rounded-2xl border border-border bg-card"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 shrink-0">
                <feat.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-base mb-2 leading-snug">{feat.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Car image strip ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Premium fleet</p>
            <h2 className="text-3xl font-bold text-foreground font-serif">
              Economy to exotic — every class covered
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80", label: "Sports & Exotic" },
              { url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80", label: "SUV & Crossover" },
              { url: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&q=80", label: "Luxury Sedan" },
            ].map(({ url, label }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl overflow-hidden aspect-[4/3] group"
              >
                <img
                  src={url}
                  alt={label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <p className="absolute bottom-4 left-4 text-white font-semibold text-base drop-shadow">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-foreground font-serif mb-3">Ready to plan your full trip?</h2>
        <p className="text-muted-foreground mb-6 text-base">
          While car rental is coming soon, you can book luxury hotels and flights right now.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            data-testid="link-search-hotels"
          >
            Search Hotels
          </Link>
          <Link
            href="/flights"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-border text-sm font-semibold hover:bg-muted/50 transition-colors"
            data-testid="link-search-flights"
          >
            Search Flights
          </Link>
        </div>
      </section>
    </div>
  );
}

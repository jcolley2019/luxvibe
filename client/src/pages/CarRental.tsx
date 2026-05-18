import { useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Car, ArrowRight, MapPin, ShieldCheck, Clock, Star, ExternalLink,
} from "lucide-react";
import { TravelModeTabs } from "@/components/TravelModeTabs";

const AFFILIATE_ID = import.meta.env.VITE_RENTAL_CAR_AFFILIATE_ID || "joeyc2019";
const BASE_URL = import.meta.env.VITE_RENTAL_CAR_AFFILIATE_URL || "https://www.discovercars.com";
const US_SEARCH_URL = `${BASE_URL}/united-states/?a_aid=${AFFILIATE_ID}`;
const GENERAL_URL = `${BASE_URL}/?a_aid=${AFFILIATE_ID}`;

const FEATURES = [
  {
    icon: MapPin,
    title: "Pick-up at 10,000+ locations",
    description: "Airport desks, city centres, and hotel drop-offs across the US and worldwide.",
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
    title: "500+ rental suppliers",
    description: "Enterprise, Hertz, Avis, Budget, National, Alamo and hundreds more.",
  },
];

const US_DESTINATIONS = [
  { label: "Las Vegas, NV",       url: `${BASE_URL}/united-states/las-vegas/?a_aid=${AFFILIATE_ID}` },
  { label: "Miami, FL",           url: `${BASE_URL}/united-states/miami/?a_aid=${AFFILIATE_ID}` },
  { label: "Los Angeles, CA",     url: `${BASE_URL}/united-states/los-angeles/?a_aid=${AFFILIATE_ID}` },
  { label: "New York, NY",        url: `${BASE_URL}/united-states/new-york/?a_aid=${AFFILIATE_ID}` },
  { label: "Orlando, FL",         url: `${BASE_URL}/united-states/orlando/?a_aid=${AFFILIATE_ID}` },
  { label: "San Francisco, CA",   url: `${BASE_URL}/united-states/san-francisco/?a_aid=${AFFILIATE_ID}` },
];

export default function CarRental() {
  useEffect(() => {
    document.title = "Car Rental — Compare & Book | LuxVibe";
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
          src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1920&q=80"
          alt="Car on open road"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 text-center w-full">
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
            Compare 500+ suppliers — Enterprise, Hertz, Avis, Budget and more.
            Best price guarantee, free cancellation on most bookings.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={US_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white text-gray-900 text-base font-semibold hover:bg-white/90 transition-colors shadow-lg"
              data-testid="button-search-cars-us"
            >
              <Car className="w-4 h-4" />
              Search US Car Rentals
            </a>
            <a
              href={GENERAL_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white/15 border border-white/30 text-white text-base font-semibold hover:bg-white/25 transition-colors"
              data-testid="button-search-cars-worldwide"
            >
              Worldwide Search
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="text-white/45 text-xs mt-5">
            Powered by DiscoverCars · 10,000+ pick-up locations worldwide
          </p>
        </div>
      </section>

      {/* ── Popular US Destinations ── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Popular destinations</p>
          <h2 className="text-3xl font-bold text-foreground font-serif">Top US rental locations</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {US_DESTINATIONS.map(({ label, url }, i) => (
            <motion.a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-center group"
              data-testid={`link-dest-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}
            >
              <MapPin className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="bg-muted/30 border-y border-border px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Why DiscoverCars</p>
            <h2 className="text-3xl font-bold text-foreground font-serif">Everything you need in one search</h2>
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
        </div>
      </section>

      {/* ── Car category image strip ── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Vehicle classes</p>
          <h2 className="text-3xl font-bold text-foreground font-serif">
            Economy to premium — every class covered
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80", label: "Compact & Economy", href: `${BASE_URL}/united-states/?car_group=economy&a_aid=${AFFILIATE_ID}` },
            { url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80", label: "SUV & Crossover",   href: `${BASE_URL}/united-states/?car_group=suv&a_aid=${AFFILIATE_ID}` },
            { url: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&q=80", label: "Luxury Sedan",      href: `${BASE_URL}/united-states/?car_group=luxury&a_aid=${AFFILIATE_ID}` },
          ].map(({ url, label, href }, i) => (
            <motion.a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] group block"
            >
              <img
                src={url}
                alt={label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <p className="text-white font-semibold text-base drop-shadow">{label}</p>
                <ExternalLink className="w-4 h-4 text-white/70" />
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground font-serif mb-3">Complete your trip</h2>
        <p className="text-muted-foreground mb-6 text-base">
          Combine your car rental with a luxury hotel stay and flights — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={US_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            data-testid="link-search-cars-cta"
          >
            <Car className="w-4 h-4" />
            Search Car Rentals
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-border text-sm font-semibold hover:bg-muted/50 transition-colors"
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
        <p className="text-xs text-muted-foreground/60 mt-4">
          Car rental bookings are completed on DiscoverCars.com. LuxVibe may earn a commission on qualifying bookings.
        </p>
      </section>
    </div>
  );
}

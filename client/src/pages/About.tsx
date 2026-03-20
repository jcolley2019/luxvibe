import { useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Search, GitCompare, CreditCard, MapPin, Sparkles, SlidersHorizontal, Building2, ChevronRight } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What is Luxvibe?",
    answer:
      "Luxvibe is a luxury hotel booking platform powered by liteAPI, offering access to 2 million+ hotels across 190+ countries with real-time pricing and availability.",
  },
  {
    question: "How does Luxvibe work?",
    answer:
      "Search for your destination, browse curated luxury hotels with live rates, and book instantly with secure checkout.",
  },
  {
    question: "Is Luxvibe free to use?",
    answer:
      "Yes, Luxvibe is free to use. You only pay for your hotel booking.",
  },
  {
    question: "What hotels are available on Luxvibe?",
    answer:
      "Luxvibe offers 2 million+ properties including top chains like Hilton, Marriott, and IHG across 190+ countries.",
  },
  {
    question: "How is Luxvibe different from Booking.com?",
    answer:
      "Luxvibe focuses on curated luxury travel with AI-powered recommendations, an interactive map experience, and a clean modern interface built for premium travelers.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function About() {
  useEffect(() => {
    document.title = "About Luxvibe – Luxury Hotel Booking Platform";
    if (!document.getElementById("faq-schema")) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "faq-schema";
      script.text = JSON.stringify(FAQ_SCHEMA);
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById("faq-schema")?.remove();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">About Luxvibe</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Luxury Stays.<br className="hidden sm:block" /> Unbeatable Rates.
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Luxvibe is a luxury hotel booking platform giving travellers access to 2 million+ hotels
            across 190+ countries — with real-time pricing, AI-powered discovery, and a premium
            experience built for those who demand the best.
          </p>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 max-w-4xl py-16 space-y-20">

        {/* 1 — What is Luxvibe */}
        <section>
          <h2 className="text-2xl font-bold mb-4">What is Luxvibe?</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
            <p>
              Luxvibe is an online luxury hotel booking platform that combines the breadth of a global
              hotel aggregator with the curation and design quality of a specialist travel advisor.
              Powered by <strong className="text-foreground">liteAPI</strong>, it provides live access
              to over <strong className="text-foreground">2 million properties</strong> in
              <strong className="text-foreground"> 190+ countries</strong> — from boutique guesthouses
              to iconic 5-star resorts.
            </p>
            <p>
              Rather than overwhelming you with every option on the market, Luxvibe layers AI-powered
              tools on top of that inventory: a natural-language vibe search, a curated concierge, and
              smart filters designed for the premium traveller. The result is a faster, more intuitive
              path from inspiration to booking confirmation.
            </p>
          </div>
        </section>

        {/* 2 — How it works */}
        <section>
          <h2 className="text-2xl font-bold mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Search,
                title: "Search",
                desc: "Enter your destination, dates, and number of guests. Use the AI Vibe Search to describe the experience you want — \"romantic cliffside hotel\" or \"business hotel with a rooftop pool\" — and let the AI match you.",
              },
              {
                step: "02",
                icon: GitCompare,
                title: "Compare",
                desc: "Browse results sorted by rating, price, or value. Add up to 4 hotels to the comparison tool to evaluate amenities, location, and rates side by side before making a decision.",
              },
              {
                step: "03",
                icon: CreditCard,
                title: "Book",
                desc: "Select your room, confirm your details, and book instantly with secure checkout. Receive your confirmation immediately. Eligible bookings can be managed or cancelled directly from My Bookings.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative border border-border rounded-2xl p-6 bg-card">
                <span className="text-xs font-bold text-muted-foreground/40 absolute top-5 right-5 tabular-nums">
                  {step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-bold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 — What makes it different */}
        <section>
          <h2 className="text-2xl font-bold mb-2">What Makes Luxvibe Different</h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Most hotel platforms show you the same inventory in the same way. Luxvibe is built differently.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Sparkles,
                title: "AI-Powered Landmarks & Imagery",
                desc: "Each destination is brought to life with AI-generated landmark visuals, giving you an immediate sense of place before you even look at a single hotel.",
              },
              {
                icon: MapPin,
                title: "Interactive Map Experience",
                desc: "Explore hotels pinned on a live map. See how properties relate to attractions, airports, and city centres — not just a list sorted by price.",
              },
              {
                icon: SlidersHorizontal,
                title: "Curated Luxury Filters",
                desc: "Filter by star rating, guest score, amenities like pool, spa, or free cancellation — refined for the premium traveller, not the budget market.",
              },
              {
                icon: Building2,
                title: "2M+ Hotels Worldwide",
                desc: "Every major chain — Hilton, Marriott, IHG, Four Seasons, Aman — alongside boutique independents across 190+ countries, all on one platform.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 border border-border rounded-2xl p-5 bg-card">
                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — Powered by liteAPI */}
        <section className="border border-border rounded-2xl p-8 bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Technology
              </p>
              <h2 className="text-2xl font-bold mb-3">Powered by liteAPI</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Luxvibe's hotel inventory, live rates, and availability are all powered by{" "}
                <strong className="text-foreground">liteAPI</strong> — a leading travel technology
                provider. This integration gives Luxvibe access to real-time hotel data from
                2 million+ properties worldwide, ensuring that every rate you see is accurate
                at the moment you search. liteAPI handles the complexity of global hotel connectivity
                so Luxvibe can focus on delivering the best possible search and booking experience.
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <div className="inline-flex flex-col items-center sm:items-end gap-1">
                <span className="text-3xl font-bold">2M+</span>
                <span className="text-xs text-muted-foreground">Hotels worldwide</span>
              </div>
              <div className="inline-flex flex-col items-center sm:items-end gap-1 ml-8">
                <span className="text-3xl font-bold">190+</span>
                <span className="text-xs text-muted-foreground">Countries</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5 — FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="border border-border rounded-2xl p-6 bg-card">
                <h3 className="font-semibold text-sm mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6 — CTA */}
        <section className="text-center border border-border rounded-2xl p-12 bg-card">
          <h2 className="text-2xl font-bold mb-3">Ready to find your perfect stay?</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
            Search 2 million+ luxury hotels with live rates and book in minutes.
          </p>
          <Link href="/">
            <Button size="lg" className="gap-2 px-8">
              Start searching
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>

      </main>
    </div>
  );
}

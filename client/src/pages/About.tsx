import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

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
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema";
    script.text = JSON.stringify(FAQ_SCHEMA);
    if (!document.getElementById("faq-schema")) {
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById("faq-schema")?.remove();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Luxvibe
          </Link>
        </div>

        {/* About */}
        <h1 className="text-3xl font-bold mb-4">About Luxvibe</h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Luxvibe is a luxury hotel booking platform powered by liteAPI, giving
          travellers access to 2 million+ hotels across 190+ countries. We
          combine real-time pricing and availability with AI-powered search,
          interactive maps, and curated luxury filters — so finding and booking
          your perfect stay is effortless.
        </p>

        {/* What we offer */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "2M+ Hotels Worldwide",
                desc: "Boutique guesthouses to 5-star resorts in 190+ countries.",
              },
              {
                title: "Real-Time Pricing",
                desc: "Live rates and availability powered by liteAPI.",
              },
              {
                title: "AI-Powered Search",
                desc: "Describe your ideal stay and let our AI find the match.",
              },
              {
                title: "Hotel Comparison",
                desc: "Compare up to 4 properties side by side before you book.",
              },
              {
                title: "AI Concierge — Luxe",
                desc: "An always-on travel assistant for recommendations and tips.",
              },
              {
                title: "No Booking Fees",
                desc: "You pay the hotel rate. Nothing added on top.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-border rounded-xl p-5 bg-card"
              >
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.question}
                className="border border-border rounded-xl p-6 bg-card"
              >
                <h3 className="font-semibold text-sm mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-xl font-bold mb-3">Contact</h2>
          <p className="text-sm text-muted-foreground">
            Booking enquiries:{" "}
            <a
              href="mailto:bookings@luxvibe.io"
              className="underline hover:text-foreground transition-colors"
            >
              bookings@luxvibe.io
            </a>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            General & press:{" "}
            <a
              href="mailto:hello@luxvibe.io"
              className="underline hover:text-foreground transition-colors"
            >
              hello@luxvibe.io
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}

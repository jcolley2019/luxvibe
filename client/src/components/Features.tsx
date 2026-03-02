import { ShieldCheck, Clock, CreditCard, Sparkles } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Secure Booking", description: "Enterprise-grade security for payments & data." },
  { icon: Clock, title: "24/7 Support", description: "Help available round the clock, anytime." },
  { icon: CreditCard, title: "Best Price Guarantee", description: "We'll match any lower price you find." },
  { icon: Sparkles, title: "Handpicked Hotels", description: "Every property vetted for quality & comfort." },
];

export function Features() {
  return (
    <section className="py-6 border-y border-border bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0 mt-0.5">
                <feature.icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

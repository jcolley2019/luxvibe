import { ShieldCheck, Clock, CreditCard, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Booking",
    description: "Your data and payments are protected with enterprise-grade security."
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our dedicated support team is available round the clock to assist you."
  },
  {
    icon: CreditCard,
    title: "Best Price Guarantee",
    description: "Find a lower price elsewhere? We'll match it instantly."
  },
  {
    icon: Sparkles,
    title: "Handpicked Hotels",
    description: "Every hotel is vetted for quality, comfort, and exceptional service."
  }
];

export function Features() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 font-heading">Why Choose Luxvibe?</h2>
          <p className="text-muted-foreground text-lg">
            We simplify your travel experience with features designed for peace of mind.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-background p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

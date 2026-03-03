import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Check, Gift, Star, Mail } from "lucide-react";

export default function Invite() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id
    ? `LV-${user.id.toString().slice(-6).toUpperCase()}`
    : "LV-XXXXXX";

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share it with friends to earn rewards." });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Book a luxury hotel with Luxvibe");
    const body = encodeURIComponent(
      `Hey! I've been using Luxvibe to find amazing luxury hotels at great rates. Use my referral link to get started:\n\n${referralLink}\n\nHappy travels!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const BENEFITS = [
    { icon: "🏨", title: "You earn rewards", desc: "Get credit towards your next booking when a friend makes their first reservation." },
    { icon: "🎁", title: "Friends get a welcome bonus", desc: "Your referred friend receives a discount on their first Luxvibe stay." },
    { icon: "♾️", title: "No limit on referrals", desc: "Invite as many friends as you like — every successful referral earns you more." },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Invite Friends &amp; Referrals</h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Share Luxvibe with friends. When they book their first stay, you both earn rewards.
          </p>
        </div>

        {/* Referral link card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your referral link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground truncate">
              {referralLink}
            </div>
            <Button
              onClick={copyLink}
              variant={copied ? "default" : "outline"}
              className="shrink-0 rounded-xl gap-2 transition-all"
              data-testid="button-copy-referral"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground">Your code:</span>
            <span className="text-xs font-bold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              {referralCode}
            </span>
          </div>
        </div>

        {/* Share via email */}
        <Button
          onClick={shareViaEmail}
          variant="outline"
          className="w-full rounded-xl gap-2 mb-8 h-11"
          data-testid="button-share-email"
        >
          <Mail className="w-4 h-4" />
          Share via Email
        </Button>

        {/* How it works */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">How it works</h2>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <span className="text-2xl shrink-0 leading-none mt-0.5">{b.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms note */}
        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          Referral rewards are subject to Luxvibe's{" "}
          <a href="#" className="text-primary hover:underline">Terms &amp; Conditions</a>.
          Rewards are credited after a referred friend completes their first booking.
        </p>
      </main>

      <Footer />
    </div>
  );
}

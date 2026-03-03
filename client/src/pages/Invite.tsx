import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Search } from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp, SiX } from "react-icons/si";

export default function Invite() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);
  const [referralSearch, setReferralSearch] = useState("");

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

  const sendEmail = () => {
    if (!emailInput.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setEmailInput("");
      toast({ title: "Invites sent!", description: "Your friends will receive an invitation email shortly." });
    }, 1000);
  };

  const shareText = encodeURIComponent("Book luxury hotels with Luxvibe! Use my referral link:");
  const shareUrl = encodeURIComponent(referralLink);

  const SOCIAL = [
    {
      label: "Facebook",
      icon: <SiFacebook className="w-4 h-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      label: "LinkedIn",
      icon: <SiLinkedin className="w-4 h-4" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    },
    {
      label: "WhatsApp",
      icon: <SiWhatsapp className="w-4 h-4" />,
      href: `https://wa.me/?text=${shareText}%20${shareUrl}`,
    },
    {
      label: "X / Twitter",
      icon: <SiX className="w-4 h-4" />,
      href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
    },
  ];

  const STATS = [
    { label: "Referrals", value: 0 },
    { label: "Vouchers Earned", value: 0 },
    { label: "Upcoming Vouchers", value: 0 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Invite Friends &amp; Referrals</h1>

        {/* Top two-column panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Email invite */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground mb-3">Email an invite</p>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Enter emails separated by commas"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 text-sm"
                data-testid="input-invite-email"
                onKeyDown={(e) => e.key === "Enter" && sendEmail()}
              />
              <Button
                onClick={sendEmail}
                disabled={sending || !emailInput.trim()}
                className="shrink-0 text-sm px-4"
                data-testid="button-send-invite"
              >
                {sending ? "Sending…" : "Send email"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add multiple email addresses separated by commas or space
            </p>
          </div>

          {/* Copy referral link */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              Copy referral link and share it with your follower
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground truncate font-mono">
                {referralLink}
              </div>
              <button
                onClick={copyLink}
                className="shrink-0 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                data-testid="button-copy-referral"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                  data-testid={`button-share-${s.label.toLowerCase().replace(/\s|\//g, "-")}`}
                >
                  {s.icon}
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-5 relative">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{s.label}</p>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <div className="absolute top-4 right-4 opacity-10">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 16a6 6 0 1 1 12 0" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Referrals history */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Referrals history</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search for a referral"
                value={referralSearch}
                onChange={(e) => setReferralSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-48"
                data-testid="input-referral-search"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 opacity-20">
              <svg width="60" height="48" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="12" width="54" height="33" rx="2" stroke="currentColor" strokeWidth="2.5"/>
                <rect x="11" y="21" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="26" y="21" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="41" y="21" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 18L30 3l27 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              You haven't referred anyone yet, what are you waiting for?
            </p>
            <p className="text-xs text-muted-foreground">
              Share your referral link with family and friends to earn discount vouchers.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

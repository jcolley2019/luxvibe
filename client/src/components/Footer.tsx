import { useState } from "react";
import { Bug } from "lucide-react";
import { Link } from "wouter";
import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";
import { ContactModal } from "@/components/ContactModal";

export function Footer() {
  const year = new Date().getFullYear();
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      <footer className="border-t border-border bg-background mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-5">
            {/* Logo + tagline */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <span
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  className="text-xl font-semibold tracking-[0.18em] text-foreground uppercase"
                >
                  Luxvibe
                </span>
              </Link>
              <span className="text-sm text-muted-foreground hidden md:inline">Premium hotel booking for the modern traveler.</span>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <a href="mailto:hello@luxvibe.io" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-about">
                About
              </a>
              <button
                onClick={() => setTermsOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer"
                data-testid="footer-link-terms-conditions"
              >
                Terms &amp; Conditions
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer"
                data-testid="footer-link-privacy-policy"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-consent"))}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer"
                data-testid="footer-link-cookie-preferences"
              >
                Cookie preferences
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer"
                data-testid="footer-link-contact-us"
              >
                Contact us
              </button>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                className="flex items-center gap-1.5 text-sm border border-border rounded-full px-4 py-1.5 hover:bg-muted transition-colors text-foreground"
                onClick={() => window.open("mailto:bugs@luxvibe.io?subject=Bug Report", "_blank")}
                data-testid="footer-button-report-bug"
              >
                <Bug className="w-3.5 h-3.5" />
                Report a Bug
              </button>
              <span className="text-sm text-muted-foreground">© Luxvibe, {year}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

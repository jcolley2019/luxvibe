import { Bug } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 max-w-6xl">
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
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: "Terms & Conditions", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Cookie preferences", href: "#" },
              { label: "Contact us", href: "#" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                data-testid={`footer-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {label}
              </a>
            ))}
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
  );
}

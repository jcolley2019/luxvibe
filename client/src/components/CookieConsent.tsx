import { useState, useEffect } from "react";

const EU_LOCALES = ["de", "fr", "it", "es", "nl", "pl", "pt", "sv", "da", "fi", "el", "cs", "hu", "ro", "sk", "hr", "bg", "lt", "lv", "et", "sl", "mt", "ga"];
const CONSENT_KEY = "lv_cookie_consent";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(CONSENT_KEY);
    if (!existing) {
      const lang = (navigator.language || "").toLowerCase().split("-")[0];
      if (!EU_LOCALES.includes(lang)) {
        localStorage.setItem(CONSENT_KEY, "accepted");
      } else {
        setIsVisible(true);
      }
    }

    const handleOpenConsent = () => setIsVisible(true);
    window.addEventListener("open-cookie-consent", handleOpenConsent);
    return () => window.removeEventListener("open-cookie-consent", handleOpenConsent);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setIsVisible(false);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-6 py-3 flex items-center justify-between gap-4 shadow-lg"
      style={{ display: isVisible ? "flex" : "none" }}
    >
      <p className="text-sm text-muted-foreground">
        We use cookies to improve your experience.{" "}
        <a href="/privacy" className="underline hover:text-foreground transition-colors">Learn more</a>
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleReject}
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border transition-colors"
          data-testid="button-cookie-reject"
        >
          Reject
        </button>
        <button
          onClick={handleAccept}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-medium hover:opacity-90 transition-opacity"
          data-testid="button-cookie-accept"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

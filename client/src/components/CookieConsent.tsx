import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }

    const handleOpenConsent = () => setIsVisible(true);
    window.addEventListener("open-cookie-consent", handleOpenConsent);
    return () => window.removeEventListener("open-cookie-consent", handleOpenConsent);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background border border-border rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-muted rounded-xl">
            <Cookie className="w-6 h-6 text-foreground" />
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">Cookie preferences</h3>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          To learn more about the types of cookies we use, read our{" "}
          <button className="underline hover:text-foreground transition-colors">
            cookie policy.
          </button>
        </p>

        <div className="flex gap-3 mb-4">
          <Button
            variant="outline"
            className="flex-1 rounded-xl py-6 text-base font-medium"
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            className="flex-1 rounded-xl py-6 text-base font-medium bg-[#0a001a] hover:bg-[#0a001a]/90 text-white"
            onClick={handleAccept}
          >
            Accept
          </Button>
        </div>

        <div className="text-center">
          <button className="text-sm font-medium underline hover:text-foreground transition-colors">
            Cookie preferences
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function ReferralBanner() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const code = localStorage.getItem("pendingReferralCode");
    const dismissed = localStorage.getItem("referralBannerDismissed");
    if (code && !dismissed && !isAuthenticated) {
      setVisible(true);
    }
  }, [isAuthenticated]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem("referralBannerDismissed", "1");
    setVisible(false);
  };

  const handleSignUp = () => {
    dismiss();
    openLoginModal();
  };

  return (
    <div
      className="w-full bg-primary text-primary-foreground px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4 text-sm md:text-base"
      data-testid="banner-referral"
    >
      <p className="flex-1 text-center font-medium">
        🎉 You've been invited to Luxvibe! Sign up to unlock exclusive luxury hotel deals.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSignUp}
          data-testid="button-referral-signup"
          className="h-7 md:h-auto text-xs px-3 md:px-5 md:py-2"
        >
          Sign Up
        </Button>
        <button
          onClick={dismiss}
          className="opacity-80 hover:opacity-100 transition-opacity"
          data-testid="button-referral-dismiss"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "@/components/Footer";
import { PreferencesProvider } from "@/context/preferences";
import { FavoritesProvider } from "@/context/favorites";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReferralBanner } from "@/components/ReferralBanner";
import Home from "@/pages/Home";
import HotelDetails from "@/pages/HotelDetails";
import Checkout from "@/pages/Checkout";
import Favorites from "@/pages/Favorites";
import BookingConfirmation from "@/pages/BookingConfirmation";
import MyBookings from "@/pages/MyBookings";
import ManageBooking from "@/pages/ManageBooking";
import Invite from "@/pages/Invite";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import BlogIndex from "@/pages/BlogIndex";
import BlogPost from "@/pages/BlogPost";
import NotFound from "@/pages/not-found";
import { AiAssistant } from "@/components/AiAssistant";
import { CookieConsent } from "@/components/CookieConsent";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("pendingReferralCode", ref);
      localStorage.removeItem("referralBannerDismissed");
      fetch("/api/referrals/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref }),
      }).catch(() => {});
    }
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hotel/:id" component={HotelDetails} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/booking-confirmation" component={BookingConfirmation} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/manage-booking" component={ManageBooking} />
      <Route path="/invite" component={Invite} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <FavoritesProvider>
          <AuthProvider>
            <TooltipProvider>
              <ScrollToTop />
              <ReferralCapture />
              <div className="flex flex-col min-h-screen">
                <ReferralBanner />
                <Router />
                <Footer />
              </div>
              <AiAssistant />
              <CookieConsent />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </FavoritesProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}

export default App;

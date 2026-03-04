import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "@/components/Footer";
import { PreferencesProvider } from "@/context/preferences";
import { FavoritesProvider } from "@/context/favorites";
import Home from "@/pages/Home";
import HotelDetails from "@/pages/HotelDetails";
import Checkout from "@/pages/Checkout";
import Favorites from "@/pages/Favorites";
import BookingConfirmation from "@/pages/BookingConfirmation";
import MyBookings from "@/pages/MyBookings";
import ManageBooking from "@/pages/ManageBooking";
import Invite from "@/pages/Invite";
import NotFound from "@/pages/not-found";
import { AiAssistant } from "@/components/AiAssistant";
import { CookieConsent } from "@/components/CookieConsent";
import { useAuth } from "@/hooks/use-auth";

function PostLoginRedirect() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = sessionStorage.getItem('lv_post_login_redirect');
      if (redirect) {
        sessionStorage.removeItem('lv_post_login_redirect');
        setLocation(redirect);
      }
    }
  }, [isAuthenticated]);

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <div className="flex flex-col min-h-screen">
              <Router />
              <Footer />
            </div>
            <PostLoginRedirect />
            <AiAssistant />
            <CookieConsent />
            <Toaster />
          </TooltipProvider>
        </FavoritesProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}

export default App;

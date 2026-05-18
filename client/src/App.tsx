import { Switch, Route, useLocation } from "wouter";
import { useEffect, Component, lazy, Suspense, type ReactNode } from "react";
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
import LogoAssets from "@/pages/LogoAssets";
import About from "@/pages/About";
import Flights from "@/pages/Flights";
import FlightConfirmation from "@/pages/FlightConfirmation";
import Stays from "@/pages/Stays";
import Currencies from "@/pages/Currencies";
import HotelFacilities from "@/pages/HotelFacilities";
import RoomViews from "@/pages/RoomViews";
import RoomAmenities from "@/pages/RoomAmenities";
import NotFound from "@/pages/not-found";
import { AiAssistant } from "@/components/AiAssistant";
import { RecentlyViewedDrawer } from "@/components/RecentlyViewedDrawer";
import { CookieConsent } from "@/components/CookieConsent";

const Events = lazy(() => import("@/pages/Events"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const EventTravel = lazy(() => import("@/pages/EventTravel"));
const CarRental = lazy(() => import("@/pages/CarRental"));

class ErrorBoundary extends Component<
  { children: ReactNode; silent?: boolean },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; silent?: boolean }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.silent) return null;
      const msg = this.state.error?.message || "Unknown error";
      const stack = this.state.error?.stack || "";
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            We hit an unexpected error. Please refresh the page or go back to continue.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Refresh page
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Go home
            </a>
          </div>
          <details className="mt-4 max-w-2xl w-full text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer">Error details</summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap break-all">{msg}{"\n\n"}{stack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      try {
        localStorage.setItem("lv_referral_code", ref);
      } catch {}
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
      <Route path="/manage-booking/:id" component={ManageBooking} />
      <Route path="/invite" component={Invite} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/logo-assets" component={LogoAssets} />
      <Route path="/about" component={About} />
      <Route path="/flights" component={Flights} />
      <Route path="/flight-confirmation" component={FlightConfirmation} />
      <Route path="/stays" component={Stays} />
      <Route path="/currencies" component={Currencies} />
      <Route path="/hotel-facilities" component={HotelFacilities} />
      <Route path="/room-views" component={RoomViews} />
      <Route path="/room-amenities" component={RoomAmenities} />
      <Route path="/car-rental">
        {() => (
          <Suspense fallback={null}>
            <CarRental />
          </Suspense>
        )}
      </Route>
      <Route path="/event-travel">
        {() => (
          <Suspense fallback={null}>
            <EventTravel />
          </Suspense>
        )}
      </Route>
      <Route path="/events">
        {() => (
          <Suspense fallback={null}>
            <Events />
          </Suspense>
        )}
      </Route>
      <Route path="/events/:id">
        {() => (
          <Suspense fallback={null}>
            <EventDetail />
          </Suspense>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <FavoritesProvider>
            <AuthProvider>
              <TooltipProvider>
                <ScrollToTop />
                <ReferralCapture />
                <div className="flex flex-col min-h-screen">
                  <ReferralBanner />
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                  <Footer />
                </div>
                <ErrorBoundary silent>
                  <RecentlyViewedDrawer />
                </ErrorBoundary>
                <ErrorBoundary silent>
                  <AiAssistant />
                </ErrorBoundary>
                <CookieConsent />
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </FavoritesProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

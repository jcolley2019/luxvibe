import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "@/components/Footer";
import { PreferencesProvider } from "@/context/preferences";
import Home from "@/pages/Home";
import HotelDetails from "@/pages/HotelDetails";
import Checkout from "@/pages/Checkout";
import BookingConfirmation from "@/pages/BookingConfirmation";
import MyBookings from "@/pages/MyBookings";
import ManageBooking from "@/pages/ManageBooking";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hotel/:id" component={HotelDetails} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/booking-confirmation" component={BookingConfirmation} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/manage-booking" component={ManageBooking} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Router />
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}

export default App;

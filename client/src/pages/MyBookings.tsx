import { useAuth } from "@/hooks/use-auth";
import { useBookings } from "@/hooks/use-bookings";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, BedDouble } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";

export default function MyBookings() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: bookings, isLoading: isBookingsLoading } = useBookings();

  if (isAuthLoading || isBookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">My Bookings</h1>
            <p className="text-muted-foreground">Manage your upcoming and past reservations.</p>
          </div>
          <Link href="/">
            <Button variant="outline">Book New Stay</Button>
          </Link>
        </div>

        {bookings && bookings.length > 0 ? (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div 
                key={booking.id}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                <div className="w-full md:w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Calendar className="w-8 h-8" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{booking.hotelName}</h3>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      {format(parseISO(booking.checkIn as string), "MMM d, yyyy")} - {format(parseISO(booking.checkOut as string), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center">
                      <BedDouble className="w-4 h-4 mr-1.5" />
                      {booking.roomType}
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-foreground mr-1">Total:</span> 
                      ${booking.totalPrice}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:flex-none">View Details</Button>
                  <Button variant="outline" className="flex-1 md:flex-none text-destructive hover:bg-destructive/10 border-destructive">Cancel</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-6">You haven't made any reservations yet.</p>
            <Link href="/">
              <Button size="lg">Explore Hotels</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

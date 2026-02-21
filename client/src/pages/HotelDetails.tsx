import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useHotel } from "@/hooks/use-hotels";
import { useCreateBooking } from "@/hooks/use-bookings";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, MapPin, Star, Wifi, Coffee, Car, Dumbbell, Utensils, Check } from "lucide-react";
import { useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { motion } from "framer-motion";

const amenityIcons: Record<string, any> = {
  "Free WiFi": Wifi,
  "Breakfast": Coffee,
  "Parking": Car,
  "Gym": Dumbbell,
  "Restaurant": Utensils,
};

export default function HotelDetails() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Get search params from URL to pre-fill booking
  const searchParams = new URLSearchParams(window.location.search);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests") || "2";

  const { data: hotel, isLoading, error } = useHotel(id!, {
    checkIn: checkIn || undefined,
    checkOut: checkOut || undefined,
    guests,
  });
  const createBooking = useCreateBooking();

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-destructive">Hotel not found</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const handleBookClick = (roomId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    setSelectedRoom(roomId);
    setIsConfirmOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedRoom || !checkIn || !checkOut) return;
    
    const room = hotel.rooms.find(r => r.id === selectedRoom);
    if (!room) return;

    const nights = differenceInDays(parseISO(checkOut), parseISO(checkIn));
    const totalPrice = room.price * nights;

    createBooking.mutate({
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomType: room.name,
      checkIn,
      checkOut,
      guests: parseInt(guests),
      totalPrice: totalPrice.toString(),
    }, {
      onSuccess: () => setIsConfirmOpen(false)
    });
  };

  const selectedRoomDetails = hotel.rooms.find(r => r.id === selectedRoom);
  const nights = (checkIn && checkOut) ? differenceInDays(parseISO(checkOut), parseISO(checkIn)) : 0;
  const totalPrice = selectedRoomDetails ? selectedRoomDetails.price * nights : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Hero Gallery */}
      <div className="grid grid-cols-4 gap-2 h-[400px] container mx-auto px-4 pt-8 mb-8">
        <div className="col-span-2 row-span-2 rounded-l-2xl overflow-hidden relative group">
          <img src={hotel.images[0]} alt="Main View" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="col-span-1 row-span-1 overflow-hidden relative group">
          <img src={hotel.images[1]} alt="View 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="col-span-1 row-span-1 rounded-tr-2xl overflow-hidden relative group">
          <img src={hotel.images[2]} alt="View 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="col-span-1 row-span-1 overflow-hidden relative group">
          <img src={hotel.images[3] || hotel.images[0]} alt="View 4" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="col-span-1 row-span-1 rounded-br-2xl overflow-hidden relative group">
          <img src={hotel.images[4] || hotel.images[1]} alt="View 5" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors cursor-pointer">
            <span className="text-white font-medium">+ See all photos</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-heading font-bold">{hotel.name}</h1>
              <div className="flex items-center gap-1 bg-accent/10 text-accent-foreground px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-bold">{hotel.rating || "New"}</span>
              </div>
            </div>
            <p className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              {hotel.address}
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-4">About this place</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {hotel.description}
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-6">What this place offers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hotel.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity] || Check;
                return (
                  <div key={amenity} className="flex items-center gap-3 text-muted-foreground">
                    <Icon className="w-5 h-5 text-primary" />
                    <span>{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold mb-6">Available Rooms</h2>
            <div className="space-y-4">
              {hotel.rooms.map((room) => (
                <motion.div 
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6 hover:border-primary/50 transition-colors bg-card"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{room.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{room.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Sleeps {room.capacity}</Badge>
                      <Badge variant="outline">Free Cancellation</Badge>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-center justify-between md:justify-center md:items-end gap-4 min-w-[150px]">
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">${room.price}</span>
                      <span className="text-muted-foreground text-sm"> / night</span>
                    </div>
                    <Button 
                      onClick={() => handleBookClick(room.id)}
                      disabled={!checkIn || !checkOut}
                      className="w-full md:w-auto"
                    >
                      {checkIn ? "Reserve" : "Select Dates"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Reservation Summary */}
        <div className="relative">
          <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Reservation Summary</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-input rounded-lg p-3">
                  <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">Check-in</label>
                  <div className="font-medium">{checkIn || "Select date"}</div>
                </div>
                <div className="border border-input rounded-lg p-3">
                  <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">Check-out</label>
                  <div className="font-medium">{checkOut || "Select date"}</div>
                </div>
              </div>
              <div className="border border-input rounded-lg p-3">
                <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">Guests</label>
                <div className="font-medium">{guests} Guests</div>
              </div>
              
              {!checkIn && (
                <div className="bg-primary/5 text-primary text-sm p-3 rounded-lg flex items-start gap-2">
                  <div className="mt-0.5"><Check className="w-4 h-4" /></div>
                  Start by searching with dates on the home page to see exact pricing.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Review your reservation details before confirming.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hotel</span>
                <span className="font-medium">{hotel.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">{selectedRoomDetails?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-medium">{checkIn} - {checkOut} ({nights} nights)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-medium">{guests}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
              <span>Total Price</span>
              <span className="text-primary">${totalPrice}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmBooking} disabled={createBooking.isPending}>
              {createBooking.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm & Pay"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

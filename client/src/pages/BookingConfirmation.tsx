import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Calendar, Hotel, User, CreditCard, ArrowRight, Home } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function BookingConfirmation() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const prebookId = searchParams.get("prebookId");
  const transactionId = searchParams.get("transactionId");
  
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const bookMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/hotels/book", data);
      return res.json();
    },
    onSuccess: (data) => {
      setBookingData(data);
      sessionStorage.removeItem("checkoutData");
    },
    onError: (err: any) => {
      setError(err.message || "Booking failed. Please try again or contact support.");
    },
  });

  useEffect(() => {
    const savedData = sessionStorage.getItem("checkoutData");
    if (!prebookId || !transactionId || !savedData) {
      setError("Missing booking information. Please start over.");
      return;
    }

    const parsedData = JSON.parse(savedData);
    setCheckoutData(parsedData);

    bookMutation.mutate({
      prebookId,
      transactionId,
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      email: parsedData.email,
    });
  }, []);

  const isLoading = bookMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-t-4 border-primary animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Hotel className="h-8 w-8 text-primary/40" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-heading">Finalizing your booking...</h2>
              <p className="text-muted-foreground">This may take up to 30 seconds. Please do not refresh the page.</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive/20 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Booking Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild variant="outline">
                  <Link href="/">Back to Search</Link>
                </Button>
                {checkoutData && (
                   <Button onClick={() => window.location.reload()}>
                     Retry Booking
                   </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : bookingData ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <div className="mx-auto bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-4xl font-bold font-heading">Booking Confirmed!</h1>
              <p className="text-muted-foreground text-lg">
                Your stay at <span className="font-semibold text-foreground">{bookingData.hotel?.name || checkoutData?.hotelName}</span> is all set.
              </p>
            </div>

            <Card className="border-none shadow-xl overflow-hidden">
              <div className="bg-primary px-6 py-4 flex justify-between items-center text-primary-foreground">
                <span className="text-sm font-medium opacity-90 uppercase tracking-wider">Booking ID: {bookingData.bookingId}</span>
                <div className="text-right">
                  <span className="text-xs opacity-75 block">Confirmation Code</span>
                  <span className="font-bold">{bookingData.hotelConfirmationCode}</span>
                </div>
              </div>
              
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Dates</p>
                        <p className="font-medium">
                          {format(parseISO(bookingData.checkin), "MMM dd")} - {format(parseISO(bookingData.checkout), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Guest</p>
                        <p className="font-medium">{checkoutData?.firstName} {checkoutData?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{checkoutData?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Hotel className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Room</p>
                        <p className="font-medium">{checkoutData?.roomName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Total Paid</p>
                        <p className="text-2xl font-bold">{bookingData.currency} {bookingData.price}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Cancellation Policy</p>
                      <p className="text-sm text-muted-foreground">
                        {checkoutData?.refundableTag === "RFN" ? "Free cancellation available" : "Non-refundable"}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${checkoutData?.refundableTag === "RFN" ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {checkoutData?.refundableTag === "RFN" ? "Flexible" : "Strict"}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row gap-4">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/my-bookings">
                    View My Bookings
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">
                    Book Another Hotel
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              A confirmation email has been sent to {checkoutData?.email}.
            </p>
          </div>
        ) : null}
      </main>
      
      <Footer />
    </div>
  );
}

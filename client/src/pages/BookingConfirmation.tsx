import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/Navbar";
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
    if (!prebookId || !savedData) {
      setError("Missing booking information. Please start over.");
      return;
    }

    const parsedData = JSON.parse(savedData);
    setCheckoutData(parsedData);

    const resolvedTransactionId = transactionId || parsedData.transactionId;
    if (!resolvedTransactionId) {
      setError("Payment transaction ID missing. Please try again.");
      return;
    }

    bookMutation.mutate({
      prebookId,
      transactionId: resolvedTransactionId,
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      email: parsedData.email,
      phone: parsedData.phone || "0000000000",
    });
  }, []);

  const isLoading = bookMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-12 max-w-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-t-4 border-primary animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Hotel className="h-6 w-6 sm:h-8 sm:h-8 text-primary/40" />
              </div>
            </div>
            <div className="space-y-2 px-4">
              <h2 className="text-xl sm:text-2xl font-bold font-heading">Finalizing your booking...</h2>
              <p className="text-sm text-muted-foreground">This may take up to 30 seconds. Please do not refresh the page.</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive/20 shadow-lg mx-auto">
            <CardHeader className="text-center p-6">
              <div className="mx-auto mb-4 bg-destructive/10 w-14 h-14 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold">Booking Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4 px-6 pb-6">
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/">Back to Search</Link>
                </Button>
                {checkoutData && (
                   <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
                     Retry Booking
                   </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : bookingData ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3 sm:space-y-4 px-4">
              <div className="mx-auto bg-green-100 dark:bg-green-900/30 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold font-heading">Booking Confirmed!</h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Your stay at <span className="font-semibold text-foreground">{bookingData.hotel?.name || checkoutData?.hotelName}</span> is all set.
              </p>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
              <div className="bg-primary px-5 py-4 sm:px-6 sm:py-4 flex justify-between items-center text-primary-foreground">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-sm font-medium opacity-90 uppercase tracking-wider">Booking ID</span>
                  <span className="font-bold text-sm sm:text-base">{bookingData.bookingId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] sm:text-xs opacity-75 block uppercase tracking-wider">Conf. Code</span>
                  <span className="font-bold text-sm sm:text-base">{bookingData.hotelConfirmationCode}</span>
                </div>
              </div>
              
              <CardContent className="p-5 sm:p-8 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Dates</p>
                        <p className="text-sm sm:text-base font-medium">
                          {format(parseISO(bookingData.checkin), "MMM dd")} - {format(parseISO(bookingData.checkout), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Guest</p>
                        <p className="text-sm sm:text-base font-medium">{checkoutData?.firstName} {checkoutData?.lastName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">{checkoutData?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Hotel className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Room</p>
                        <p className="text-sm sm:text-base font-medium leading-tight">{checkoutData?.roomName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CreditCard className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Total Paid</p>
                        <p className="text-xl sm:text-2xl font-bold">{bookingData.currency} {bookingData.price}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">Cancellation Policy</p>
                      <p className="text-xs text-muted-foreground">
                        {checkoutData?.refundableTag === "RFN" ? "Free cancellation available" : "Non-refundable"}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase shrink-0 ${checkoutData?.refundableTag === "RFN" ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {checkoutData?.refundableTag === "RFN" ? "Flexible" : "Strict"}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/30 p-5 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button asChild variant="outline" className="flex-1 w-full order-2 sm:order-1">
                  <Link href="/my-bookings">
                    View My Bookings
                  </Link>
                </Button>
                <Button asChild className="flex-1 w-full order-1 sm:order-2">
                  <Link href="/">
                    Book Another Hotel
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <p className="text-center text-xs sm:text-sm text-muted-foreground px-4 pb-4">
              A confirmation email has been sent to {checkoutData?.email}.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

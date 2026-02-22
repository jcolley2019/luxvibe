import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, Users, BedDouble, CreditCard, ShieldCheck, User } from "lucide-react";
import { format, parseISO } from "date-fns";

const guestSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type GuestFormValues = z.infer<typeof guestSchema>;

declare global {
  interface Window {
    LiteAPIPayment: any;
  }
}

export default function Checkout() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  
  const offerId = searchParams.get("offerId");
  const hotelId = searchParams.get("hotelId");
  const hotelName = searchParams.get("hotelName");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests");
  const roomName = searchParams.get("roomName");
  const price = searchParams.get("price");
  const currency = searchParams.get("currency") || "USD";

  const [prebookData, setPrebookData] = useState<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const sdkInitialized = useRef(false);

  useEffect(() => {
    if (!offerId) {
      setLocation("/");
    }
  }, [offerId, setLocation]);

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const prebookMutation = useMutation({
    mutationFn: async (values: GuestFormValues) => {
      const res = await apiRequest("POST", "/api/hotels/prebook", { offerId });
      return res.json();
    },
    onSuccess: (data, variables) => {
      setPrebookData(data);
      const checkoutData = {
        prebookId: data.prebookId,
        transactionId: data.transactionId,
        firstName: variables.firstName,
        lastName: variables.lastName,
        email: variables.email,
        hotelId,
        hotelName,
        checkIn,
        checkOut,
        guests,
        roomName,
        price,
        currency
      };
      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      loadPaymentSdk();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Pre-booking failed",
        description: error.message || "Please try again.",
      });
    },
  });

  const loadPaymentSdk = () => {
    const script = document.createElement("script");
    script.src = "https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (sdkLoaded && prebookData && !sdkInitialized.current) {
      sdkInitialized.current = true;

      // Clear any previous SDK content before mounting
      const container = document.getElementById('liteapi-payment');
      if (container) container.innerHTML = '';

      const liteAPIConfig = {
        publicKey: (prebookData.paymentEnv || 'sandbox') as 'sandbox' | 'live',
        secretKey: prebookData.secretKey,
        returnUrl: `${window.location.origin}/booking-confirmation?prebookId=${prebookData.prebookId}&transactionId=${prebookData.transactionId}`,
        targetElement: '#liteapi-payment',
        appearance: {
          theme: 'flat',
          variables: {
            colorPrimary: '#1d4ed8',
          }
        },
        options: {
          business: {
            name: 'Luxvibe'
          }
        }
      };

      try {
        const payment = new window.LiteAPIPayment(liteAPIConfig);
        payment.handlePayment();
      } catch (err) {
        console.error("SDK initialization error:", err);
      }
    }
  }, [sdkLoaded, prebookData]);

  const onSubmit = (values: GuestFormValues) => {
    prebookMutation.mutate(values);
  };

  if (!offerId) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 font-heading">Complete your booking</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Guest Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} data-testid="input-firstName" disabled={prebookMutation.isPending || !!prebookData} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} data-testid="input-lastName" disabled={prebookMutation.isPending || !!prebookData} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" type="email" {...field} data-testid="input-email" disabled={prebookMutation.isPending || !!prebookData} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {!prebookData && (
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={prebookMutation.isPending}
                        data-testid="button-submit-guest-details"
                      >
                        {prebookMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Securing your rate...
                          </>
                        ) : (
                          "Proceed to Payment"
                        )}
                      </Button>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

            {prebookData && (
              <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Secure Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Sandbox Environment</p>
                      <p className="text-sm text-blue-800/80 dark:text-blue-200/80">
                        Use card <code className="font-mono font-bold">4242 4242 4242 4242</code>, any 3-digit CVV, and any future expiry date for testing.
                      </p>
                    </div>
                  </div>
                  
                  <div id="liteapi-payment" className="min-h-[300px] flex items-center justify-center border rounded-lg p-4 bg-white dark:bg-black/20">
                    {!sdkLoaded && (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading payment gateway...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 border-none shadow-md overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground p-6">
                <CardTitle className="text-lg font-heading">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-1">{hotelName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{checkIn && format(parseISO(checkIn), "MMM dd")} - {checkOut && format(parseISO(checkOut), "MMM dd, yyyy")}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{guests} Guests</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BedDouble className="w-4 h-4 text-muted-foreground" />
                    <span>{roomName}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Price</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold">{currency} {price}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">All taxes included</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4">
                <p className="text-[11px] text-muted-foreground text-center w-full">
                  By completing this booking, you agree to the Terms of Service and Cancellation Policy.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

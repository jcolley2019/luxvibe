import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
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
  phone: z.string().min(6, "Phone number is required"),
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
      phone: "",
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
        clientReference: data.clientReference,
        firstName: variables.firstName,
        lastName: variables.lastName,
        email: variables.email,
        phone: variables.phone,
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
      sessionStorage.setItem("guestDetails", JSON.stringify({
        firstName: variables.firstName,
        lastName: variables.lastName,
        email: variables.email,
        phone: variables.phone,
      }));
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

      const liteAPIConfig = {
        publicKey: prebookData.paymentEnv === "live" ? "live" : "sandbox",
        secretKey: prebookData.secretKey,
        returnUrl: `${window.location.origin}/booking-confirmation?prebookId=${prebookData.prebookId}`,
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
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 font-heading">Complete your booking</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-muted/30 rounded-2xl">
              <CardHeader className="p-5 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Guest Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" className="rounded-xl h-11" {...field} data-testid="input-firstName" disabled={prebookMutation.isPending || !!prebookData} />
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
                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" className="rounded-xl h-11" {...field} data-testid="input-lastName" disabled={prebookMutation.isPending || !!prebookData} />
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
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" className="rounded-xl h-11" type="email" {...field} data-testid="input-email" disabled={prebookMutation.isPending || !!prebookData} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 555 000 0000" className="rounded-xl h-11" type="tel" {...field} data-testid="input-phone" disabled={prebookMutation.isPending || !!prebookData} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {!prebookData && (
                      <Button 
                        type="submit" 
                        className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20" 
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
              <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 rounded-2xl">
                <CardHeader className="p-5 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Secure Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6 pt-0 sm:pt-0">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Sandbox Environment</p>
                      <p className="text-xs sm:text-sm text-blue-800/80 dark:text-blue-200/80">
                        Use card <code className="font-mono font-bold">4242 4242 4242 4242</code>, any 3-digit CVV, and any future expiry date for testing.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="bg-green-500 rounded-full p-1.5">
        <ShieldCheck className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-green-900 dark:text-green-100">Ready to complete payment</p>
        <p className="text-xs text-green-700 dark:text-green-300">Enter your card details below and click Pay</p>
      </div>
    </div>
    <div className="text-right shrink-0">
      <p className="text-lg font-bold text-green-900 dark:text-green-100">{currency} {price}</p>
    </div>
  </div>
  <div id="liteapi-payment" className="min-h-[300px] flex items-center justify-center border-2 border-primary/20 rounded-xl p-2 sm:p-4 bg-white dark:bg-black/20 shadow-inner">
    {!sdkLoaded && (
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading payment gateway...</p>
      </div>
    )}
  </div>
</div>
                </CardContent>
              </Card>
            )}
          </div>
              

          <div className="space-y-6">
            <Card className="sticky top-24 border-none shadow-md overflow-hidden rounded-2xl">
              <CardHeader className="bg-primary text-primary-foreground p-5 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-heading">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-1 leading-tight">{hotelName}</h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{checkIn && format(parseISO(checkIn), "MMM dd")} - {checkOut && format(parseISO(checkOut), "MMM dd, yyyy")}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{guests} Guests</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <BedDouble className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="leading-tight">{roomName}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-border">
                  <div className="flex justify-between items-end">
                    <span className="text-xs sm:text-sm text-muted-foreground pb-1">Total Price</span>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-bold leading-none block mb-0.5">{currency} {price}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">All taxes included</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground text-center w-full leading-relaxed">
                  By completing this booking, you agree to the Terms of Service and Cancellation Policy.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

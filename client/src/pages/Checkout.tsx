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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calendar, Users, BedDouble, CreditCard, ShieldCheck, User, AlertTriangle, FileText, ChevronDown, ChevronUp } from "lucide-react";
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
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
    if (sdkLoaded && prebookData && termsAccepted && !sdkInitialized.current) {
      sdkInitialized.current = true;

      const returnUrl = `${window.location.origin}/booking-confirmation?prebookId=${encodeURIComponent(prebookData.prebookId)}&transactionId=${encodeURIComponent(prebookData.transactionId)}`;

      const liteAPIConfig = {
        publicKey: prebookData.paymentEnv || "sandbox",
        secretKey: prebookData.secretKey,
        returnUrl,
        targetElement: '#liteapi-payment',
        submitButton: { text: "Pay Now" },
        appearance: {
          theme: 'flat',
          variables: { colorPrimary: '#1d4ed8' }
        },
        options: { business: { name: 'Luxvibe' } }
      };

      try {
        const payment = new window.LiteAPIPayment(liteAPIConfig);
        payment.handlePayment().then(() => {
          // SDK finished rendering — wire up error visibility and submit feedback
          const errorDiv = document.getElementById("st-error-message");
          const targetEl = document.getElementById("liteapi-payment");
          const submitBtn = targetEl?.querySelector(".lp-submit-button") as HTMLButtonElement | null;

          // Style the error div so it's always visible when populated
          if (errorDiv) {
            errorDiv.style.cssText =
              "margin-top:12px;padding:12px 16px;border-radius:8px;font-size:14px;font-weight:500;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;display:none;";
            const obs = new MutationObserver(() => {
              const msg = errorDiv.textContent?.trim() || "";
              errorDiv.style.display = msg ? "block" : "none";
              if (msg) {
                toast({ title: "Payment error", description: msg, variant: "destructive" });
                setPaymentProcessing(false);
              }
            });
            obs.observe(errorDiv, { childList: true, characterData: true, subtree: true });
          }

          // Show a loading state when the pay button is clicked
          if (submitBtn && targetEl) {
            const form = submitBtn.closest("form");
            if (form) {
              form.addEventListener("submit", () => {
                setPaymentProcessing(true);
              });
            }
          }
        }).catch((err: any) => {
          console.error("SDK handlePayment error:", err);
          toast({ title: "Payment setup failed", description: "Unable to load the payment form. Please refresh and try again.", variant: "destructive" });
        });
      } catch (err) {
        console.error("SDK initialization error:", err);
        toast({ title: "Payment setup failed", description: "Unable to initialize payment. Please refresh and try again.", variant: "destructive" });
      }
    }
  }, [sdkLoaded, prebookData, termsAccepted]);

  const onSubmit = (values: GuestFormValues) => {
    prebookMutation.mutate(values);
  };

  const getCancellationSummary = () => {
    const rate = prebookData?.roomTypes?.[0]?.rates?.[0];
    const policy = rate?.cancellationPolicies;
    if (!policy) return null;

    const tag = policy.refundableTag || "";
    const infos: any[] = policy.cancelPolicyInfos || [];
    const remarks: string[] = policy.hotelRemarks || [];

    if (tag === "NRFN" || tag === "NON_REFUNDABLE") {
      return { type: "danger", label: "Non-Refundable", detail: "This booking cannot be cancelled or modified. No refund will be issued." };
    }
    if (infos.length > 0) {
      const first = infos[0];
      const deadline = first.cancelTime ? format(new Date(first.cancelTime), "MMM dd, yyyy 'at' HH:mm") : null;
      const charge = first.type === "PERCENT" ? `${first.amount}% of the total price`
        : first.type === "NIGHTS" ? `${first.amount} night(s)`
        : `${currency} ${first.amount}`;
      return {
        type: "warning",
        label: "Cancellation Policy",
        detail: deadline
          ? `Free cancellation until ${deadline}. After that, a charge of ${charge} applies.`
          : `Cancellation fee of ${charge} applies.`,
        remarks,
      };
    }
    if (tag === "RFN" || tag === "FREE_CANCELLATION" || tag === "FREECANCELLATION") {
      return { type: "success", label: "Free Cancellation", detail: "This booking can be cancelled free of charge." };
    }
    if (remarks.length > 0) {
      return { type: "warning", label: "Cancellation Policy", detail: remarks[0], remarks: remarks.slice(1) };
    }
    return null;
  };

  const cancellationInfo = prebookData ? getCancellationSummary() : null;
  const termsText: string = prebookData?.termsAndConditions || "";

  if (!offerId) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
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

            {prebookData && !termsAccepted && (
              <Card className="border-amber-200 dark:border-amber-800 shadow-lg animate-in fade-in slide-in-from-top-4 rounded-2xl">
                <CardHeader className="p-5 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Terms &amp; Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6 pt-0 sm:pt-0">
                  {cancellationInfo && (
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                      cancellationInfo.type === "danger"
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        : cancellationInfo.type === "success"
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                    }`}>
                      <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
                        cancellationInfo.type === "danger" ? "text-red-600"
                        : cancellationInfo.type === "success" ? "text-green-600"
                        : "text-amber-600"
                      }`} />
                      <div className="space-y-1">
                        <p className={`text-sm font-bold ${
                          cancellationInfo.type === "danger" ? "text-red-900 dark:text-red-100"
                          : cancellationInfo.type === "success" ? "text-green-900 dark:text-green-100"
                          : "text-amber-900 dark:text-amber-100"
                        }`}>{cancellationInfo.label}</p>
                        <p className={`text-xs sm:text-sm ${
                          cancellationInfo.type === "danger" ? "text-red-800/80 dark:text-red-200/80"
                          : cancellationInfo.type === "success" ? "text-green-800/80 dark:text-green-200/80"
                          : "text-amber-800/80 dark:text-amber-200/80"
                        }`}>{cancellationInfo.detail}</p>
                        {cancellationInfo.remarks?.map((r: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground">{r}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {termsText ? (
                    <div className="border rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTermsExpanded(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/80 transition-colors text-sm font-medium"
                        data-testid="button-toggle-terms"
                      >
                        <span>Read full terms &amp; conditions</span>
                        {termsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {termsExpanded && (
                        <div className="max-h-48 overflow-y-auto p-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-background border-t">
                          {termsText}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-4 leading-relaxed">
                      By proceeding with this booking you agree that: all guest information provided is accurate; the booking is subject to the hotel's cancellation and modification policies stated above; Luxvibe acts as an intermediary between you and the accommodation provider; and payment will be charged as shown in your booking summary.
                    </div>
                  )}

                  <div className="flex items-start gap-3 pt-2" data-testid="terms-acceptance">
                    <Checkbox
                      id="terms-accept"
                      checked={termsAccepted}
                      onCheckedChange={(v) => {
                        setTermsAccepted(!!v);
                        if (v) loadPaymentSdk();
                      }}
                      data-testid="checkbox-terms"
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="terms-accept"
                      className="text-sm leading-relaxed cursor-pointer select-none"
                    >
                      I have read and agree to the terms &amp; conditions and cancellation policy for this booking.
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {prebookData && termsAccepted && (
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
                  
                  <div className="relative">
                    <div id="liteapi-payment" className="min-h-[300px] flex items-center justify-center border rounded-xl p-2 sm:p-4 bg-white dark:bg-black/20">
                      {!sdkLoaded && (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Loading payment gateway...</p>
                        </div>
                      )}
                    </div>
                    {paymentProcessing && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/60 rounded-xl flex flex-col items-center justify-center gap-3 z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Processing your payment…</p>
                      </div>
                    )}
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
                  Prices shown are inclusive of all taxes and fees. By proceeding, you confirm your acceptance of the booking terms &amp; cancellation policy.
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

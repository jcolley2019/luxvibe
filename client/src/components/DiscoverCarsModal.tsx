import { Car, ExternalLink, MapPin, Calendar, X, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DiscoverCarsModalProps {
  open: boolean;
  onClose: () => void;
  href: string;
  destination?: string;
  pickupDate?: string;
  returnDate?: string;
}

export function DiscoverCarsModal({
  open,
  onClose,
  href,
  destination,
  pickupDate,
  returnDate,
}: DiscoverCarsModalProps) {
  function handleContinue() {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0" data-testid="modal-discovercars">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-8 pb-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            data-testid="button-modal-close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-medium mb-0.5">Leaving Luxvibe</p>
              <p className="font-semibold text-base leading-tight">Car rental via DiscoverCars</p>
            </div>
          </div>

          <p className="text-white/70 text-sm leading-relaxed">
            You'll be taken to <span className="text-white font-medium">DiscoverCars.com</span> to
            search and book your rental. Luxvibe stays open in this tab — just come back when you're done.
          </p>
        </div>

        {/* Trip details (if available) */}
        {(destination || pickupDate || returnDate) && (
          <div className="px-6 py-4 bg-muted/40 border-b border-border space-y-2">
            {destination && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">{destination}</span>
              </div>
            )}
            {(pickupDate || returnDate) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {pickupDate && returnDate
                    ? `${pickupDate} → ${returnDate}`
                    : pickupDate || returnDate}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Trust badges */}
        <div className="px-6 py-4 flex items-center gap-3 text-xs text-muted-foreground border-b border-border">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>500+ suppliers · Free cancellation on most bookings · Best price guarantee</span>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <Button
            onClick={handleContinue}
            className="w-full h-11 text-sm font-semibold"
            data-testid="button-continue-discovercars"
          >
            Continue to DiscoverCars
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-10 text-sm text-muted-foreground"
            data-testid="button-stay-luxvibe"
          >
            Stay on Luxvibe
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 pb-4 -mt-1">
          Luxvibe may earn a commission on qualifying bookings
        </p>
      </DialogContent>
    </Dialog>
  );
}

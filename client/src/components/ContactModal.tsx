import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Mail, Phone } from "lucide-react";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        hideClose
        className="max-w-lg w-full p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-12 flex flex-col items-center text-center">
          <div className="mb-6 relative">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce duration-[2000ms]">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-12 h-12 text-black fill-black/10"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/10 rounded-full blur-sm" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">We're at your disposal</h2>
          <p className="text-muted-foreground mb-10 max-w-[280px]">
            Our customer service is here to answer all your requests by mail or phone
          </p>

          <div className="w-full space-y-4 max-w-[280px]">
            <a 
              href="mailto:vip.support@nuitee.com" 
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                vip.support@nuitee.com
              </span>
            </a>

            <a 
              href="tel:+18663383099" 
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                +1 866 338 3099
              </span>
            </a>

            <a 
              href="tel:+443308184701" 
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                +44 330 818 4701
              </span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

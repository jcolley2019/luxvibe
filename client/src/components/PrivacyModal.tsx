import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        hideClose
        className="max-w-2xl w-full max-h-[80vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-semibold">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            data-testid="button-privacy-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="prose prose-sm max-w-none text-foreground pb-4">
            REPLACED_OK
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

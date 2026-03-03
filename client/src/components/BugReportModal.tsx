import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface BugReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function BugReportModal({ open, onClose }: BugReportModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Report sent",
      description: "Thank you for your feedback. We'll look into it.",
    });
    
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md w-full rounded-2xl p-8 border-none shadow-2xl">
        <h2 className="text-xl font-semibold mb-6">Report a Bug</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input 
              placeholder="Jane Bloggs" 
              className="rounded-xl border-border bg-background"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input 
              type="email"
              placeholder="jane@example.com" 
              className="rounded-xl border-border bg-background"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (Required)</label>
            <Textarea 
              placeholder="I clicked on 'X' and then hit 'Confirm'..." 
              className="rounded-xl border-border bg-background min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="pt-2 space-y-3">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full rounded-xl py-6 text-base font-semibold bg-[#5c44bb] hover:bg-[#4a36a3] text-white transition-colors"
            >
              {isSubmitting ? "Sending..." : "Send Report"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full rounded-xl py-6 text-base font-medium hover:bg-muted transition-colors"
            >
              Close
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

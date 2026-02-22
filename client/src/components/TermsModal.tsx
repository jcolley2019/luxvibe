import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-semibold">Terms and conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-5">
          <div className="prose prose-sm max-w-none text-foreground space-y-6 pb-4">

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">1. Definitions</h2>
              <p><strong>"Luxvibe"</strong> means Luxvibe, a premium hotel booking platform that operates as a white-label integration of LiteAPI travel technology.</p>
              <p className="mt-2"><strong>"Unavoidable and extraordinary circumstance"</strong> means a situation outside the control of the parties the consequences of which could not have been avoided despite all reasonable measures being taken. These include but are not limited to: war or threat thereof, riots, civil disturbances, terrorist activity, industrial disputes, natural and nuclear disasters, fire, epidemics, health risks and pandemics, and actual or potential severe weather conditions.</p>
              <p className="mt-2"><strong>"Terms"</strong> means these terms and conditions, our Cookies Policy and Privacy Policy.</p>
              <p className="mt-2"><strong>"We," "us,"</strong> and <strong>"our"</strong> means Luxvibe.</p>
              <p className="mt-2"><strong>"Website"</strong> means <strong>luxvibe.io</strong>. The content of the Website is directed solely at consumers who book the product through <strong>luxvibe.io</strong>.</p>
              <p className="mt-2"><strong>"You"</strong> and <strong>"Your"</strong> means all persons named on the booking confirmation and in the travel party (including any later substitutions or additions to the booking).</p>
              <p className="mt-2">Your booking is between You and Us. For the avoidance of doubt, Luxvibe has agreed to hold <strong>luxvibe.io</strong> harmless for any aspect of the booking, and any queries relating to your booking should be directed to Luxvibe as outlined in the following Terms and Conditions.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">2. Contacting Us</h2>
              <p>Please contact our Customer Service team for any queries. The "Contact us" section on the Website identifies the applicable email address.</p>
              <p className="mt-2">We can also be contacted by email at <a href="mailto:support@luxvibe.io" className="text-primary underline">support@luxvibe.io</a>.</p>
              <p className="mt-2">For emergencies we recommend using the contact information which appears in your booking confirmation.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">3. Agreement</h2>
              <p>You should read these Terms carefully before you book to see how they affect your specific travel arrangements.</p>
              <p className="mt-2">It is a condition of purchase that the Terms, as well as the Cookies policy and Privacy Policy, are accepted.</p>
              <p className="mt-2">If you do not agree to be bound by the Terms, you cannot proceed with your booking.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">4. Your Booking</h2>
              <p>When you make a booking on Luxvibe, you are entering into a contract with us for the provision of hotel accommodation. A binding contract is formed once we send you a booking confirmation by email.</p>
              <p className="mt-2">You must be at least 18 years of age to make a booking. By completing a booking, you confirm that you meet this age requirement and that the information you have provided is accurate and complete.</p>
              <p className="mt-2">It is your responsibility to ensure that all traveler details (names, dates, room types) are correct before confirming. Amendments after confirmation may incur additional charges subject to the hotel's policy.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">5. Pricing and Payment</h2>
              <p>All prices displayed on Luxvibe are inclusive of applicable taxes unless stated otherwise. Prices are subject to change until a booking is confirmed.</p>
              <p className="mt-2">Payment is processed securely at the time of booking. We accept all major credit and debit cards. Luxvibe does not store full card details on our servers.</p>
              <p className="mt-2">In the event of a pricing error, we reserve the right to cancel the booking and issue a full refund. We will notify you as soon as possible should this occur.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">6. Cancellations and Refunds</h2>
              <p>Cancellation and refund policies vary by hotel and rate type and are clearly displayed before you complete your booking. Please review these carefully.</p>
              <p className="mt-2">For non-refundable bookings, no refund will be issued upon cancellation. For bookings with free cancellation, refunds will be processed within 5–10 business days to the original payment method.</p>
              <p className="mt-2">In the case of an unavoidable and extraordinary circumstance that prevents you from completing your travel, we will work with the hotel to seek a fair resolution, though outcomes are subject to the hotel's own policies.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">7. Hotel Information and Accuracy</h2>
              <p>Luxvibe makes every effort to ensure that hotel descriptions, images, amenities, and availability information are accurate at the time of publication. However, this information is provided by hotels and third-party data partners and may be subject to change without notice.</p>
              <p className="mt-2">We recommend that you verify specific facilities or requirements directly with the hotel prior to your stay.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">8. Liability</h2>
              <p>Luxvibe acts as an intermediary between you and the hotel. We are not liable for the acts or omissions of the hotel, including any failure to provide the standard of accommodation, facilities, or services described.</p>
              <p className="mt-2">Our total liability to you in connection with any booking shall not exceed the total amount paid by you for that booking.</p>
              <p className="mt-2">Nothing in these Terms limits or excludes our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">9. Privacy and Data</h2>
              <p>Your use of this Website is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using Luxvibe, you consent to the collection and use of your information as described in our Privacy Policy.</p>
              <p className="mt-2">We will only share your personal data with third parties (including hotels and payment processors) as necessary to fulfill your booking.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">10. Governing Law</h2>
              <p>These Terms are governed by and construed in accordance with applicable law. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in the applicable territory.</p>
              <p className="mt-2">If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">11. Changes to These Terms</h2>
              <p>Luxvibe reserves the right to update these Terms at any time. Changes will be posted on this page with an updated effective date. Your continued use of the Website after changes are posted constitutes your acceptance of the revised Terms.</p>
              <p className="mt-2">We recommend reviewing these Terms periodically to stay informed of any updates.</p>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

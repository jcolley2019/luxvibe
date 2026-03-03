import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        hideClose
        className="max-w-2xl w-full max-h-[80vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-semibold">Terms &amp; Conditions</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              data-testid="button-terms-print"
              aria-label="Print terms"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              data-testid="button-terms-close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="prose prose-sm max-w-none text-foreground space-y-6 pb-4">

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">1. Definitions</h2>
              <p><strong>"Luxvibe"</strong> means Luxvibe, a premium hotel booking platform that operates as a white-label integration of LiteAPI travel technology, with its registered office address at 4 Waterloo Rd, Ballsbridge, Dublin, D04 A0X3, Ireland.</p>
              <p className="mt-2"><strong>"Unavoidable and extraordinary circumstance"</strong> means a situation outside the control of the parties the consequences of which could not have been avoided despite all reasonable measures being taken. These include but are not limited to: war or threat thereof, riots, civil disturbances, terrorist activity and its consequences, industrial disputes, natural and nuclear disasters, fire, epidemics, health risks and pandemics, and actual or potential severe weather conditions.</p>
              <p className="mt-2"><strong>"Terms"</strong> means these terms and conditions, our Cookies Policy and Privacy Policy.</p>
              <p className="mt-2"><strong>"We," "us,"</strong> and <strong>"our"</strong> means Luxvibe.</p>
              <p className="mt-2"><strong>"Website"</strong> means <strong>luxvibe.io</strong>. The content of the Website is directed solely at consumers who book the product through luxvibe.io.</p>
              <p className="mt-2"><strong>"You"</strong> and <strong>"Your"</strong> means all persons named on the booking confirmation and in the travel party (including any later substitutions or additions to the booking).</p>
              <p className="mt-2">Your booking is between You and Us. For the avoidance of doubt, Luxvibe has agreed to hold luxvibe.io harmless for any aspect of the booking, and any queries relating to your booking should be directed to Luxvibe as outlined in the following Terms and Conditions.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">2. Contacting Us</h2>
              <p>Please contact our Customer Service Centre for any queries. The "Contact us" section on the Website identifies the applicable telephone number.</p>
              <p className="mt-2">We can also be contacted by email at <a href="mailto:support@luxvibe.io" className="text-primary underline">support@luxvibe.io</a>.</p>
              <p className="mt-2">For emergencies we recommend using the "Emergency number" which appears in your booking confirmation.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">3. Agreement</h2>
              <p>You should read these Terms carefully before you book to see how they affect your specific travel arrangements.</p>
              <p className="mt-2">It is a condition of purchase that the Terms, as well as the Cookies policy and Privacy Policy, are accepted.</p>
              <p className="mt-2">If you do not agree to be bound by the Terms, you cannot proceed with your booking.</p>
              <p className="mt-2"><strong>Non-Package Travel:</strong> The services sold via luxvibe.io do not constitute a Package or Linked Travel Arrangement within the meaning of Directive (EU) 2015/2302 (The Package Travel and Linked Travel Arrangements Regulations 2018), and The Package Holidays and Package Tours Regulations 1992. Luxvibe is an independent intermediary in respect of bookings made and provided by independent third parties. Luxvibe bears no responsibility for the proper performance of the accommodation provider. In case of any problems, you should contact the accommodation provider directly.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">4. Booking Confirmation</h2>
              <p>To confirm the booking, you hereby confirm:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You are over the age of 18 and have sufficient authorization to make bookings and enter into legal agreements.</li>
                <li>You have the consent of all people named in the booking, as well as the authorization of the parents, or legal guardians of any minors.</li>
                <li>You confirm that all people traveling have accepted the Terms.</li>
                <li>You will ensure that specific needs of any person included in the booking will be identified.</li>
                <li>You are responsible for ensuring the accuracy of all details and information supplied in respect of your booking.</li>
                <li>You are responsible for any payments related to your booking, including charges arising from cancellation or amendments.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">5. Booking via luxvibe.io</h2>
              <p>Select the destination, dates, number of rooms and passengers along with the accommodation provider of your choice.</p>
              <p className="mt-2">During the booking process, we will request personal data such as the passenger's name, surname or credit card details. All data collected will be treated in accordance with our Privacy Policy and used to facilitate the booking of the accommodation. It is important that all details provided are correct.</p>
              <p className="mt-2">By clicking on the 'Book' button of the payment page you give your consent for the payment to be made. Once the booking is made, you will be provided with a written copy of the booking confirmation which, together with the Terms, forms part of the Agreement made between us.</p>
              <p className="mt-2">Please note, we will only deal with the lead booking name in all subsequent correspondence, which may include amendments and cancellations.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">6. Personal Data and Privacy</h2>
              <p>By accepting the Terms, you consent and authorise us to request from the contracted service providers and process any personal information relating to you or your group. Such information shall be treated in compliance with European legislation, including European equivalent legislation applicable in the UK, as well as any other such legislation that substitutes, complements, or elaborates thereon.</p>
              <p className="mt-2">This information will be treated in compliance with European Regulation (EU) 2016/679 of the European Parliament (GDPR), and will be used to process bookings and payments.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">7. Booking Price</h2>
              <p>Please note that the prices quoted do not include any charges your bank or credit card providers may charge you for the transaction.</p>
              <p className="mt-2">The price that you will pay when you confirm your booking includes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The total cost of the services specified on the booking confirmation voucher. Complementary services are not included and may be subject to a fee payable on the spot.</li>
                <li>Taxes/VAT. Please note the price of your booking may not include all local fees which will be payable locally. In some resorts (e.g. USA), current Resort Fees apply. Some countries also have a local 'occupation tax' or 'tourist tax', which must be paid directly to the accommodation provider.</li>
              </ul>
              <p className="mt-2">Many accommodation providers request to hold deposits on a credit or debit card for incidental charges incurred during the stay.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">8. Changes to Booking Price</h2>
              <p>In the event of an increase in your booking price of more than 10% for external circumstances beyond Luxvibe's control, you may cancel your booking within 14 days from the date of the amendment invoice and receive a full refund.</p>
              <p className="mt-2">The price quoted on the last amendment invoice issued is guaranteed unless you change your booking. Luxvibe will not be responsible if a change in price results from a human error, obvious errors, or wrong information given by suppliers or authorities.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">9. Minors</h2>
              <p>Child prices and other conditions relating to children are agreed with each accommodation provider and are not based on any specific criteria.</p>
              <p className="mt-2">For any special requirements such as cots, please ensure these are included when making your booking.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">10. Third Person</h2>
              <p>Many Accommodation Providers consider the booking of a third person as a reservation for an extra bed in a two-person room. This extra bed is provided at an extra cost which will be included in your final price, unless otherwise specified under the 'Important Information' on the booking page.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">11. Booking Payment</h2>
              <p>At the time of your booking, the full quoted amount will be deducted from your credit or debit card. Payment transactions through the Website are encrypted by a secure payment system.</p>
              <p className="mt-2">Our secure environment ensures credit card details cannot be intercepted and are not revealed to anyone other than to financial institutions required to process the payment instruction.</p>
              <p className="mt-2">Our payment system currently accepts the following credit and debit cards: Visa, Mastercard, American Express, Discover and Diners, China UnionPay, JCB, Cartes Bancaires, and Interac.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">12. Booking Modification</h2>
              <p><strong>12.1 If you change your booking.</strong> All modifications are subject to availability. In case the changes are possible, you may be asked to pay an administration fee. All urgent amendments (bookings within 72 hours prior to arrival) should be processed by email to <a href="mailto:support@luxvibe.io" className="text-primary underline">support@luxvibe.io</a>.</p>
              <p className="mt-2">All change requests must be in writing and come from you, the lead passenger. Some changes may be required to be treated as a cancellation of your current booking and a request to book a new reservation. When changing your booking, the price will be based on the price that applies on the day we confirm your change request.</p>
              <p className="mt-2"><strong>If we change your booking.</strong> We aim to give you what we promise but sometimes things can change. If we have to make a major change after confirming your booking, you may either accept the new arrangements offered by us (including a replacement of at least equivalent or higher standard, or a lower standard with a price difference refund), or cancel your booking and receive a full refund. You must let us know your choice within 3 days of receiving our communication.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">13. Booking Cancellation</h2>
              <p><strong>13.1 If you cancel your booking.</strong> All cancellations must be made through Luxvibe and not directly through the accommodation provider. To proceed with a cancellation, click on the link 'Booking Details' sent to you in your booking confirmation email. If you experience an error, please send an email to <a href="mailto:support@luxvibe.io" className="text-primary underline">support@luxvibe.io</a>.</p>
              <p className="mt-2">Cancellation charges are dependent upon the Accommodation Provider and can in some cases be 100% of the total price. Cancellation deadlines are based on GMT hour and date.</p>
              <p className="mt-2">If you decide to leave the accommodation before the reserved departure date, you should address any claim for a refund of unused nights to Luxvibe within 21 days following the effective date of departure, together with written confirmation from the accommodation provider of the time and date of your departure.</p>
              <p className="mt-2">In case of cancellations, Luxvibe will refund the total amount paid minus any applicable cancellation fee within 5–20 working days of the cancellation notification.</p>
              <p className="mt-2"><strong>13.2 If we cancel your booking.</strong> If we cancel your booking (except where due to an Unavoidable and extraordinary circumstance), you can either have a full refund or accept a replacement booking of at least equivalent standard or superior quality at the date of cancellation.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">14. Failure to Honour Booking (No-Show)</h2>
              <p>If you do not show up on the arrival date/at the time stated on your booking voucher and a cancellation had not been previously made, you and/or any member of your booking will not be entitled to a refund.</p>
              <p className="mt-2">Your absence without prior notice will be treated as a cancellation made with less than 24 hours' notice. Therefore, we will not refund any amount. Luxvibe will inform you of the cancellation fee generated to pay, which can be up to 100% of the amount of the booking.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">15. Insurance</h2>
              <p>You are strongly advised to take out adequate travel insurance prior to arriving at your destination. It is your responsibility to check you have adequate insurance coverage.</p>
              <p className="mt-2">No insurance is provided under your Booking or through the Website.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">16. Unavoidable and Extraordinary Circumstances</h2>
              <p>Luxvibe will not be liable for any changes or cancellations effected on your booking, or for any loss or damage suffered by you arising from any failure by the accommodation provider and/or Luxvibe to properly perform any of our respective obligations to you, if the non-performance is caused by events classified as Unavoidable and extraordinary circumstances beyond our reasonable control.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">17. Complaints</h2>
              <p>If things go wrong, you must tell the supplier in question (e.g. the hotel) and our representative straight away so they can solve the issue.</p>
              <p className="mt-2">Should they be unable to resolve the problem immediately, please contact Luxvibe's Customer Service Team at <a href="mailto:support@luxvibe.io" className="text-primary underline">support@luxvibe.io</a> and we will assist you. Complaint forms are available on request.</p>
              <p className="mt-2">For the avoidance of doubt, Luxvibe is not held responsible for any damage or related matter to do with actions, omissions, or negligence on the part of any accommodation provider.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">18. Personal Injury</h2>
              <p>Luxvibe will have no liability in case of: (i) your injury, illness or death was caused by an event or circumstances which the person who caused it could not have predicted or avoided even if they had taken all necessary and due care; (ii) your illness, injury or death was your own fault; or (iii) you or someone named in your booking is injured while taking part in an activity which is not part of the booking, or you incur unpredictable extra expenses arising from an Unavoidable and extraordinary circumstance.</p>
              <p className="mt-2">If you or any of your booking party suffer injury, illness, or death while at the accommodation provider, you agree to assist us with investigations by contacting our Customer Services Team, writing to <a href="mailto:support@luxvibe.io" className="text-primary underline">support@luxvibe.io</a> within 21 days of returning home, and cooperating fully with any investigation.</p>
              <p className="mt-2">The maximum amount of Luxvibe's liability to you for any reasonable and unforeseeable loss arising from a breach of contract or act of negligence is limited to the price paid for the booked accommodation.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">19. Conduct of Booking Party</h2>
              <p>Luxvibe reserves the right to refuse to accept you as a customer or continue dealing with you if we believe your behavior is disruptive, threatening, or abusive, or you damage property, or put any other traveler or staff at the accommodation provider at risk or in danger.</p>
              <p className="mt-2">Any accommodation we arrange must only be used by those people named on the final version of your booking confirmation. You are not allowed to share the accommodation or let anyone else stay there.</p>
              <p className="mt-2">You are responsible for the cost of any damage caused to your accommodation or its contents during your stay. These charges must be met by you and may have to be paid locally.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">20. Currency Conversion and Bank Fees</h2>
              <p>Currency rates are based on various publicly available sources and are not updated daily; as such, they cannot be guaranteed as completely accurate and should be used as guidelines only. Actual rates may vary.</p>
              <p className="mt-2">Bank fees may be applied by the card issuer as a charge to the cardholder's account. Luxvibe shall receive the total price on a timely basis, and you hereby assume any cost or expenses that may arise from the payment.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">21. Booking Promotions</h2>
              <p><strong>21.1 Discount Code.</strong> A discount code is the right to a discount for a specific period and under certain conditions established by Luxvibe. A promotional discount code may be used on this website upon request through the reservation process; the code must be entered at the time of booking.</p>
              <p className="mt-2">A promotional code may be used once only and for one online booking only. It cannot be applied retrospectively.</p>
              <p className="mt-2">Luxvibe may at any time cancel, withdraw, or refuse to redeem a discount code if Luxvibe reasonably believes that a code is being used unlawfully or illegally. You agree that you will have no claim against us in respect of any such cancellation or rejection.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">22. Warning: USA Travel Restrictions to Cuba</h2>
              <p>Citizens and residents of the United States travelling to Cuba are subject to the laws of the United States pertaining to the U.S. embargo of Cuba and require a license from the United States Government.</p>
              <p className="mt-2">No refunds will be made, or liability incurred with respect to any travel arrangements made by citizens or residents of the United States without required licenses.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">23. Fraud or Unlawful Activity</h2>
              <p>Payments must be authorized by the cardholder named in the booking. We withhold the right to cancel or block your booking payment without prior notice if:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The transaction has an elevated risk of fraud measured by examining a range of pre-set data.</li>
                <li>The cardholder did not authorise the payment and claims that the booking is fraudulent.</li>
                <li>We have good reason to suspect the cardholder or passenger is connected to other fraudulent activity.</li>
              </ul>
              <p className="mt-2">If Luxvibe has reasonable grounds to suspect that the booking is fraudulent, it may cancel it automatically and send a notification email to the email address provided at the time of booking.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">24. Passport, Visa and Immigration/Health Requirements</h2>
              <p>It is your responsibility to secure the appropriate passport, visa, and other immigration documents required for your booking, and/or to comply with any health formalities required.</p>
              <p className="mt-2">We do not accept any responsibility if you cannot travel because you have not complied with the passport, visa, and immigration requirements and/or you fail to comply with all applicable health requirements.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">25. Contacting You Outside of the Booking Process</h2>
              <p>If you book via our website or have opted in other circumstances for us to contact you via email, we will communicate with you using the email address you have provided. We will assume that your email address is correct and that you understand the risks associated with using this form of communication.</p>
              <p className="mt-2">In the event of disruptions or changes to your booking we may contact you via email, phone or SMS.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">26. Assignment of Rights</h2>
              <p>Luxvibe reserves its rights to assign in total or in part the obligations or rights of these Terms to any subsidiary, affiliate or holding company or any subsidiary of its holding company.</p>
              <p className="mt-2">You are not allowed to assign to any third party any obligation or right of these Terms, or any other agreement that completes them, unless with the prior express written authorisation of Luxvibe.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">27. Jurisdiction</h2>
              <p>The application and interpretation of these Terms and Conditions shall be governed by current and applicable Irish Legislation. In the event of any discrepancy which may arise from the interpretation or execution of these terms and conditions, the parties, with express waiver of any other court of jurisdiction which might apply, shall abide by the Jurisdiction of the Courts of Ireland.</p>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

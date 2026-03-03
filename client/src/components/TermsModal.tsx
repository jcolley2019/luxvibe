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
          <DialogTitle className="text-xl font-semibold">Terms &amp; Conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-5">
          <div className="prose prose-sm max-w-none text-foreground space-y-6 pb-4">

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">1. Definitions</h2>
              <p><strong>"Nuitée"</strong> means Nuitée Travel Limited, a company registered in Ireland, with its registered office address at 4 Waterloo Rd, Ballsbridge, Dublin, D04 A0X3, Ireland, Company Registration Number.</p>
              <p className="mt-2"><strong>"Unavoidable and extraordinary circumstance"</strong> means a situation outside the control of the parties the consequences of which could not have been avoided despite all reasonable measures being taken, these include but are not limited to: war or threat thereof, riots, civil disturbances, terrorist activity and its consequences, industrial disputes, natural and nuclear disasters, fire, epidemics, health risks and pandemics and actual or potential severe weather conditions.</p>
              <p className="mt-2"><strong>"Terms"</strong> means these terms and conditions, our Cookies Policy and Privacy Policy.</p>
              <p className="mt-2"><strong>"we", "us"</strong> and <strong>"our"</strong> means Nuitée.</p>
              <p className="mt-2"><strong>"Website"</strong> means luxvibe.io. The content of the Website is directed solely at consumers who book the product through luxvibe.io.</p>
              <p className="mt-2"><strong>"You"</strong> and <strong>"Your"</strong> means all persons named on the booking confirmation and in the travel party (including any later substitutions or additions to the booking).</p>
              <p className="mt-2">Your booking is between You and Us. For the avoidance of doubt Nuitée has agreed to hold luxvibe.io harmless for any aspect of the booking and any queries relating to your booking should be directed to Nuitée as outlined in the following Terms and Conditions.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">2. Contacting Us</h2>
              <p>Please contact our Customer Service Centre for any queries. The "Contact us" section on the Website identifies the applicable telephone number.</p>
              <p className="mt-2">We can also be contacted by email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a></p>
              <p className="mt-2">For emergencies we recommend using the "Emergency number" which appears in your booking confirmation.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">3. Agreement</h2>
              <p>You should read these Terms carefully before you book to see how they affect your specific travel arrangements.</p>
              <p className="mt-2">It is a condition of purchase that the Terms, as well as the Cookies policy and Privacy Policy are accepted.</p>
              <p className="mt-2">If you do not agree to be bound by the Terms, you cannot proceed with your booking.</p>
              <p className="mt-3 font-semibold">NON-PACKAGE TRAVEL</p>
              <p className="mt-1">The services, sold via luxvibe.io do not constitute a Package or Linked Travel Arrangement within the meaning of Directive (EU) 2015/2302 (The Package Travel and Linked Travel Arrangements Regulations 2018), and The Package Holidays and Package Tours Regulations 1992.</p>
              <p className="mt-2">Nuitée is an independent intermediary in respect of bookings made and provided by independent third parties.</p>
              <p className="mt-2">Nuitée bears no responsibility for the proper performance of the accommodation provider. In case of any problems, you should contact the accommodation provider directly.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">4. Booking Confirmation</h2>
              <p>To confirm the booking, you hereby confirm:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
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
              <p className="mt-2">During the booking process, we will request personal data such as the passenger's name, surname or credit card details.</p>
              <p className="mt-2">All the data collected will be treated in accordance with our Privacy Policy. This data will be used to facilitate the booking of the accommodation. It is important that all details provided are correct.</p>
              <p className="mt-2">In order to facilitate payment, you will be asked to provide information. This will be carried out through a payment gateway specifically established for this purpose. Payment transactions on the Website are encrypted by a secure payment system.</p>
              <p className="mt-2">By clicking on the 'Book' button of the payment page you give your consent for the payment to be made.</p>
              <p className="mt-2">You hereby acknowledge that you understand and provide your consent to effect payment will be generated because of booking via Nuitée.</p>
              <p className="mt-2">Such confirmation will be sent electronically to Nuitée who shall oversee storage and conservation to guarantee the booking.</p>
              <p className="mt-2">In the event of any mistakes made during the booking process input, you can identify and correct them before you accept the Book/Confirm. However, if you have already confirmed the same please send an email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a> or call our Customer Service Centre.</p>
              <p className="mt-2">Once the booking is made, you will be provided with a written copy of the booking confirmation which, together with the Terms, forms part of the Agreement made between us.</p>
              <p className="mt-2">Please note, we will only deal with the lead booking name in all subsequent correspondence, which may include amendments and cancellations.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">6. Personal Data and Privacy</h2>
              <p>By accepting the Terms, and pursuant to European legislation on data protection and particular legal aspects of electronic commerce, you consent and authorise us to request from the contracted service providers and process any personal information relating to you or your group. Such information shall be treated in compliance with European legislation, including European equivalent legislation applicable in the UK, as well as any other such legislation that substitutes, complements or elaborates the GDPR.</p>
              <p className="mt-2">By accepting the General Terms and Conditions, and pursuant to Directive 2000/31/EC on legal aspects of Information Society services and Electronic Commerce, you consent and authorise Nuitée to request from or provide to the contracted accommodation provider any personal information relating to your booking.</p>
              <p className="mt-2">This information will be treated in compliance with European Regulation (EU) 2016/679 of the European Parliament, as well as any other such legislation that substitutes, complements, or elaborates the GDPR, and will be used to process bookings and payments.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">7. Booking Price</h2>
              <p>Please note that the prices quoted do not include any charges your bank or credit card providers may charge you for the transaction.</p>
              <p className="mt-2">The price that you will pay when you confirm your booking includes:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>The total cost of the services specified on the booking confirmation voucher. Please note complementary services are not included and may be subject to a fee payable on the spot.</li>
                <li>Taxes/VAT. Please note the price of your booking may not include all local fees which will be payable locally.</li>
              </ul>
              <p className="mt-2">Current Resort Fees: In case that you are staying in a Resort (i.e. USA), some countries have a local tax, known as 'occupation tax' or 'tourist tax', which must be paid directly by you to the accommodation provider or at the airport.</p>
              <p className="mt-2">Many accommodation providers request to hold deposits on a credit or debit card for incidental charges incurred during the stay.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">8. Changes to Booking Price</h2>
              <p>In the event of an increase in your booking price of more than 10% for external circumstances beyond Nuitée's control you may cancel your booking within 14 days from the date of the amendment invoice. If you cancel you will receive a return of all monies paid.</p>
              <p className="mt-2">The price quoted on the last amendment invoice issued is guaranteed unless you change your booking.</p>
              <p className="mt-2">The information provided by Nuitée has been provided in good faith however we cannot guarantee it is completely free from inaccuracies such as typographical errors. We do not accept liability for any error or omission that may exist in the information supplied.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">9. Minors</h2>
              <p>Child prices and other conditions relating to children are agreed with each accommodation provider and are not based on any specific criteria.</p>
              <p className="mt-2">For any special requirements such as cots etc please ensure the same is included when making your booking.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">10. Third Person</h2>
              <p>Many Accommodation Providers consider the booking of a third person as a reservation for an extra bed in a two-person room. This extra bed is provided at an extra cost which will be included in your final price, unless otherwise specified under the 'Important Information' on the booking page.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">11. Booking Payment</h2>
              <p>At the time of your booking, the full quoted amount will be deducted from your credit or debit card. Payment transactions through the Website are encrypted by a secure payment system.</p>
              <p className="mt-2">Our secure environment ensures credit card details cannot be intercepted and are not revealed to anyone other than to financial institutions required to process the payment instruction.</p>
              <p className="mt-2">Our payment system currently accepts the following credit and debit cards: Visa, Mastercard, American Express, Discover and Diners, China UnionPay, JCB, Cartes Bancaires, Interac.</p>
              <p className="mt-2">If a signed authorisation from a cardholder is required, Nuitée will contact the cardholder. For any queries that you may have, please contact our Customer Services Centre.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">12. Booking Modification</h2>
              <p className="font-medium">12.1. If you change your booking.</p>
              <p className="mt-1">All modifications are subject to availability. In case the changes are possible, you may be asked to pay an administration fee.</p>
              <p className="mt-2">All urgent amendments (bookings within 72 hours prior to arrival) should be processed by an email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a>.</p>
              <p className="mt-2">All change requests must be in writing and come from you, the lead passenger. Some changes may be required to be treated by us as a cancellation of your current booking and a request to book a new reservation.</p>
              <p className="mt-2">When changing your booking, the price of your new booking will be based on the price that applies on the day we confirm your change request.</p>
              <p className="mt-3 font-medium">If we change your booking.</p>
              <p className="mt-1">We aim to give you what we promise but, sometimes things can change. We can make a change at any time but will let you know before your stay if there's time.</p>
              <p className="mt-2">If we tell you about major changes after we have confirmed your booking, you may either accept the new arrangements or cancel your booking with us and receive a full refund.</p>
              <p className="mt-2">You must let us know your choice within 3 days of receiving our communication. If you do not inform us within 3 days, we shall assume that you wish to cancel your booking and receive a full refund of all monies paid.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">13. Booking Cancellation</h2>
              <p className="font-medium">13.1. If you cancel your booking.</p>
              <p className="mt-1">All cancellations must be made through Nuitée and not directly through the accommodation provider.</p>
              <p className="mt-2">To proceed with a cancellation, you should click on the link 'Booking Details' sent to you in your booking confirmation email. If you experience an error, please send an email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a>.</p>
              <p className="mt-2">Cancellation charges are dependent upon the Accommodation Provider and can in some cases be 100% of the total price.</p>
              <p className="mt-2">In case of cancellations, Nuitée will refund the total amount paid, minus the cancellation fee, within 5–20 working days of the cancellation notification.</p>
              <p className="mt-3 font-medium">13.2. If we cancel your booking.</p>
              <p className="mt-1">If we cancel your booking (except where because of an Unavoidable and extraordinary circumstance), you can either have a full refund or accept a replacement booking of at least equivalent standard or superior quality.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">14. Failure to Honour Booking (No-Show)</h2>
              <p>If you do not show up on the arrival date and a cancellation had not been previously made, you will not be entitled to a refund.</p>
              <p className="mt-2">Your absence without prior notice will be treated as a cancellation made with less than 24 hours' notice. Therefore, we will not refund any amount.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">15. Insurance</h2>
              <p>You are strongly advised to take out adequate travel insurance prior to arriving at your destination. It is your responsibility to check you have adequate insurance coverage.</p>
              <p className="mt-2">No insurance is provided under your Booking or through the website.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">16. Unavoidable and Extraordinary Circumstances</h2>
              <p>Nuitée will not be liable for any changes or cancellations effected on your booking, or for any loss or damage suffered by you arising from any failure by the accommodation provider and/or Nuitée to properly perform any of our respective obligations to you, if the non-performance is caused by events classified as Unavoidable and extraordinary circumstance.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">17. Complaints</h2>
              <p>It is very rare for things to go wrong. If they do, you must tell the supplier in question (e.g. the hotel) and our representative straight away so they can solve the issue.</p>
              <p className="mt-2">Should they be unable to resolve the problem immediately, you should contact Nuitée's Customer Service Team and we will assist you.</p>
              <p className="mt-2">Complaints forms are available on request. To request a complaint form please email <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a>.</p>
              <p className="mt-2">For the avoidance of doubt, Nuitée is not held responsible for any damage or related matter to do with actions, omissions, or negligence on the part of any accommodation provider.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">18. Personal Injury</h2>
              <p>Nuitée will have no liability in case of (i) your injury, illness or death was caused by an event or circumstances which the person who caused it could not have predicted or avoided even if they had taken all necessary and due care; (ii) your illness, injury or death was your own fault; or (iii) if you or someone named in your booking is injured, falls ill or dies while taking part in an activity which is not part of the booking, or you need to incur unpredictable extra expenses for which we are not liable because the event is an Unavoidable and extraordinary circumstance.</p>
              <p className="mt-2">If you or any of your booking party suffer injury, illness, or death while at the accommodation provider you agree to assist us with our investigations. You should contact our Customer Services Team and write to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a> within 21 days of returning home.</p>
              <p className="mt-2">The maximum amount of Nuitée's liability to you is limited to the price paid of the booked accommodation.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">19. Conduct of Booking Party</h2>
              <p>Nuitée reserve the right to refuse to accept you as a customer or continue dealing with you if we believe your behaviour is disruptive, threatening, or abusive, or you damage property, or you upset, annoy, disturb, or put any other traveller or accommodation staff in any risk or danger.</p>
              <p className="mt-2">Any accommodation we arrange must only be used by those people named on the final version of your booking confirmation. You are not allowed to share the accommodation or let anyone else stay there.</p>
              <p className="mt-2">You are responsible for the cost of any damage caused to your accommodation or its content during your stay.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">20. Currency Conversion and Bank Fees</h2>
              <p>Currency rates are based on various publicly available sources and are not updated daily; as such, they cannot be guaranteed as completely accurate and should be used as guidelines only. Actual rates may vary.</p>
              <p className="mt-2">These fees may be applied by the card issuer as a charge to the cardholder's account. Nuitée shall receive the total price on a timely basis, and you hereby assume any cost or expenses that may arise from the payment.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">21. Booking Promotions</h2>
              <p className="font-medium">21.1. Discount Code</p>
              <p className="mt-1">A promotional code may be used once only and for one online booking only. It cannot be applied retrospectively and must be applied at the time of booking.</p>
              <p className="mt-2 font-medium">Can Nuitée Cancel or Refuse to Redeem a Discount Code?</p>
              <p className="mt-1">Nuitée may at any time cancel, withdraw, or refuse to redeem a discount code if Nuitée reasonably believes that a code is being used unlawfully or illegally. You agree that you will have no claim against us in respect of any such cancellation or rejection.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">22. Warning: USA Travel Restrictions to Cuba</h2>
              <p>Citizens and residents of the United States travelling to Cuba are subject to the laws of the United States pertaining to the U.S. embargo of Cuba and require a license from the United States Government.</p>
              <p className="mt-2">No refunds will be made, or liability incurred with respect to any travel arrangements made by citizens or residents of the United States without required licenses.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">23. Fraud or Unlawful Activity</h2>
              <p>Payments must be authorized by the cardholder named in the booking. We withhold the right to cancel or block your booking payment without prior notice if:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>the transaction has an elevated risk of fraud measured by examining a range of pre-set data;</li>
                <li>the cardholder did not authorise the payment and claims that the booking is fraudulent;</li>
                <li>or we have good reason to suspect the cardholder or passenger is connected to other fraudulent activity.</li>
              </ul>
              <p className="mt-2">If Nuitée has reasonable grounds to suspect that the booking is fraudulent, it may cancel it automatically and send a notification email to the email address provided by the customer at the time of booking.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">24. Passport, Visa and Immigration/Health Requirements</h2>
              <p>It is your responsibility to secure the appropriate passport, visa and other immigration documents required for your booking, and/or to comply with any health formalities required. We do not accept any responsibility if you cannot travel because you have not complied with the passport, visa, and immigration requirements and/or you fail to comply with all applicable health requirements.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">25. Contacting You Outside of the Booking Process</h2>
              <p>If you book via our website or have opted in other circumstances for us to contact you via email, we will communicate with you using the email address you have provided. We will assume that your email address is correct and that you understand the risks associated with using this form of communication. In the event of disruptions or changes to your booking we may contact you via email, phone or SMS.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">26. Assignment of Rights</h2>
              <p>Nuitée reserves its rights to assign in total or in part the obligation or rights of these Terms to any subsidiary, affiliate or holding company or any subsidiary of its holding company.</p>
              <p className="mt-2">You are not allowed to assign to any third party any obligation or right of these Terms, or any other agreement that completes them, unless with the prior express written authorisation of Nuitée.</p>
            </section>

            <section>
              <h2 className="text-base font-bold uppercase tracking-wide mb-2">27. Jurisdiction</h2>
              <p>The application and interpretation of these Terms and Conditions shall be governed by current and applicable Irish Legislation. In the event of any discrepancy which may arise from the interpretation or execution of these terms and conditions, the parties, with express waiver of any other court of jurisdiction which might apply, if any, shall abide by the Jurisdiction of the Courts of Ireland.</p>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

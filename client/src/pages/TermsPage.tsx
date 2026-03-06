import { Navbar } from "@/components/Navbar";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Luxvibe
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-terms-print"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 2024</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">1. DEFINITIONS</h2>
            <p><strong>"Nuitée"</strong> means Nuitée Travel Limited, a company registered in Ireland, with its registered office address at 4 Waterloo Rd, Ballsbridge, Dublin, D04 A0X3, Ireland, Company Registration Number.</p>
            <p className="mt-2"><strong>"Unavoidable and extraordinary circumstance"</strong> means a situation outside the control of the parties the consequences of which could not have been avoided despite all reasonable measures being taken, these include but are not limited to: war or threat thereof, riots, civil disturbances, terrorist activity and its consequences, industrial disputes, natural and nuclear disasters, fire, epidemics, health risks and pandemics and actual or potential severe weather conditions.</p>
            <p className="mt-2"><strong>"Terms"</strong> means these terms and conditions, our Cookies Policy and Privacy Policy.</p>
            <p className="mt-2"><strong>"we", "us" and "our"</strong> means Nuitée.</p>
            <p className="mt-2"><strong>"Website"</strong> means <strong>luxvibe.io</strong>. The content of the Website is directed solely at consumers who book the product through <strong>luxvibe.io</strong>.</p>
            <p className="mt-2"><strong>"You" and "Your"</strong> means all persons named on the booking confirmation and in the travel party (including any later substitutions or additions to the booking).</p>
            <p className="mt-2">Your booking is between You and Us. For the avoidance of doubt Nuitée has agreed to hold <strong>luxvibe.io</strong> harmless for any aspect of the booking and any queries relating to your booking should be directed to Nuitée as outlined in the following Terms and Conditions.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">2. CONTACTING US</h2>
            <p>Please contact our Customer Service Centre for any queries. The "Contact us" section on the Website identifies the applicable telephone number.</p>
            <p className="mt-2">We can also be contacted by email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a></p>
            <p className="mt-2">For emergencies we recommend using the "Emergency number" which appears in your booking confirmation.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">3. AGREEMENT</h2>
            <p>You should read these Terms carefully before you book to see how they affect your specific travel arrangements.</p>
            <p className="mt-2">It is a condition of purchase that the Terms, as well as the Cookies policy and Privacy Policy are accepted.</p>
            <p className="mt-2">If you do not agree to be bound by the Terms, you cannot proceed with your booking.</p>
            <p className="mt-3 font-semibold">NON-PACKAGE TRAVEL</p>
            <p className="mt-2">The services, sold via <strong>luxvibe.io</strong> do not constitute a Package or Linked Travel Arrangement within the meaning of Directive (EU) 2015/2302 (The Package Travel and Linked Travel Arrangements Regulations 2018), and The Package Holidays and Package Tours Regulations 1992.</p>
            <p className="mt-2">Nuitée is an independent intermediary in respect of bookings made and provided by independent third parties.</p>
            <p className="mt-2">Nuitée bears no responsibility for the proper performance of the accommodation provider. In case of any problems, you should contact the accommodation provider directly.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">4. BOOKING CONFIRMATION</h2>
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
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">5. BOOKING VIA <strong>luxvibe.io</strong></h2>
            <p>Select the destination, dates, number of rooms and passengers along with the accommodation provider of your choice.</p>
            <p className="mt-2">During the booking process, we will request personal data such as the passenger's name, surname or credit card details.</p>
            <p className="mt-2">All the data collected will be treated in accordance with our Privacy Policy. This data will be used to facilitate the booking of the accommodation. It is important that all details provided are correct.</p>
            <p className="mt-2">In order to facilitate payment, you will be asked to provide information. This will be carried out through a payment gateway specifically established for this purpose. Payment transactions on the Website are encrypted by a secure payment system. For further information, please see the "Booking Payment" section.</p>
            <p className="mt-2">By clicking on the 'Book' button of the payment page you give your consent for the payment to be made.</p>
            <p className="mt-2">You hereby acknowledge that you understand and provide your consent to effect payment will be generated because of booking via Nuitée.</p>
            <p className="mt-2">Such confirmation will be sent electronically to Nuitée who shall oversee storage and conservation to guarantee the booking.</p>
            <p className="mt-2">In the event of any mistakes made during the booking process input, you can identify and correct them before you accept the Book/Confirm. However, if you have already confirmed the same please send an email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a> or call our Customer Service Centre.</p>
            <p className="mt-2">Once the booking is made, you will be provided with a written copy of the booking confirmation which, together with the Terms, forms part of the Agreement made between us, and you and which confirms to you all the details regarding your booking.</p>
            <p className="mt-2">Please note, we will only deal with the lead booking name in all subsequent correspondence, which may include amendments and cancellations.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">6. PERSONAL DATA AND PRIVACY</h2>
            <p>By accepting the Terms, and pursuant to European legislation on data protection and particular legal aspects of electronic commerce, you consent and authorise us to request from the contracted service providers and process any personal information relating to you or your group. Such information shall be treated in compliance with European legislation, including European equivalent legislation applicable in the UK, as well as any other such legislation that substitutes, complements, or elaborates the privacy and data protection legislation, and will be used to process bookings and payments made at your own request.</p>
            <p className="mt-2">By accepting the General Terms and Conditions, and pursuant to Directive 2000/31/EC on legal aspects of Information Society services and Electronic Commerce, you consent and authorize Nuitée to request from or provide to the contracted accommodation provider any personal information relating to your booking.</p>
            <p className="mt-2">This information will be treated in compliance with European Regulation (EU) 2016/679 of the European Parliament, as well as any other such legislation that substitutes, complements, or elaborates the GDPR, and will be used to process bookings and payments.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">7. BOOKING PRICE</h2>
            <p>Please note that the prices quoted do not include any charges your bank or credit card providers may charge you for the transaction.</p>
            <p className="mt-2">The price that you will pay when you confirm your booking includes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>The total cost of the services specified on the booking confirmation voucher.</li>
              <li>Taxes/VAT. Please note the price of your booking may not include all local fees which will be payable locally. Some countries have a local tax, known as 'tourist tax', which must be paid directly by you to the accommodation provider.</li>
            </ul>
            <p className="mt-2">Many accommodation providers request to hold deposits on a credit or debit card for incidental charges incurred during the stay.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">8. CHANGES TO BOOKING PRICE</h2>
            <p>In the event of an increase in your booking price of more than 10% for external circumstances beyond Nuitée's control you may cancel your booking within 14 days from the date of the amendment invoice. If you cancel you will receive a return of all monies paid.</p>
            <p className="mt-2">The price quoted on the last amendment invoice issued is guaranteed unless you change your booking.</p>
            <p className="mt-2">We will not be responsible if a change in price results from a human error, obvious errors, or wrong information given by those suppliers or authorities.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">9. MINORS</h2>
            <p>Child prices and other conditions relating to children are agreed with each accommodation provider and are not based on any specific criteria.</p>
            <p className="mt-2">For any special requirements such as cots etc. please ensure the same is included when making your booking.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">10. THIRD PERSON</h2>
            <p>Many Accommodation Providers consider the booking of a third person as a reservation for an extra bed in a two-person room. This extra bed is provided at an extra cost which will be included in your final price, unless otherwise specified.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">11. BOOKING PAYMENT</h2>
            <p>At the time of your booking, the full quoted amount will be deducted from your credit or debit card. Payment transactions through the Website are encrypted by a secure payment system.</p>
            <p className="mt-2">Our secure environment ensures credit card details cannot be intercepted and are not revealed to anyone other than to financial institutions required to process the payment instruction.</p>
            <p className="mt-2">Our payment system currently accepts the following credit and debit cards: Visa, Mastercard, American Express, Discover and Diners, China UnionPay, JCB, Cartes Bancaires, Interac.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">12. BOOKING MODIFICATION</h2>
            <p><strong>12.1. If you change your booking.</strong></p>
            <p className="mt-2">All modifications are subject to availability. In case the changes are possible, you may be asked to pay an administration fee.</p>
            <p className="mt-2">All urgent amendments (bookings within 72 hours prior to arrival) should be processed by email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a></p>
            <p className="mt-2">All change requests must be in writing and come from you, the lead passenger.</p>
            <p className="mt-3"><strong>12.2. If we change your booking.</strong></p>
            <p className="mt-2">We aim to give you what we promise but sometimes things can change. We can make a change at any time but will let you know before your stay if there's time.</p>
            <p className="mt-2">Occasionally, we may have to make a major change to your accommodation. If we tell you about any of these major changes after we have confirmed your booking, you may either accept the new arrangements or cancel your booking with us and receive a full refund.</p>
            <p className="mt-2">You must let us know your choice within 3 days of receiving our communication.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">13. BOOKING CANCELLATION</h2>
            <p><strong>13.1. If you cancel your booking.</strong></p>
            <p className="mt-2">All cancellations must be made through Nuitée and not directly through the accommodation provider.</p>
            <p className="mt-2">To proceed with a cancellation, you should click on the link 'Booking Details' sent to you in your booking confirmation email. If you experience an error, please send an email to <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a></p>
            <p className="mt-2">Cancellation charges are dependent upon the Accommodation Provider and can in some cases be 100% of the total price.</p>
            <p className="mt-2">In case of cancellations, Nuitée will refund the total amount paid, minus the cancellation fee, within 5-20 working days of the cancellation notification.</p>
            <p className="mt-3"><strong>13.2. If we cancel your booking.</strong></p>
            <p className="mt-2">If we cancel your booking (except where because of an Unavoidable and extraordinary circumstance), you can either have a full refund or accept a replacement booking from us of at least equivalent standard or superior quality.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">14. FAILURE TO HONOUR BOOKING (NO-SHOW)</h2>
            <p>If you do not show up on the arrival date without prior cancellation, you will not be entitled to a refund. Nuitée will inform you of the cancellation fee generated to pay, which can be up to 100% of the amount of the booking.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">15. INSURANCE</h2>
            <p>You are strongly advised to take out adequate travel insurance prior to arriving at your destination. No insurance is provided under your Booking or through the website.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">16. UNAVOIDABLE AND EXTRAORDINARY CIRCUMSTANCES</h2>
            <p>Nuitée will not be liable for any changes or cancellations effected on your booking, or for any loss or damage suffered by you arising from any failure caused by events classified as Unavoidable and extraordinary circumstances.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">17. COMPLAINTS</h2>
            <p>If things go wrong, you must tell the supplier (e.g. the hotel) and our representative straight away so they can solve the issue. Should they be unable to resolve the problem, contact Nuitée's Customer Service Team.</p>
            <p className="mt-2">To request a complaint form please email <a href="mailto:vip.support@nuitee.com" className="text-primary underline">vip.support@nuitee.com</a></p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">18. PERSONAL INJURY</h2>
            <p>Nuitée will have no liability in case of injury, illness or death caused by an event or circumstances which could not have been predicted or avoided, or caused by the guest's own fault.</p>
            <p className="mt-2">The maximum amount of Nuitée's liability for any reasonable and unforeseeable loss is limited to the price paid of the booked accommodation.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">19. CONDUCT OF BOOKING PARTY</h2>
            <p>Nuitée reserves the right to refuse to accept you as a customer if we believe your behavior is disruptive, threatening, or abusive, or you damage property.</p>
            <p className="mt-2">You are responsible for the cost of any damage caused to your accommodation or its content during your stay.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">20. CURRENCY CONVERSION AND BANK FEES</h2>
            <p>Currency rates are based on various publicly available sources and are not updated daily; as such, they cannot be guaranteed as completely accurate and should be used as guidelines only. Bank fees may be applied by the card issuer as a charge to the cardholder's account.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">21. BOOKING PROMOTIONS</h2>
            <p>A discount code may only be used via web pages and for one online booking only. It cannot be applied retrospectively and must be applied at the time of booking. Nuitée may at any time cancel, withdraw, or refuse to redeem a discount code if reasonably believed to be used unlawfully.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">22. WARNING: USA TRAVEL RESTRICTIONS TO CUBA</h2>
            <p>Citizens and residents of the United States travelling to Cuba are subject to the laws of the United States pertaining to the U.S. embargo of Cuba and require a license from the United States Government. No refunds will be made with respect to any travel arrangements made without required licenses.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">23. FRAUD OR UNLAWFUL ACTIVITY</h2>
            <p>Payments must be authorized by the cardholder named in the booking. We withhold the right to cancel or block your booking payment without prior notice if we have good reason to suspect fraudulent activity.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">24. PASSPORT, VISA AND IMMIGRATION/HEALTH REQUIREMENTS</h2>
            <p>It is your responsibility to secure the appropriate passport, visa and other immigration documents required for your booking. We do not accept any responsibility if you cannot travel because you have not complied with the relevant requirements.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">25. CONTACTING YOU OUTSIDE OF THE BOOKING PROCESS</h2>
            <p>If you book via our website, we will communicate with you using the email address you have provided. In the event of disruptions or changes to your booking we may contact you via email, phone or SMS.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">26. ASSIGNMENT OF RIGHTS</h2>
            <p>Nuitée reserves its rights to assign in total or in part the obligation or rights of these Terms to any subsidiary, affiliate or holding company. You are not allowed to assign to any third party any obligation or right of these Terms without the prior express written authorisation of Nuitée.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">27. JURISDICTION</h2>
            <p>The application and interpretation of these Terms and Conditions shall be governed by current and applicable Irish Legislation. The parties shall abide by the Jurisdiction of the Courts of Ireland.</p>
          </section>

        </div>
      </main>
    </div>
  );
}

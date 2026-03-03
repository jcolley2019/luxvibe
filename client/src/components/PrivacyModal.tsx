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
            <div className="space-y-6 text-sm leading-relaxed">
              <section>
                <h3 className="font-bold text-lg mb-2">Who We Are</h3>
                <p>Nuitée Travel Limited is a company incorporated and registered in Ireland. Our registered office is located at 4 Waterloo Rd, Ballsbridge, Dublin, D04 A0X3, Ireland</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">What This Policy Covers</h3>
                <p>This Privacy Policy describes how Nuitée Travel Limited collects, uses, processes, and shares personal information. This policy applies to all users of our website and our services.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Information We Collect</h3>
                <p>When you use our website or services, we may collect the following types of information:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                  <li><strong>Personal Identification Information:</strong> Name, email address, phone number, etc.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                  <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
                  <li><strong>Marketing and Communications Data:</strong> Your preferences in receiving marketing from us and your communication preferences.</li>
                </ul>
                <p className="mt-4">We collect this data under the lawful bases set out in the GDPR, which include your consent, contract performance, legitimate business interests, and compliance with our legal obligations.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">How We Use Your Information</h3>
                <p>We use the information we collect for various purposes, including:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                  <li>To provide our services to you, in accordance with our Terms and Conditions.</li>
                  <li>To maintain and improve our website and services, in pursuit of our legitimate interests to provide an engaging and relevant experience to our users.</li>
                  <li>To communicate with you, including to respond to your comments or inquiries, in accordance with our contract performance duties and legitimate business interests.</li>
                  <li>To conduct marketing and promotions, based on your consent or our legitimate business interests.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Sharing Your Information</h3>
                <p>We may share your personal data with third-party service providers who perform functions on our behalf, including web hosting, data analysis, payment processing, order fulfillment, customer service, and marketing assistance. We ensure that our third-party service providers respect your personal data and comply with GDPR and other relevant data protection laws.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Your Rights</h3>
                <p>Under the GDPR, you have rights in relation to your personal data, including the right to access, correct, update, or request deletion of your personal data. You can also object to the processing of your personal data, ask us to restrict processing of your personal data, or request portability of your personal data. If we have collected and processed your personal data with your consent, you can withdraw your consent at any time.</p>
                <p className="mt-4">To exercise any of these rights, please contact us at <a href="mailto:contact@nuitee.com" className="text-primary underline">contact@nuitee.com</a>. We will respond to your request within a reasonable timeframe and in any event within any timeframe required by law.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Cookies</h3>
                <p>We use cookies and similar tracking technologies to track the activity on our website and hold certain information.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Data Retention</h3>
                <p>We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">How We Use Your Personal Data</h3>
                <p>We utilize your personal data for a variety of purposes, which are identified and described in the table below. Along with the purpose, we also specify the types of data we collect and the legal basis on which we process them.</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border text-xs">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Purpose for Processing</th>
                        <th className="border border-border p-2 text-left">Types of Data Collected</th>
                        <th className="border border-border p-2 text-left">Legal Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-2">Registering you as a new customer and completing our onboarding and KYC procedures.</td>
                        <td className="border border-border p-2">Identity, Contact, Financial & Governmental Data.</td>
                        <td className="border border-border p-2">Fulfilling our service agreement, Legitimate interest (maintaining updated records).</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">Processing and delivering your booking which includes managing payments, fees, charges, recovering debts, and returning funds in case of cancellations, refunds or price adjustments.</td>
                        <td className="border border-border p-2">Identity, Contact, Financial, Transaction, Marketing Communications.</td>
                        <td className="border border-border p-2">Fulfilling our service agreement, Legitimate interest (debt recovery).</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">Managing our relationship with you, which includes notifying you about changes in our terms or privacy policy, inviting you to review our services or participate in surveys, and soliciting feedback on new features.</td>
                        <td className="border border-border p-2">Identity, Contact, Profile, Marketing Communications.</td>
                        <td className="border border-border p-2">Fulfilling our service agreement, Legal obligations, Legitimate interest (maintaining updated records and understanding customer service usage).</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">Administering and protecting our business and website, which includes troubleshooting, data analysis, testing, system maintenance, support, reporting, and hosting of data.</td>
                        <td className="border border-border p-2">Identity, Contact, Technical.</td>
                        <td className="border border-border p-2">Legitimate interest (business operations, IT services, network security, fraud prevention, business reorganization), Legal obligations.</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">Delivering relevant website content and advertisements to you, and understanding the effectiveness of our advertising.</td>
                        <td className="border border-border p-2">Identity, Contact, Profile, Usage, Marketing Communications, Technical.</td>
                        <td className="border border-border p-2">Legitimate interest (understanding customer usage of products/services, business development, marketing strategy).</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">Using data analytics to enhance our website, products/services, marketing, customer relationships, and experiences.</td>
                        <td className="border border-border p-2">Technical, Usage.</td>
                        <td className="border border-border p-2">Legitimate interest (identifying customer types, keeping our website relevant, business development, marketing strategy).</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">Suggesting and recommending services to you that may be of your interest.</td>
                        <td className="border border-border p-2">Identity, Contact, Technical, Usage, Profile, Marketing Communications.</td>
                        <td className="border border-border p-2">Legitimate interest (product/service development, business growth).</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-2">Monitoring our communications with you for the purposes of checking instructions, training, crime prevention, improving customer service, and defending legal claims.</td>
                        <td className="border border-border p-2">Identity, Contact, Technical.</td>
                        <td className="border border-border p-2">Legitimate interest (employee training, business protection), Legal obligations.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4">We will only use your personal data for the purposes for which we collected it, unless we reasonably consider that we need to use it for another reason and that reason is compatible with the original purpose. If we need to use your personal data for an unrelated purpose, we will notify you and we will explain the legal basis which allows us to do so.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Security</h3>
                <p>We use appropriate technical and organizational measures to protect the personal information that we collect and process about you.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Changes to This Privacy Policy</h3>
                <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">Contact Us</h3>
                <p>If you have any questions about this Privacy Policy, please contact us by email at <a href="mailto:contact@nuitee.com" className="text-primary underline">contact@nuitee.com</a>.</p>
              </section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

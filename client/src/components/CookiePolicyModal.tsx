import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";

interface CookiePolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export function CookiePolicyModal({ open, onClose }: CookiePolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        hideClose
        className="max-w-2xl w-full max-h-[80vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-semibold">Cookies Policy</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Print policy"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
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
              <h3 className="text-lg font-bold">Introduction</h3>
              <p>We, Nuitée Travel Limited, respect and value the significance of your privacy and are dedicated to protecting your personal information. This Cookies Policy should be read alongside our terms and conditions.</p>
              <p className="mt-2">We are a registered company, incorporated in Ireland with VAT/TAX reference IE3388031IH. Our registered address is located at 11 O'Connor Square, Tullamore Co Offaly R35 N8W9, Ireland.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold">Information about use of Cookies</h3>
              <p>Our website, demo-whitelabel.nuitee.link, utilizes cookies to differentiate you from other users of our website. This enables us to enhance your browsing experience and make improvements to our site.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold">What Are Cookies?</h3>
              <p>A cookie is a small file consisting of letters and numbers that we store on your browser or computer's hard drive with your consent. Cookies contain information that is transferred to your computer's hard drive.</p>
              <p className="mt-2">Cookies play a vital role in ensuring a consistent and efficient experience for users of our website. They are text-only strings of information that our website transfers to the cookie file in your browser's hard disk. This allows the website to remember your identity, either for a single visit or multiple visits.</p>
              <p className="mt-2">There are two types of cookies used on our website: session cookies and persistent cookies. Session cookies are temporary and remain in the cookie file of your browser until you leave the site. Persistent cookies, on the other hand, remain in the cookie file for a longer period (the duration depends on the specific cookie).</p>
              <p className="mt-2">Cookies typically include the domain name from which the cookie originated, its "lifetime," and a value, often a randomly generated unique number.</p>
              <p className="mt-2">Cookies enable us to gather information about users of our site, which helps us provide you with an enhanced user experience and tailor our services to your individual needs. This information may include your IP address, web browser details, and online activity. However, we do not collect or store sensitive data such as passwords.</p>
              <p className="mt-2">By using our website with your browser settings configured to accept all cookies, we interpret this as your desire to use our products and services, and your consent to our use of cookies and other technologies as described in this Cookies Policy.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold">Cookies We Use</h3>
              <p>We utilize the following types of cookies on our website:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><strong>Strictly necessary cookies:</strong> These cookies are essential for the functioning of our website. They enable you to access secure areas and log into your account.</li>
                <li><strong>Analytical or performance cookies:</strong> These cookies help us analyze and understand how visitors use our website. They provide us with information about the number of visitors and their navigation patterns, which assists us in improving the website's functionality and user experience.</li>
                <li><strong>Functionality cookies:</strong> These cookies recognize you when you revisit our website. They allow us to personalize the content for you and remember your preferences for a more customized browsing experience.</li>
                <li><strong>Targeting cookies:</strong> These cookies track your visits to our website, including the pages you have viewed and the links you have followed. We utilize this information to deliver more relevant advertising and make our website more tailored to your interests.</li>
              </ul>
              
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse border border-border text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 text-left">Cookie Name</th>
                      <th className="border border-border p-2 text-left">Purpose</th>
                      <th className="border border-border p-2 text-left">Place of Processing</th>
                      <th className="border border-border p-2 text-left">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-2">demo-whitelabel.nuitee.link uses analytical cookies and Google Analytics</td>
                      <td className="border border-border p-2">To measure website traffic, analyze user behavior, and improve our service.</td>
                      <td className="border border-border p-2">United States</td>
                      <td className="border border-border p-2">Google Privacy Policy</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-2">Nuitée uses analytical cookies and the Intercom Messenger service provided by Intercom, Inc.</td>
                      <td className="border border-border p-2">To analyze user behavior, and improve/support service. Intercom allows recording chat, support conversations and offers for later playback.</td>
                      <td className="border border-border p-2">United States</td>
                      <td className="border border-border p-2">Intercom Privacy Policy</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold">Third-Party Cookies</h3>
              <p>Please be aware that third parties, such as advertising networks and providers of external services like web traffic analysis services, may also utilize cookies on our website. These cookies, which are likely to be analytical/performance cookies or targeting cookies, are beyond our control.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold">Consent to Cookies</h3>
              <p>By continuing to use our website, you consent to the usage of cookies for the purposes outlined above.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold">Updates to Our Cookies Policy</h3>
              <p>We reserve the right to modify this Cookies Policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website. If we make significant changes to this policy, we will notify you here, by email, or through a notice on our home page, so that you are aware of what information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.</p>
              <p className="mt-2">Please ensure that you check this page from time to time to stay updated with any changes. Your continued use of our website following the posting of changes to this Cookies Policy will be taken as your acceptance of those changes.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold">Objection to Cookies</h3>
              <p>You have the option to block cookies by adjusting your browser settings to refuse the placement of cookies, either all or some of them. However, please note that if you choose to block all cookies, including essential ones, you may not be able to access certain parts or features of our website.</p>
              <p className="mt-2">If you have any questions or wish to exercise your data protection rights, including your right to object, you can contact us by sending an email to <a href="mailto:privacy@nuitee.com" className="text-primary underline">privacy@nuitee.com</a>. We will be happy to assist you in addressing your concerns or inquiries regarding your personal data.</p>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

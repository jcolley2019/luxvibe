import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy — Luxvibe";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Read Luxvibe's Privacy Policy. Learn how we collect, use, and protect your personal data when you use our luxury hotel booking platform.");
    return () => { document.title = "Luxvibe – Luxury Hotel Deals & Boutique Stays Worldwide"; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Luxvibe
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 2024</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6 text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-lg mb-2">Who We Are</h2>
            <p>Nuitée Travel Limited is a company incorporated and registered in Ireland. Our registered office is located at 4 Waterloo Rd, Ballsbridge, Dublin, D04 A0X3, Ireland.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">What This Policy Covers</h2>
            <p>This Privacy Policy describes how Nuitée Travel Limited collects, uses, processes, and shares personal information. This policy applies to all users of our website and our services.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Information We Collect</h2>
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
            <h2 className="font-bold text-lg mb-2">How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>To provide our services to you, in accordance with our Terms and Conditions.</li>
              <li>To maintain and improve our website and services, in pursuit of our legitimate interests to provide an engaging and relevant experience to our users.</li>
              <li>To communicate with you, including to respond to your comments or inquiries, in accordance with our contract performance duties and legitimate business interests.</li>
              <li>To conduct marketing and promotions, based on your consent or our legitimate business interests.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Sharing Your Information</h2>
            <p>We may share your personal data with third-party service providers who perform functions on our behalf, including web hosting, data analysis, payment processing, order fulfillment, customer service, and marketing assistance. We ensure that our third-party service providers respect your personal data and comply with GDPR and other relevant data protection laws.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Your Rights</h2>
            <p>Under the GDPR, you have rights in relation to your personal data, including the right to access, correct, update, or request deletion of your personal data. You can also object to the processing of your personal data, ask us to restrict processing of your personal data, or request portability of your personal data. If we have collected and processed your personal data with your consent, you can withdraw your consent at any time.</p>
            <p className="mt-4">To exercise any of these rights, please contact us at <a href="mailto:contact@nuitee.com" className="text-primary underline">contact@nuitee.com</a>. We will respond to your request within a reasonable timeframe and in any event within any timeframe required by law.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Cookies</h2>
            <p>We use cookies and similar tracking technologies to track the activity on our website and hold certain information.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Data Retention</h2>
            <p>We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">How We Use Your Personal Data</h2>
            <p>We utilize your personal data for a variety of purposes, which are identified and described in the table below.</p>
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
                    <td className="border border-border p-2">Identity, Contact, Financial &amp; Governmental Data.</td>
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
            <p className="mt-4">We will only use your personal data for the purposes for which we collected it, unless we reasonably consider that we need to use it for another reason and that reason is compatible with the original purpose.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Security</h2>
            <p>We use appropriate technical and organizational measures to protect the personal information that we collect and process about you.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us by email at <a href="mailto:contact@nuitee.com" className="text-primary underline">contact@nuitee.com</a>.</p>
          </section>

        </div>
      </main>
    </div>
  );
}

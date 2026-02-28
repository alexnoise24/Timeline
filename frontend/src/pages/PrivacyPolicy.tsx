import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-text/70 hover:text-text transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10">
          <h1 className="text-3xl font-heading text-text mb-2">Privacy Policy</h1>
          <p className="text-text/60 mb-8">Last updated: January 28, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-text mb-3">1. Introduction</h2>
              <p className="text-text/80 leading-relaxed">
                Welcome to LenzuApp ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">2. Information We Collect</h2>
              <p className="text-text/80 leading-relaxed mb-3">We collect information that you provide directly to us:</p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                <li><strong>Profile Information:</strong> Professional role (photographer, planner, or guest)</li>
                <li><strong>Event Data:</strong> Timeline information, event details, dates, locations, and notes you create</li>
                <li><strong>Media:</strong> Photos uploaded for inspiration boards and photographer profiles</li>
                <li><strong>Communications:</strong> Messages and notes shared within timelines</li>
                <li><strong>Payment Information:</strong> Billing details processed securely through Stripe (we do not store card numbers)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">3. How We Use Your Information</h2>
              <p className="text-text/80 leading-relaxed mb-3">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage subscriptions</li>
                <li>Send you notifications about your events and collaborations</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Send you technical notices and security alerts</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">4. Information Sharing</h2>
              <p className="text-text/80 leading-relaxed mb-3">We may share your information in the following situations:</p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li><strong>With Collaborators:</strong> Timeline information is shared with users you invite to collaborate</li>
                <li><strong>Service Providers:</strong> We use third-party services (Stripe for payments, email services) that process data on our behalf</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-text/80 leading-relaxed mt-3">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">5. Data Storage and Security</h2>
              <p className="text-text/80 leading-relaxed">
                Your data is stored on secure servers. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data transmission is encrypted using SSL/TLS protocols.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">6. Your Rights</h2>
              <p className="text-text/80 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">7. Data Retention</h2>
              <p className="text-text/80 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account at any time by contacting us. After account deletion, we may retain certain information as required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">8. Children's Privacy</h2>
              <p className="text-text/80 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">9. Changes to This Policy</h2>
              <p className="text-text/80 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">10. Contact Us</h2>
              <p className="text-text/80 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-text/80 mt-2">
                <strong>Email:</strong> support@lenzu.app<br />
                <strong>Website:</strong> https://lenzu.app
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-heading text-text mb-2">Terms of Service</h1>
          <p className="text-text/60 mb-8">Last updated: January 28, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-text mb-3">1. Acceptance of Terms</h2>
              <p className="text-text/80 leading-relaxed">
                By accessing or using LenzuApp ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">2. Description of Service</h2>
              <p className="text-text/80 leading-relaxed">
                LenzuApp is an event timeline management platform designed for photographers, event planners, and their clients. The Service allows users to create, manage, and share event timelines, upload inspiration images, and collaborate with team members.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">3. User Accounts</h2>
              <p className="text-text/80 leading-relaxed mb-3">When creating an account, you agree to:</p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">4. Subscription Plans and Payments</h2>
              <p className="text-text/80 leading-relaxed mb-3">
                We offer various subscription plans with different features and limitations:
              </p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li><strong>Free Trial:</strong> 7-day trial with access to premium features</li>
                <li><strong>Starter:</strong> $9/month - Basic features for individuals</li>
                <li><strong>Pro:</strong> $19/month - Advanced features for professionals</li>
                <li><strong>Studio:</strong> $39/month - Full features including custom branding</li>
              </ul>
              <p className="text-text/80 leading-relaxed mt-3">
                Subscriptions are billed monthly and renew automatically. You may cancel at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">5. User Content</h2>
              <p className="text-text/80 leading-relaxed mb-3">You retain ownership of content you upload. By uploading content, you grant us a license to:</p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li>Store and display your content within the Service</li>
                <li>Share content with collaborators you invite</li>
                <li>Create backups for data protection</li>
              </ul>
              <p className="text-text/80 leading-relaxed mt-3">
                You are responsible for ensuring you have the rights to upload any content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">6. Prohibited Uses</h2>
              <p className="text-text/80 leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 text-text/80 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Upload malicious code or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with other users' use of the Service</li>
                <li>Resell or redistribute the Service without permission</li>
                <li>Upload content that infringes on others' rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">7. Intellectual Property</h2>
              <p className="text-text/80 leading-relaxed">
                The Service, including its design, features, and content (excluding user-uploaded content), is owned by LenzuApp and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">8. Limitation of Liability</h2>
              <p className="text-text/80 leading-relaxed">
                The Service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">9. Termination</h2>
              <p className="text-text/80 leading-relaxed">
                We may suspend or terminate your account if you violate these Terms. You may terminate your account at any time. Upon termination, your right to use the Service ceases immediately, though we may retain certain data as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">10. Changes to Terms</h2>
              <p className="text-text/80 leading-relaxed">
                We may modify these Terms at any time. We will notify you of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">11. Governing Law</h2>
              <p className="text-text/80 leading-relaxed">
                These Terms are governed by the laws of the jurisdiction where LenzuApp operates. Any disputes shall be resolved in the appropriate courts of that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text mb-3">12. Contact</h2>
              <p className="text-text/80 leading-relaxed">
                For questions about these Terms, please contact us at:
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

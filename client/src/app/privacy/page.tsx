import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ShareTracker',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f3] dark:bg-[#111111]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            ← Back to ShareTracker
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Overview</h2>
            <p>
              ShareTracker is committed to protecting your privacy. This Privacy Policy explains what
              information we collect, how we use it, and your rights in relation to it. By using ShareTracker,
              you agree to the collection and use of information as described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Account Information</h3>
            <p>
              We collect your email address and any profile information you provide during account creation,
              including your home currency and country of residency. Authentication is handled by{' '}
              <strong>Clerk</strong>, a third-party identity provider. Please refer to{' '}
              <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline">
                Clerk&apos;s Privacy Policy
              </a>{' '}
              for details on how authentication data is handled.
            </p>

            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Financial Data You Enter</h3>
            <p>
              We store trade records, dividend records, bond coupon records, and any other financial data
              you manually enter into the Service. This data is associated with your account and stored
              securely in our database.
            </p>

            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">Usage and Technical Data</h3>
            <p>
              We may collect standard server logs including IP addresses, browser type, and pages visited,
              for the purposes of security, debugging, and service improvement. We do not use third-party
              analytics trackers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide and operate the Service</li>
              <li>Calculate capital gains, generate reports, and display portfolio data</li>
              <li>Manage your account and subscription</li>
              <li>Respond to support requests</li>
              <li>Improve and secure the Service</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or share your personal or financial data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Third-Party Services</h2>
            <p>ShareTracker integrates with the following third-party services to operate:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Clerk</strong> — Authentication and identity management. Your login credentials are
                managed by Clerk and are not stored directly by ShareTracker.
              </li>
              <li>
                <strong>EODHD</strong> — End-of-day and real-time market data provider. When you view
                price quotes, your request triggers a server-side call to EODHD. No personal information
                is sent to EODHD.
              </li>
              <li>
                <strong>CoinGecko</strong> — Cryptocurrency price data. Used server-side for AUD-denominated
                crypto prices. No personal information is sent to CoinGecko.
              </li>
              <li>
                <strong>Stripe</strong> (if applicable) — Payment processing for subscriptions. ShareTracker
                does not store your payment card details. Please refer to Stripe&apos;s Privacy Policy for
                details on how payment data is handled.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Storage and Security</h2>
            <p>
              Your data is stored in a secured PostgreSQL database. We use industry-standard security
              practices including encrypted connections (TLS), access controls, and authentication tokens
              to protect your data. We do not store passwords — authentication is delegated to Clerk.
            </p>
            <p className="mt-3">
              While we take reasonable steps to protect your data, no system is completely secure. We
              cannot guarantee the absolute security of data transmitted over the internet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your account and financial data for as long as your account remains active. If you
              close your account, your data may be retained for a limited period for legal and regulatory
              compliance purposes before being deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your trade and financial records</li>
              <li>Object to or restrict certain processing of your data</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us through the account settings page within
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Cookies</h2>
            <p>
              ShareTracker uses only essential cookies required for authentication and session management
              (provided by Clerk). We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed at individuals under the age of 18. We do not knowingly collect
              personal information from minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of material changes
              by updating the date at the top of this page. Continued use of the Service after any changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Governing Law</h2>
            <p>
              This Privacy Policy is governed by the laws of Australia, including the{' '}
              <em>Privacy Act 1988 (Cth)</em> and the Australian Privacy Principles (APPs).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or how we handle your data,
              please contact us through the account settings page within the Service.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</Link>
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Back to ShareTracker</Link>
        </div>
      </div>
    </div>
  );
}

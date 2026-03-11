import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — ShareTracker',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f3] dark:bg-[#111111]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            ← Back to ShareTracker
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ShareTracker (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of
              Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
            <p>
              ShareTracker is a personal investment portfolio tracker that allows users to record trades, track
              capital gains and losses, and generate tax reports. The Service is intended as a record-keeping
              and organisational tool only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Market Data — Third-Party Sources</h2>
            <p>
              ShareTracker sources market data, including end-of-day (EOD) prices and live/real-time market
              prices, from third-party data providers including but not limited to{' '}
              <strong>EODHD</strong> and <strong>CoinGecko</strong>.
            </p>
            <p className="mt-3">
              <strong>We do not warrant the accuracy, completeness, timeliness, or reliability of any market
              data displayed within the Service.</strong> Market data may be delayed, incorrect, or unavailable
              at any time due to circumstances beyond our control, including third-party provider outages,
              API limitations, or data errors originating from the upstream provider.
            </p>
            <p className="mt-3">
              ShareTracker accepts no liability for any loss, damage, or financial consequence arising from
              reliance on any EOD prices, live prices, spot prices, or any other market data displayed within
              the Service. You should always verify prices independently before making any financial or
              investment decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Not Financial or Tax Advice</h2>
            <p>
              Nothing in the Service constitutes financial advice, investment advice, or tax advice. ShareTracker
              is a record-keeping tool only. Any capital gains calculations, tax estimates, or reports generated
              by the Service are provided for informational purposes only and may not reflect your actual tax
              obligations.
            </p>
            <p className="mt-3">
              You should consult a qualified financial adviser or registered tax agent before making any
              investment or tax decisions. Tax laws and regulations vary by jurisdiction and change over time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activity that occurs under your account. You must notify us immediately of any unauthorised use
              of your account. We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. User Data</h2>
            <p>
              You retain ownership of all trade data and financial records you enter into the Service. We store
              your data securely to provide the Service and do not sell your personal or financial data to
              third parties. Please refer to our{' '}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </Link>{' '}
              for full details on how we collect and handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to any part of the Service</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Reverse engineer or attempt to extract source code from the Service</li>
              <li>Use the Service to process data on behalf of third parties without authorisation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Subscription and Billing</h2>
            <p>
              Certain features of the Service require a paid subscription. Subscription fees are billed in
              advance and are non-refundable except where required by applicable law. We reserve the right to
              change pricing with reasonable notice to subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, ShareTracker and its operators shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages, including but
              not limited to loss of profits, data, or goodwill, arising out of or in connection with your use
              of the Service.
            </p>
            <p className="mt-3">
              Our total liability to you for any claim arising from or related to the Service shall not exceed
              the total amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Modifications to the Service and Terms</h2>
            <p>
              We reserve the right to modify or discontinue the Service at any time. We may also update these
              Terms from time to time. Continued use of the Service after any changes constitutes acceptance
              of the new Terms. We will endeavour to notify users of material changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of Australia. Any disputes
              arising from these Terms or your use of the Service shall be subject to the exclusive
              jurisdiction of the courts of Australia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us through the account settings page
              within the Service.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</Link>
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Back to ShareTracker</Link>
        </div>
      </div>
    </div>
  );
}

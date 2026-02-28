'use client';

import { PricingTable } from '@clerk/nextjs';

const FREE_FEATURES = [
  'Portfolio tracking across 5 asset types',
  'Unlimited trade recording',
  'Live share & crypto price quotes',
  'Foreign currency trade support',
  'Brokerage fee tracking',
];

const INVESTOR_FEATURES = [
  'Everything in Free',
  'Capital gains reports by financial year',
  'Weighted average cost base calculations',
  '50% CGT discount applied automatically',
  'Brokerage-adjusted cost base & proceeds',
  'Gross and taxable gain breakdown per trade',
];

function Check() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0 text-indigo-500"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Plans &amp; Pricing</h1>
        <p className="mt-2 text-base text-gray-500">
          Start for free. Upgrade when you need capital gains reporting.
        </p>
      </div>

      {/* Feature comparison */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2">
        {/* Free plan */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <span className="text-sm font-medium uppercase tracking-wide text-gray-500">Free</span>
            <p className="mt-1 text-2xl font-bold text-gray-900">$0</p>
            <p className="text-sm text-gray-500">No credit card required</p>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <Check />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Investor plan */}
        <div className="rounded-xl border-2 border-indigo-500 bg-white p-6 shadow-sm relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
              Most Popular
            </span>
          </div>
          <div className="mb-4">
            <span className="text-sm font-medium uppercase tracking-wide text-indigo-600">Investor</span>
            <p className="mt-1 text-2xl font-bold text-gray-900">See below</p>
            <p className="text-sm text-gray-500">Billed via Clerk</p>
          </div>
          <ul className="space-y-2.5">
            {INVESTOR_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <Check />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Clerk PricingTable — handles plan selection and checkout */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <PricingTable />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';

const INVESTOR_FEATURES = [
  'Capital gains summary by Australian financial year',
  'Weighted average cost base calculations',
  '50% CGT discount applied automatically',
  'Brokerage fee adjustments for accurate figures',
  'Gross and taxable gain breakdown per trade',
];

export function PlanGate() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">

        {/* Lock icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
          <svg
            className="h-7 w-7 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-gray-900">Investor Plan Required</h2>
        <p className="mt-2 text-sm text-gray-500">
          Capital gains reporting is available on the{' '}
          <span className="font-semibold text-indigo-600">Investor</span> plan.
        </p>

        {/* Feature list */}
        <ul className="mt-6 space-y-2.5 text-left">
          {INVESTOR_FEATURES.map(feature => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500"
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
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/pricing"
          className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          View Plans & Pricing
        </Link>
      </div>
    </div>
  );
}

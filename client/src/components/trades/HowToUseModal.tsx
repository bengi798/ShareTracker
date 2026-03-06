'use client';

import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface HowToUseModalProps {
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', currencyDisplay: 'narrowSymbol' });
}

// ── Step 1: Trades preview ────────────────────────────────────────────
const DEMO_TRADES = [
  { asset: 'Shares', desc: 'AAPL · NASDAQ', type: 'Buy',  units: 100,  price: 150.00,    total: 15_000.00, date: '10 Jan 2022' },
  { asset: 'Crypto', desc: 'BTC',           type: 'Buy',  units: 0.5,  price: 42_000.00, total: 21_000.00, date: '15 Mar 2023' },
  { asset: 'Shares', desc: 'AAPL · NASDAQ', type: 'Sell', units: 100,  price: 190.00,    total: 19_000.00, date: '15 Feb 2024' },
];

function TradesPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">My Trades</h2>
        <span className="inline-flex items-center bg-[#0038a8] px-3 py-1.5 text-sm font-medium text-white">
          + Add Trade
        </span>
      </div>

      <div className="overflow-hidden border border-gray-900 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Asset</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Units</th>
              <th className="px-4 py-3 text-right">Price/Unit</th>
              <th className="px-4 py-3 text-right">Total Value</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {DEMO_TRADES.map((t, i) => (
              <tr key={i} className="border-t border-gray-200">
                <td className="px-4 py-3">
                  <span className="inline-block border border-gray-900 px-2 py-0.5 text-xs font-semibold text-gray-900">{t.asset}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{t.desc}</td>
                <td className="px-4 py-3">
                  {t.type === 'Buy'
                    ? <span className="inline-block bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">{t.type}</span>
                    : <span className="inline-block border border-gray-900 px-2 py-0.5 text-xs font-medium text-gray-900">{t.type}</span>
                  }
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{t.units}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">${t.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">${t.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{t.date}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="cursor-default border border-gray-900 px-2 py-1 text-xs font-medium text-gray-700">Edit</span>
                    <span className="cursor-default bg-red-600 px-2 py-1 text-xs font-medium text-white">Delete</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Step 2: Portfolio preview ─────────────────────────────────────────
function PortfolioPreview() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Portfolio</h2>

      {/* Summary card */}
      <div className="flex flex-wrap gap-10 border border-gray-900 bg-white p-5">
        <div>
          <p className="text-sm text-gray-500">Total Asset Cost</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">$51,000.00</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Asset Value</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">$59,000.00</p>
          <p className="mt-0.5 text-sm font-medium text-green-600">+$8,000.00</p>
        </div>
      </div>

      {/* Shares */}
      <div className="overflow-hidden border border-gray-900">
        <div className="flex items-center justify-between border-b border-gray-900 bg-gray-900 px-4 py-3 text-white">
          <span className="font-semibold">Shares</span>
          <span className="text-sm font-medium">$38,000.00</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Ccy</th>
                <th className="px-3 py-2 text-right">Units</th>
                <th className="px-3 py-2 text-right">Avg Cost</th>
                <th className="px-3 py-2 text-right">Total Cost</th>
                <th className="px-3 py-2 text-right">Last Price</th>
                <th className="px-3 py-2 text-right">Mkt Value</th>
                <th className="px-3 py-2 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 py-3 font-medium text-gray-900">BHP · ASX</td>
                <td className="px-3 py-3 text-right text-gray-500">AUD</td>
                <td className="px-3 py-3 text-right text-gray-700">100</td>
                <td className="px-3 py-3 text-right text-gray-700">$38.00</td>
                <td className="px-3 py-3 text-right font-medium text-gray-900">$3,800.00</td>
                <td className="px-3 py-3 text-right text-gray-700">$56.00</td>
                <td className="px-3 py-3 text-right text-gray-700">$5,600.00</td>
                <td className="px-3 py-3 text-right font-medium text-green-600">+$1,800.00</td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-medium text-gray-900">MSFT · NASDAQ</td>
                <td className="px-3 py-3 text-right text-gray-500">USD</td>
                <td className="px-3 py-3 text-right text-gray-700">50</td>
                <td className="px-3 py-3 text-right text-gray-700">$380.00</td>
                <td className="px-3 py-3 text-right font-medium text-gray-900">$19,000.00</td>
                <td className="px-3 py-3 text-right text-gray-700">$450.00</td>
                <td className="px-3 py-3 text-right text-gray-700">$22,500.00</td>
                <td className="px-3 py-3 text-right font-medium text-green-600">+$3,500.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Crypto */}
      <div className="overflow-hidden border border-gray-900">
        <div className="flex items-center justify-between border-b border-gray-900 bg-gray-900 px-4 py-3 text-white">
          <span className="font-semibold">Crypto</span>
          <span className="text-sm font-medium">$21,000.00</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Ccy</th>
                <th className="px-3 py-2 text-right">Units</th>
                <th className="px-3 py-2 text-right">Avg Cost</th>
                <th className="px-3 py-2 text-right">Total Cost</th>
                <th className="px-3 py-2 text-right">Last Price</th>
                <th className="px-3 py-2 text-right">Mkt Value</th>
                <th className="px-3 py-2 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-3 font-medium text-gray-900">BTC</td>
                <td className="px-3 py-3 text-right text-gray-500">AUD</td>
                <td className="px-3 py-3 text-right text-gray-700">0.5</td>
                <td className="px-3 py-3 text-right text-gray-700">$42,000.00</td>
                <td className="px-3 py-3 text-right font-medium text-gray-900">$21,000.00</td>
                <td className="px-3 py-3 text-right text-gray-700">$62,000.00</td>
                <td className="px-3 py-3 text-right text-gray-700">$31,000.00</td>
                <td className="px-3 py-3 text-right font-medium text-green-600">+$10,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Reports demo ──────────────────────────────────────────────
type DemoBadge = 'full' | 'partial' | null;
interface DemoRow {
  date: string;
  tradeType: 'Buy' | 'Sell';
  desc: string;
  units: number;
  price: number;
  total: number;
  costBasis: number | null;
  grossGain: number | null;
  taxableGain: number | null;
  badge: DemoBadge;
  splitDiscounted?: number;
  splitFull?: number;
}

const DEMO_REPORT_ROWS: DemoRow[] = [
  { date: '10 Jan 2022', tradeType: 'Buy',  desc: 'AAPL · NASDAQ', units: 100, price: 150,   total: 15_000, costBasis: null,   grossGain: null,  taxableGain: null,  badge: null },
  { date: '15 Feb 2024', tradeType: 'Sell', desc: 'AAPL · NASDAQ', units: 100, price: 190,   total: 19_000, costBasis: 15_000, grossGain: 4_000, taxableGain: 2_000, badge: 'full' },
  { date: '01 Mar 2023', tradeType: 'Buy',  desc: 'BHP · ASX',     units: 50,  price: 40,    total: 2_000,  costBasis: null,   grossGain: null,  taxableGain: null,  badge: null },
  { date: '01 Feb 2024', tradeType: 'Buy',  desc: 'BHP · ASX',     units: 50,  price: 44,    total: 2_200,  costBasis: null,   grossGain: null,  taxableGain: null,  badge: null },
  { date: '15 May 2024', tradeType: 'Sell', desc: 'BHP · ASX',     units: 100, price: 56,    total: 5_600,  costBasis: 4_200,  grossGain: 1_400, taxableGain: 1_000, badge: 'partial', splitDiscounted: 400, splitFull: 600 },
  { date: '10 Jan 2025', tradeType: 'Buy',  desc: 'ETH',           units: 5,   price: 3_000, total: 15_000, costBasis: null,   grossGain: null,  taxableGain: null,  badge: null },
  { date: '20 Mar 2025', tradeType: 'Sell', desc: 'ETH',           units: 5,   price: 3_200, total: 16_000, costBasis: 15_000, grossGain: 1_000, taxableGain: 1_000, badge: null },
];

function ReportsPreview() {
  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="flex flex-wrap gap-8 border border-gray-900 bg-white p-5">
        <div>
          <p className="text-sm text-gray-500">Total Proceeds</p>
          <p className="mt-1 text-xl font-bold text-gray-900">$40,600.00</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Cost Basis</p>
          <p className="mt-1 text-xl font-bold text-gray-900">$34,200.00</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Gross Capital Gain / (Loss)</p>
          <p className="mt-1 text-xl font-bold text-green-600">+$6,400.00</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">
            Taxable Gain{' '}
            <span className="ml-1 bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
              50% CGT discount applied
            </span>
          </p>
          <p className="mt-1 text-xl font-bold text-green-600">+$4,000.00</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-green-100 px-1.5 py-0.5 font-medium text-green-700">50% CGT discount</span>
          <span className="text-gray-500">— held &gt; 12 months, full discount applied</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">Partial 50% CGT discount</span>
          <span className="text-gray-500">— sale spans lots with different holding periods</span>
        </span>
        <span className="flex items-center gap-1.5 text-gray-500">
          No badge — held &lt; 12 months, full gain is taxable
        </span>
      </div>

      {/* Trades table */}
      <div className="overflow-hidden border border-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Units</th>
                <th className="px-4 py-3 text-right">Price/Unit</th>
                <th className="px-4 py-3 text-right">Total Value</th>
                <th className="px-4 py-3 text-right">Cost Basis</th>
                <th className="px-4 py-3 text-right">Gross Gain/(Loss)</th>
                <th className="px-4 py-3 text-right">Taxable Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEMO_REPORT_ROWS.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{row.date}</td>
                  <td className="px-4 py-3">
                    {row.tradeType === 'Buy' ? (
                      <span className="inline-flex items-center bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">BUY</span>
                    ) : (
                      <span className="inline-flex items-center border border-gray-900 px-2 py-0.5 text-xs font-medium text-gray-900">SELL</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.desc}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.units}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(row.price)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(row.total)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {row.costBasis !== null ? fmt(row.costBasis) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    row.grossGain === null ? 'text-gray-400' : row.grossGain >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {row.grossGain !== null ? `+${fmt(row.grossGain)}` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    row.taxableGain === null ? 'text-gray-400' : row.taxableGain >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {row.taxableGain !== null ? (
                      <span className="flex flex-col items-end gap-0.5">
                        <span>{`+${fmt(row.taxableGain)}`}</span>
                        {row.badge === 'partial' ? (
                          <>
                            <span className="bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                              Partial 50% CGT discount
                            </span>
                            <span className="text-xs text-gray-400">
                              {fmt(row.splitDiscounted!)} discounted + {fmt(row.splitFull!)} full
                            </span>
                          </>
                        ) : row.badge === 'full' ? (
                          <span className="bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                            50% CGT discount
                          </span>
                        ) : null}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Step metadata ─────────────────────────────────────────────────────
const STEPS = [
  {
    title: 'Log Your Trades',
    description:
      'Head to the Trades page to record every buy and sell across shares, crypto, gold, bonds, and property. Hit "+ Add Trade" to get started.',
  },
  {
    title: 'Track Your Portfolio',
    description:
      'The Portfolio page shows all your current open positions. Live market prices are fetched for shares and crypto so you can see your unrealised P&L at a glance.',
  },
  {
    title: 'Generate CGT Reports',
    description:
      'The Reports page calculates your capital gains for each Australian financial year using FIFO lot tracking. The 50% CGT discount is automatically applied to assets held for more than 12 months.',
  },
];

// ── Modal ─────────────────────────────────────────────────────────────
export function HowToUseModal({ onClose }: HowToUseModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const stepContent = [<TradesPreview key={0} />, <PortfolioPreview key={1} />, <ReportsPreview key={2} />];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl flex-col border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-gray-900 dark:border-gray-500 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0038a8] dark:text-blue-400">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{current.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">{current.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center justify-center gap-0 border-b border-gray-200 dark:border-gray-700 py-3">
          {STEPS.map((s, i) => (
            <Fragment key={i}>
              <button
                onClick={() => setStep(i)}
                className={`flex h-7 w-7 items-center justify-center text-xs font-bold transition-colors ${
                  i === step
                    ? 'bg-[#0038a8] text-white'
                    : i < step
                    ? 'bg-[#0038a8]/20 text-[#0038a8] dark:bg-blue-900/40 dark:text-blue-400 hover:bg-[#0038a8]/30'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-600'
                }`}
              >
                {i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 transition-colors ${i < step ? 'bg-[#0038a8]' : 'bg-gray-200 dark:bg-zinc-700'}`} />
              )}
            </Fragment>
          ))}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {stepContent[step]}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-900 dark:border-gray-500 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            ← Back
          </Button>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Next →
              </Button>
            ) : (
              <Button onClick={onClose}>
                Get started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

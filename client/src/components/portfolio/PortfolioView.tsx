'use client';

import { useMemo, useState } from 'react';
import type { Trade, Quote, SharesQuote, CryptoQuote } from '@/lib/types';
import {
  computePositions,
  hasAnyPosition,
  type AllPositions,
  type SharesPosition,
  type GoldPosition,
  type CryptoPosition,
  type BondPosition,
  type PropertyPosition,
} from '@/lib/positions';
import { useForexRates } from '@/hooks/useForexRates';
import { useLiveQuotes, type LiveChange } from '@/hooks/useLiveQuotes';
import { useIsInvestor } from '@/lib/auth/usePlan';

// ── Currency helpers ──────────────────────────────────────────────────
function normCurrency(c: string): string {
  return !c || c === '0' ? 'AUD' : c;
}

// ── Formatting ────────────────────────────────────────────────────────
function fmtCurrency(n: number, currencyCode: string = 'AUD') {
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: normCurrency(currencyCode),
    currencyDisplay: 'narrowSymbol',
  });
}

function fmtUnits(n: number) {
  return n % 1 === 0 ? n.toLocaleString() : n.toString();
}

function toAud(amount: number, currency: string, rates: Record<string, number>): number {
  const c = normCurrency(currency);
  return c === 'AUD' ? amount : amount * (rates[c] ?? 1);
}

// ── Accent colours per category ───────────────────────────────────────
const CAT_STYLES = {
  Shares:   { header: 'border-blue-200   bg-blue-50   text-blue-800'   },
  Gold:     { header: 'border-amber-200  bg-amber-50  text-amber-800'  },
  Crypto:   { header: 'border-purple-200 bg-purple-50 text-purple-800' },
  Bond:     { header: 'border-teal-200   bg-teal-50   text-teal-800'   },
  Property: { header: 'border-orange-200 bg-orange-50 text-orange-800' },
};

// ── Position description helpers ──────────────────────────────────────
function sharesDesc(p: SharesPosition)     { return `${p.ticker.toUpperCase()} · ${p.exchange}`; }
function goldDesc(p: GoldPosition) {
  const unit = p.weightUnit === 'TroyOunces' ? 'Troy Oz' : p.weightUnit;
  return `${p.purityCarats}K · ${unit}`;
}
function cryptoDesc(p: CryptoPosition)     { return p.coinSymbol.toUpperCase(); }
function bondDesc(p: BondPosition)         { return `${p.bondCode.toUpperCase()} · ${p.yieldPercent}% · ${p.issuer}`; }
function propertyDesc(p: PropertyPosition) { return `${p.address} · ${p.propertyType}`; }

// ── Generic category table (Gold / Bond / Property) ───────────────────
interface CategoryRow {
  description: string;
  units:       number;
  avgCost:     number;
  totalCost:   number;
  currency:    string;
}

function CategorySection({
  label,
  subtotal,
  subtotalCurrency,
  rows,
  style,
}: {
  label:             string;
  subtotal:          number;
  subtotalCurrency:  string;
  rows:              CategoryRow[];
  style:             { header: string };
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${style.header}`}>
        <span className="font-semibold">{label}</span>
        <span className="text-sm font-medium">{fmtCurrency(subtotal, subtotalCurrency)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="w-[25%] px-4 py-2">Description</th>
              <th className="w-[25%] px-4 py-2 text-right">Units</th>
              <th className="w-[25%] px-4 py-2 text-right">Avg Cost</th>
              <th className="w-[25%] px-4 py-2 text-right">Cost Basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.description}</td>
                <td className="px-4 py-3 text-right text-gray-700">{fmtUnits(row.units)}</td>
                <td className="px-4 py-3 text-right text-gray-700">{fmtCurrency(row.avgCost, row.currency)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtCurrency(row.totalCost, row.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Shares category table ─────────────────────────────────────────────
function SharesCategorySection({
  positions,
  quotes,
  quotesLoading,
  displayMode,
  homeCurrency,
  rates,
  liveChanges,
}: {
  positions:     SharesPosition[];
  quotes:        SharesQuote[];
  quotesLoading: boolean;
  displayMode:   string;
  homeCurrency:  string;
  rates:         Record<string, number>;
  liveChanges?:  Map<string, LiveChange>;
}) {
  function fmtVal(amount: number, currency: string) {
    const c = normCurrency(currency);
    return displayMode === 'home'
      ? fmtCurrency(toAud(amount, c, rates), homeCurrency)
      : fmtCurrency(amount, c);
  }

  const subtotal = positions.reduce((s, p) => {
    const c = normCurrency(p.currency);
    return s + (displayMode === 'home' ? toAud(p.totalCost, c, rates) : p.totalCost);
  }, 0);

  const subtotalCurrency = displayMode === 'home' ? homeCurrency : displayMode;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${CAT_STYLES.Shares.header}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Shares</span>
          {quotesLoading && (
            <span className="text-xs font-normal text-blue-500">fetching prices…</span>
          )}
        </div>
        <span className="text-sm font-medium">{fmtCurrency(subtotal, subtotalCurrency)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="w-[18%] px-3 py-2">Description</th>
              <th className="w-[5%]  px-3 py-2 text-right">Ccy</th>
              <th className="w-[7%]  px-3 py-2 text-right">Units</th>
              <th className="w-[14%] px-3 py-2 text-right">Avg Cost</th>
              <th className="w-[14%] px-3 py-2 text-right">Total Cost</th>
              <th className="w-[14%] px-3 py-2 text-right">Last Price</th>
              <th className="w-[14%] px-3 py-2 text-right">Mkt Value</th>
              <th className="w-[14%] px-3 py-2 text-right">P&amp;L</th>
              {liveChanges && <th className="px-3 py-2 text-right">Today</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {positions.map((p, i) => {
              const quote = quotes.find(
                q => q.ticker === p.ticker.toUpperCase() && q.exchange === p.exchange,
              );
              const lastClose    = quote?.lastClose ?? null;
              const currentValue = lastClose !== null ? lastClose * p.availableUnits : null;
              const pnl          = currentValue !== null ? currentValue - p.totalCost : null;
              const displayCurrency = displayMode === 'home' ? homeCurrency : normCurrency(p.currency);
              const lc = liveChanges?.get(`${p.ticker.toUpperCase()}|${p.exchange}`);

              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="w-[18%] px-3 py-3 font-medium text-gray-900">{sharesDesc(p)}</td>
                  <td className="w-[5%]  px-3 py-3 text-right text-gray-500">{displayCurrency}</td>
                  <td className="w-[7%]  px-3 py-3 text-right text-gray-700">{fmtUnits(p.availableUnits)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 whitespace-nowrap">{fmtVal(p.avgCostPerUnit, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{fmtVal(p.totalCost, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                    {lastClose !== null ? fmtVal(lastClose, p.currency) : '—'}
                  </td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                    {currentValue !== null ? fmtVal(currentValue, p.currency) : '—'}
                  </td>
                  <td className={`w-[14%] px-3 py-3 text-right font-medium whitespace-nowrap ${
                    pnl === null ? 'text-gray-400' : pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pnl === null ? '—' : `${pnl >= 0 ? '+' : ''}${fmtVal(pnl, p.currency)}`}
                  </td>
                  {liveChanges && (
                    <td className={`px-3 py-3 text-right text-sm whitespace-nowrap ${
                      !lc ? 'text-gray-400' : lc.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {lc ? (
                        <span className="flex flex-col items-end">
                          <span>{lc.change >= 0 ? '+' : ''}{fmtVal(lc.change, p.currency)}</span>
                          <span className="text-xs">{lc.changePercent >= 0 ? '+' : ''}{lc.changePercent.toFixed(2)}%</span>
                        </span>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Crypto category table ─────────────────────────────────────────────
function CryptoCategorySection({
  positions,
  quotes,
  quotesLoading,
  displayMode,
  homeCurrency,
  rates,
  liveChanges,
}: {
  positions:     CryptoPosition[];
  quotes:        CryptoQuote[];
  quotesLoading: boolean;
  displayMode:   string;
  homeCurrency:  string;
  rates:         Record<string, number>;
  liveChanges?:  Map<string, LiveChange>;
}) {
  function fmtVal(amount: number, currency: string) {
    const c = normCurrency(currency);
    return displayMode === 'home'
      ? fmtCurrency(toAud(amount, c, rates), homeCurrency)
      : fmtCurrency(amount, c);
  }

  const subtotal = positions.reduce((s, p) => {
    const c = normCurrency(p.currency);
    return s + (displayMode === 'home' ? toAud(p.totalCost, c, rates) : p.totalCost);
  }, 0);

  const subtotalCurrency = displayMode === 'home' ? homeCurrency : displayMode;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${CAT_STYLES.Crypto.header}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Crypto</span>
          {quotesLoading && (
            <span className="text-xs font-normal text-blue-500">fetching prices…</span>
          )}
        </div>
        <span className="text-sm font-medium">{fmtCurrency(subtotal, subtotalCurrency)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="w-[18%] px-3 py-2">Description</th>
              <th className="w-[5%]  px-3 py-2 text-right">Ccy</th>
              <th className="w-[7%]  px-3 py-2 text-right">Units</th>
              <th className="w-[14%] px-3 py-2 text-right">Avg Cost</th>
              <th className="w-[14%] px-3 py-2 text-right">Total Cost</th>
              <th className="w-[14%] px-3 py-2 text-right">Last Price</th>
              <th className="w-[14%] px-3 py-2 text-right">Mkt Value</th>
              <th className="w-[14%] px-3 py-2 text-right">P&amp;L</th>
              {liveChanges && <th className="px-3 py-2 text-right">Today</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {positions.map((p, i) => {
              const quote = quotes.find(q => q.coinSymbol === p.coinSymbol.toUpperCase());
              const lastClose    = quote?.lastClose ?? null;
              const currentValue = lastClose !== null ? lastClose * p.availableUnits : null;
              const pnl          = currentValue !== null ? currentValue - p.totalCost : null;
              const displayCurrency = displayMode === 'home' ? homeCurrency : normCurrency(p.currency);
              const lc = liveChanges?.get(p.coinSymbol.toUpperCase());

              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="w-[18%] px-3 py-3 font-medium text-gray-900">{cryptoDesc(p)}</td>
                  <td className="w-[5%]  px-3 py-3 text-right text-gray-500">{displayCurrency}</td>
                  <td className="w-[7%]  px-3 py-3 text-right text-gray-700">{fmtUnits(p.availableUnits)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 whitespace-nowrap">{fmtVal(p.avgCostPerUnit, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{fmtVal(p.totalCost, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                    {lastClose !== null ? fmtVal(lastClose, p.currency) : '—'}
                  </td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                    {currentValue !== null ? fmtVal(currentValue, p.currency) : '—'}
                  </td>
                  <td className={`w-[14%] px-3 py-3 text-right font-medium whitespace-nowrap ${
                    pnl === null ? 'text-gray-400' : pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pnl === null ? '—' : `${pnl >= 0 ? '+' : ''}${fmtVal(pnl, p.currency)}`}
                  </td>
                  {liveChanges && (
                    <td className={`px-3 py-3 text-right text-sm whitespace-nowrap ${
                      !lc ? 'text-gray-400' : lc.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {lc ? (
                        <span className="flex flex-col items-end">
                          <span>{lc.change >= 0 ? '+' : ''}{fmtVal(lc.change, p.currency)}</span>
                          <span className="text-xs">{lc.changePercent >= 0 ? '+' : ''}{lc.changePercent.toFixed(2)}%</span>
                        </span>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export function PortfolioView({
  trades,
  quotes,
  quotesLoading,
  homeCurrency,
}: {
  trades:        Trade[];
  quotes:        Quote[];
  quotesLoading: boolean;
  homeCurrency:  string;
}) {
  const isInvestor = useIsInvestor();
  const positions: AllPositions = useMemo(() => computePositions(trades), [trades]);

  // ── Price mode: EOD (default) or Live (Investor only) ───────────────
  const [priceMode, setPriceMode] = useState<'eod' | 'live'>('eod');

  const { liveShares, liveCrypto, liveDayChange, liveChanges, liveLoading } = useLiveQuotes(
    positions.shares,
    positions.crypto,
    priceMode === 'live',
  );

  const sharesQuotes = useMemo((): SharesQuote[] =>
    priceMode === 'live'
      ? liveShares
      : quotes.filter((q): q is SharesQuote => q.assetType === 'Shares'),
  [priceMode, liveShares, quotes]);

  const cryptoQuotes = useMemo((): CryptoQuote[] =>
    priceMode === 'live'
      ? liveCrypto
      : quotes.filter((q): q is CryptoQuote => q.assetType === 'Crypto'),
  [priceMode, liveCrypto, quotes]);

  const effectiveQuotesLoading = priceMode === 'live' ? liveLoading : quotesLoading;

  // ── Display mode ────────────────────────────────────────────────────
  // 'home' = convert all to homeCurrency | '<CODE>' = filter to that currency only
  const [displayMode, setDisplayMode] = useState('home');

  // Unique currencies in open positions that differ from the user's home currency
  const foreignCurrencies = useMemo(() => {
    const all = [
      ...positions.shares,
      ...positions.gold,
      ...positions.crypto,
      ...positions.bonds,
      ...positions.property,
    ];
    const set = new Set(
      all.map(p => normCurrency(p.currency)).filter(c => c !== homeCurrency),
    );
    return Array.from(set).sort();
  }, [positions, homeCurrency]);

  // Fetch on page load whenever foreign-currency positions exist.
  // Rates stay cached in state, so switching modes never re-fetches.
  const { rates, forexLoading } = useForexRates(foreignCurrencies, homeCurrency, foreignCurrencies.length > 0);

  // ── Filtered position slices ────────────────────────────────────────
  const filterByMode = <T extends { currency: string }>(arr: T[]): T[] => {
    if (displayMode === 'home') return arr;
    return arr.filter(p => normCurrency(p.currency) === displayMode);
  };

  const visibleShares   = useMemo(() => filterByMode(positions.shares),   [positions.shares,   displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleGold     = useMemo(() => filterByMode(positions.gold),     [positions.gold,     displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleCrypto   = useMemo(() => filterByMode(positions.crypto),   [positions.crypto,   displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleBonds    = useMemo(() => filterByMode(positions.bonds),    [positions.bonds,    displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleProperty = useMemo(() => filterByMode(positions.property), [positions.property, displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Summary currency (what to render in the header card) ───────────
  const summaryCurrency = displayMode === 'home' ? homeCurrency : displayMode;

  // ── Grand total (cost basis) ────────────────────────────────────────
  const grandTotal = useMemo(() => {
    const all = [...visibleShares, ...visibleGold, ...visibleCrypto, ...visibleBonds, ...visibleProperty];
    return all.reduce((s, p) => {
      const cost = displayMode === 'home' ? toAud(p.totalCost, p.currency, rates) : p.totalCost;
      return s + cost;
    }, 0);
  }, [visibleShares, visibleGold, visibleCrypto, visibleBonds, visibleProperty, displayMode, rates]);

  // ── Total market value ──────────────────────────────────────────────
  const totalMarketValue = useMemo(() => {
    const sharesValue = visibleShares.reduce((sum, p) => {
      const q   = sharesQuotes.find(q => q.ticker === p.ticker.toUpperCase() && q.exchange === p.exchange);
      const raw = q?.lastClose != null ? q.lastClose * p.availableUnits : p.totalCost;
      return sum + (displayMode === 'home' ? toAud(raw, p.currency, rates) : raw);
    }, 0);

    const cryptoValue = visibleCrypto.reduce((sum, p) => {
      const q   = cryptoQuotes.find(q => q.coinSymbol === p.coinSymbol.toUpperCase());
      const raw = q?.lastClose != null ? q.lastClose * p.availableUnits : p.totalCost;
      return sum + (displayMode === 'home' ? toAud(raw, p.currency, rates) : raw);
    }, 0);

    const otherValue = [...visibleGold, ...visibleBonds, ...visibleProperty].reduce((sum, p) => {
      return sum + (displayMode === 'home' ? toAud(p.totalCost, p.currency, rates) : p.totalCost);
    }, 0);

    return sharesValue + cryptoValue + otherValue;
  }, [visibleShares, visibleCrypto, visibleGold, visibleBonds, visibleProperty, sharesQuotes, cryptoQuotes, displayMode, rates]);

  const totalPnl = totalMarketValue - grandTotal;

  // ── Pre-build rows for generic sections (already filtered above) ─────
  const makeRows = <T extends { availableUnits: number; avgCostPerUnit: number; totalCost: number; currency: string }>(
    arr: T[],
    descFn: (p: T) => string,
  ): CategoryRow[] =>
    arr.map(p => {
      const c           = normCurrency(p.currency);
      const displayCurr = displayMode === 'home' ? homeCurrency : c;
      const convert     = (v: number) => displayMode === 'home' ? toAud(v, c, rates) : v;
      return {
        description: descFn(p),
        units:       p.availableUnits,
        avgCost:     convert(p.avgCostPerUnit),
        totalCost:   convert(p.totalCost),
        currency:    displayCurr,
      };
    });

  const goldRows     = useMemo(() => makeRows(visibleGold,     goldDesc),     [visibleGold,     displayMode, rates]); // eslint-disable-line react-hooks/exhaustive-deps
  const bondRows     = useMemo(() => makeRows(visibleBonds,    bondDesc),     [visibleBonds,    displayMode, rates]); // eslint-disable-line react-hooks/exhaustive-deps
  const propertyRows = useMemo(() => makeRows(visibleProperty, propertyDesc), [visibleProperty, displayMode, rates]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPositions = useMemo(() => hasAnyPosition(positions), [positions]);

  const eodDateLabel = useMemo(() => {
    const asOf = quotes.find(q => q.asOf)?.asOf;
    if (!asOf) return 'EOD';
    const d = new Date(asOf + 'T00:00:00');
    return `EOD (${d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })})`;
  }, [quotes]);

  if (!hasPositions) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <p className="text-base font-medium text-gray-500">No open positions</p>
        <p className="mt-1 text-sm text-gray-400">
          Add a buy trade to see your portfolio here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Price mode toggle ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Prices:</span>
        <button
          onClick={() => setPriceMode('eod')}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            priceMode === 'eod'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {eodDateLabel}
        </button>
        <button
          onClick={() => isInvestor && setPriceMode('live')}
          title={isInvestor ? undefined : 'Investor plan required'}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            priceMode === 'live'
              ? 'bg-gray-900 text-white'
              : isInvestor
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          Live (15m delay)
          {!isInvestor && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Display toggle ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Display:</span>

        {/* Home currency total — always shown */}
        <button
          onClick={() => setDisplayMode('home')}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            displayMode === 'home'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Total ({homeCurrency})
        </button>

        {/* One button per foreign currency present in open positions */}
        {foreignCurrencies.map(c => (
          <button
            key={c}
            onClick={() => setDisplayMode(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              displayMode === c
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}

        {forexLoading && (
          <span className="text-xs text-gray-400 italic">fetching rates…</span>
        )}
      </div>

      {/* ── Summary card ───────────────────────────────────────────── */}
      <div className="flex gap-10 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-gray-500">Total Asset Cost</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{fmtCurrency(grandTotal, summaryCurrency)}</span>
            {displayMode === 'home' && foreignCurrencies.length > 0 && (
              <span className="text-sm font-normal text-gray-400">({homeCurrency})</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Asset Value</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{fmtCurrency(totalMarketValue, summaryCurrency)}</span>
            {displayMode === 'home' && foreignCurrencies.length > 0 && (
              <span className="text-sm font-normal text-gray-400">({homeCurrency})</span>
            )}
          </p>
          <p className={`mt-0.5 text-sm font-medium ${
            totalPnl > 0 ? 'text-green-600' : totalPnl < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {totalPnl >= 0 ? '+' : ''}{fmtCurrency(totalPnl, summaryCurrency)}
          </p>
        </div>
        {priceMode === 'live' && liveDayChange !== null && (
          <div>
            <p className="text-sm text-gray-500">Today&apos;s Change</p>
            <p className={`mt-1 text-3xl font-bold ${
              liveDayChange > 0 ? 'text-green-600' : liveDayChange < 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {liveDayChange >= 0 ? '+' : ''}{fmtCurrency(liveDayChange, summaryCurrency)}
            </p>
            {totalMarketValue > 0 && (
              <p className={`mt-0.5 text-sm font-medium ${
                liveDayChange > 0 ? 'text-green-600' : liveDayChange < 0 ? 'text-red-600' : 'text-gray-400'
              }`}>
                {liveDayChange >= 0 ? '+' : ''}
                {((liveDayChange / (totalMarketValue - liveDayChange)) * 100).toFixed(2)}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Shares ─────────────────────────────────────────────────── */}
      {visibleShares.length > 0 && (
        <SharesCategorySection
          positions={visibleShares}
          quotes={sharesQuotes}
          quotesLoading={effectiveQuotesLoading}
          displayMode={displayMode}
          homeCurrency={homeCurrency}
          rates={rates}
          liveChanges={priceMode === 'live' ? liveChanges : undefined}
        />
      )}

      {/* ── Gold ───────────────────────────────────────────────────── */}
      <CategorySection
        label="Gold"
        subtotal={goldRows.reduce((s, r) => s + r.totalCost, 0)}
        subtotalCurrency={summaryCurrency}
        rows={goldRows}
        style={CAT_STYLES.Gold}
      />

      {/* ── Crypto ─────────────────────────────────────────────────── */}
      {visibleCrypto.length > 0 && (
        <CryptoCategorySection
          positions={visibleCrypto}
          quotes={cryptoQuotes}
          quotesLoading={effectiveQuotesLoading}
          displayMode={displayMode}
          homeCurrency={homeCurrency}
          rates={rates}
          liveChanges={priceMode === 'live' ? liveChanges : undefined}
        />
      )}

      {/* ── Bonds ──────────────────────────────────────────────────── */}
      <CategorySection
        label="Bonds"
        subtotal={bondRows.reduce((s, r) => s + r.totalCost, 0)}
        subtotalCurrency={summaryCurrency}
        rows={bondRows}
        style={CAT_STYLES.Bond}
      />

      {/* ── Property ───────────────────────────────────────────────── */}
      <CategorySection
        label="Property"
        subtotal={propertyRows.reduce((s, r) => s + r.totalCost, 0)}
        subtotalCurrency={summaryCurrency}
        rows={propertyRows}
        style={CAT_STYLES.Property}
      />

    </div>
  );
}

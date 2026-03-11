'use client';

import { useMemo, useState } from 'react';
import type { Trade, Quote, SharesQuote, CryptoQuote, Portfolio } from '@/lib/types';
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
  Shares:   { header: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' },
  Gold:     { header: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' },
  Crypto:   { header: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' },
  Bond:     { header: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' },
  Property: { header: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' },
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
    <div className="overflow-hidden border border-gray-900 dark:border-gray-500">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${style.header}`}>
        <span className="font-semibold">{label}</span>
        <span className="text-sm font-medium">{fmtCurrency(subtotal, subtotalCurrency)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-zinc-900 text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="w-[25%] px-4 py-2">Description</th>
              <th className="w-[25%] px-4 py-2 text-right">Units</th>
              <th className="w-[25%] px-4 py-2 text-right">Avg Cost</th>
              <th className="w-[25%] px-4 py-2 text-right">Cost Basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.description}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmtUnits(row.units)}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmtCurrency(row.avgCost, row.currency)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{fmtCurrency(row.totalCost, row.currency)}</td>
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

  function fmtCost(amount: number, currency: string) {
    const c = normCurrency(currency);
    return displayMode === 'home'
      ? fmtCurrency(amount, homeCurrency)  // already in home currency (historical rate)
      : fmtCurrency(amount, c);
  }

  const subtotal = positions.reduce((s, p) =>
    s + (displayMode === 'home' ? p.totalCostHome : p.totalCost), 0);

  const subtotalCurrency = displayMode === 'home' ? homeCurrency : displayMode;

  return (
    <div className="overflow-hidden border border-gray-900 dark:border-gray-500">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${CAT_STYLES.Shares.header}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Shares</span>
          {quotesLoading && (
            <span className="text-xs font-normal text-blue-500 dark:text-blue-400">fetching prices…</span>
          )}
        </div>
        <span className="text-sm font-medium">{fmtCurrency(subtotal, subtotalCurrency)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-zinc-900 text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
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
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="w-[18%] px-3 py-3 font-medium text-gray-900 dark:text-white">{sharesDesc(p)}</td>
                  <td className="w-[5%]  px-3 py-3 text-right text-gray-500 dark:text-gray-400">{displayCurrency}</td>
                  <td className="w-[7%]  px-3 py-3 text-right text-gray-700 dark:text-gray-300">{fmtUnits(p.availableUnits)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmtCost(displayMode === 'home' ? p.avgCostHomePerUnit : p.avgCostPerUnit, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{fmtCost(displayMode === 'home' ? p.totalCostHome : p.totalCost, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {lastClose !== null ? fmtVal(lastClose, p.currency) : '—'}
                  </td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {currentValue !== null ? fmtVal(currentValue, p.currency) : '—'}
                  </td>
                  <td className={`w-[14%] px-3 py-3 text-right font-medium whitespace-nowrap ${
                    pnl === null ? 'text-gray-400' : pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {pnl === null ? '—' : `${pnl >= 0 ? '+' : ''}${fmtVal(pnl, p.currency)}`}
                  </td>
                  {liveChanges && (
                    <td className={`px-3 py-3 text-right text-sm whitespace-nowrap ${
                      !lc ? 'text-gray-400' : lc.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {lc ? (
                        <span className="flex flex-col items-end">
                          <span>{lc.change >= 0 ? '+' : ''}{fmtVal(lc.change*p.availableUnits, p.currency)}</span>
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

  function fmtCost(amount: number, currency: string) {
    const c = normCurrency(currency);
    return displayMode === 'home'
      ? fmtCurrency(amount, homeCurrency)  // already in home currency (historical rate)
      : fmtCurrency(amount, c);
  }

  const subtotal = positions.reduce((s, p) =>
    s + (displayMode === 'home' ? p.totalCostHome : p.totalCost), 0);

  const subtotalCurrency = displayMode === 'home' ? homeCurrency : displayMode;

  return (
    <div className="overflow-hidden border border-gray-900 dark:border-gray-500">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${CAT_STYLES.Crypto.header}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Crypto</span>
          {quotesLoading && (
            <span className="text-xs font-normal text-blue-500 dark:text-blue-400">fetching prices…</span>
          )}
        </div>
        <span className="text-sm font-medium">{fmtCurrency(subtotal, subtotalCurrency)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-zinc-900 text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {positions.map((p, i) => {
              const quote = quotes.find(q => q.coinSymbol === p.coinSymbol.toUpperCase());
              const lastClose    = quote?.lastClose ?? null;
              const currentValue = lastClose !== null ? lastClose * p.availableUnits : null;
              // lastClose is always in USD; convert p.totalCost to USD via AUD as pivot for P&L
              const rateUSD      = rates['USD'] ?? 1;
              const rateCcy      = rates[normCurrency(p.currency)] ?? 1;
              const totalCostUSD = rateUSD > 0 ? p.totalCost * rateCcy / rateUSD : p.totalCost;
              const pnl          = currentValue !== null ? currentValue - totalCostUSD : null;
              const displayCurrency = displayMode === 'home' ? homeCurrency : normCurrency(p.currency);
              const lc = liveChanges?.get(p.coinSymbol.toUpperCase());

              return (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="w-[18%] px-3 py-3 font-medium text-gray-900 dark:text-white">{cryptoDesc(p)}</td>
                  <td className="w-[5%]  px-3 py-3 text-right text-gray-500 dark:text-gray-400">{displayCurrency}</td>
                  <td className="w-[7%]  px-3 py-3 text-right text-gray-700 dark:text-gray-300">{fmtUnits(p.availableUnits)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmtCost(displayMode === 'home' ? p.avgCostHomePerUnit : p.avgCostPerUnit, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{fmtCost(displayMode === 'home' ? p.totalCostHome : p.totalCost, p.currency)}</td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {lastClose !== null ? fmtVal(lastClose, 'USD') : '—'}
                  </td>
                  <td className="w-[14%] px-3 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {currentValue !== null ? fmtVal(currentValue, 'USD') : '—'}
                  </td>
                  <td className={`w-[14%] px-3 py-3 text-right font-medium whitespace-nowrap ${
                    pnl === null ? 'text-gray-400' : pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {pnl === null ? '—' : `${pnl >= 0 ? '+' : ''}${fmtVal(pnl, 'USD')}`}
                  </td>
                  {liveChanges && (
                    <td className={`px-3 py-3 text-right text-sm whitespace-nowrap ${
                      !lc ? 'text-gray-400' : lc.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {lc ? (
                        <span className="flex flex-col items-end">
                          <span>{lc.change >= 0 ? '+' : ''}{fmtVal(lc.change * p.availableUnits, 'USD')}</span>
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
  portfolios = [],
  selectedPortfolioId = null,
  onPortfolioChange,
}: {
  trades:               Trade[];
  quotes:               Quote[];
  quotesLoading:        boolean;
  homeCurrency:         string;
  portfolios?:          Portfolio[];
  selectedPortfolioId?: string | null;
  onPortfolioChange?:   (id: string | null) => void;
}) {
  const isInvestor = useIsInvestor();

  const filteredTrades = useMemo(() =>
    selectedPortfolioId
      ? trades.filter(t => t.portfolioId === selectedPortfolioId)
      : trades,
  [trades, selectedPortfolioId]);

  const positions: AllPositions = useMemo(() => computePositions(filteredTrades), [filteredTrades]);

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

  const [displayMode, setDisplayMode] = useState('home');

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

  const { rates, forexLoading } = useForexRates(foreignCurrencies, homeCurrency, foreignCurrencies.length > 0);

  const filterByMode = <T extends { currency: string }>(arr: T[]): T[] => {
    if (displayMode === 'home') return arr;
    return arr.filter(p => normCurrency(p.currency) === displayMode);
  };

  const visibleShares   = useMemo(() => filterByMode(positions.shares),   [positions.shares,   displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleGold     = useMemo(() => filterByMode(positions.gold),     [positions.gold,     displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleCrypto   = useMemo(() => filterByMode(positions.crypto),   [positions.crypto,   displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleBonds    = useMemo(() => filterByMode(positions.bonds),    [positions.bonds,    displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleProperty = useMemo(() => filterByMode(positions.property), [positions.property, displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const summaryCurrency = displayMode === 'home' ? homeCurrency : displayMode;

  const grandTotal = useMemo(() => {
    const all = [...visibleShares, ...visibleGold, ...visibleCrypto, ...visibleBonds, ...visibleProperty];
    return all.reduce((s, p) => {
      const cost = displayMode === 'home' ? p.totalCostHome : p.totalCost;
      return s + cost;
    }, 0);
  }, [visibleShares, visibleGold, visibleCrypto, visibleBonds, visibleProperty, displayMode]);

  const totalMarketValue = useMemo(() => {
    const sharesValue = visibleShares.reduce((sum, p) => {
      const q   = sharesQuotes.find(q => q.ticker === p.ticker.toUpperCase() && q.exchange === p.exchange);
      const raw = q?.lastClose != null ? q.lastClose * p.availableUnits : p.totalCost;
      return sum + (displayMode === 'home' ? toAud(raw, p.currency, rates) : raw);
    }, 0);

    const cryptoValue = visibleCrypto.reduce((sum, p) => {
      const q   = cryptoQuotes.find(q => q.coinSymbol === p.coinSymbol.toUpperCase());
      // crypto lastClose is always in USD
      const raw = q?.lastClose != null ? q.lastClose * p.availableUnits : p.totalCost;
      const rawCurrency = q?.lastClose != null ? 'USD' : p.currency;
      return sum + (displayMode === 'home' ? toAud(raw, rawCurrency, rates) : raw);
    }, 0);

    const otherValue = [...visibleGold, ...visibleBonds, ...visibleProperty].reduce((sum, p) => {
      return sum + (displayMode === 'home' ? toAud(p.totalCost, p.currency, rates) : p.totalCost);
    }, 0);

    return sharesValue + cryptoValue + otherValue;
  }, [visibleShares, visibleCrypto, visibleGold, visibleBonds, visibleProperty, sharesQuotes, cryptoQuotes, displayMode, rates]);

  const totalPnl = totalMarketValue - grandTotal;

  const makeRows = <T extends { availableUnits: number; avgCostPerUnit: number; totalCost: number; currency: string; avgCostHomePerUnit: number; totalCostHome: number }>(
    arr: T[],
    descFn: (p: T) => string,
  ): CategoryRow[] =>
    arr.map(p => {
      const c           = normCurrency(p.currency);
      const displayCurr = displayMode === 'home' ? homeCurrency : c;
      return {
        description: descFn(p),
        units:       p.availableUnits,
        avgCost:     displayMode === 'home' ? p.avgCostHomePerUnit : p.avgCostPerUnit,
        totalCost:   displayMode === 'home' ? p.totalCostHome      : p.totalCost,
        currency:    displayCurr,
      };
    });

  const goldRows     = useMemo(() => makeRows(visibleGold,     goldDesc),     [visibleGold,     displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const bondRows     = useMemo(() => makeRows(visibleBonds,    bondDesc),     [visibleBonds,    displayMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const propertyRows = useMemo(() => makeRows(visibleProperty, propertyDesc), [visibleProperty, displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPositions = useMemo(() => hasAnyPosition(positions), [positions]);

  const eodDateLabel = 'Previous Close';

  const toggleBtnBase = 'px-3 py-1 text-sm font-medium transition-colors';
  const toggleActive  = `${toggleBtnBase} bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900`;
  const toggleInactive = `${toggleBtnBase} border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-100 hover:text-black dark:hover:text-white`;

  const portfolioFilter = portfolios.length > 0 && onPortfolioChange && (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio:</span>
      <button
        onClick={() => onPortfolioChange(null)}
        className={selectedPortfolioId === null ? toggleActive : toggleInactive}
      >
        All Portfolios
      </button>
      {portfolios.map(p => (
        <button
          key={p.id}
          onClick={() => onPortfolioChange(p.id)}
          className={selectedPortfolioId === p.id ? toggleActive : toggleInactive}
        >
          {p.name}
        </button>
      ))}
      <span
        className="text-xs text-gray-400 dark:text-gray-500 cursor-help"
        title="Manage portfolios from your Account page"
      >
        ⓘ
      </span>
    </div>
  );

  if (!hasPositions) {
    return (
      <div className="space-y-4">
        {portfolioFilter}
        <div className="border border-dashed border-gray-400 dark:border-gray-600 py-16 text-center">
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">No open positions</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Add a buy trade to see your portfolio here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Portfolio filter ───────────────────────────────────────── */}
      {portfolioFilter}

      {/* ── Price mode toggle ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prices:</span>
        <button onClick={() => setPriceMode('eod')} className={priceMode === 'eod' ? toggleActive : toggleInactive}>
          {eodDateLabel}
        </button>
        <button
          onClick={() => isInvestor && setPriceMode('live')}
          title={isInvestor ? undefined : 'Investor plan required'}
          className={`inline-flex items-center gap-1 ${
            priceMode === 'live' ? toggleActive
            : isInvestor ? toggleInactive
            : `${toggleBtnBase} cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500`
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
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Display:</span>
        <button onClick={() => setDisplayMode('home')} className={displayMode === 'home' ? toggleActive : toggleInactive}>
          Total ({homeCurrency})
        </button>
        {foreignCurrencies.map(c => (
          <button key={c} onClick={() => setDisplayMode(c)} className={displayMode === c ? toggleActive : toggleInactive}>
            {c}
          </button>
        ))}
        {forexLoading && (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">fetching rates…</span>
        )}
      </div>

      {/* ── Forex disclaimer ───────────────────────────────────────── */}
      {displayMode === 'home' && foreignCurrencies.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Share Values shown in {homeCurrency} have been converted using live exchange rates for indicative purposes only.
          They do not reflect the actual proceeds you would receive when selling foreign-currency assets and converting back to {homeCurrency}.
        </p>
      )}

      {/* ── Summary card ───────────────────────────────────────────── */}
      <div className="flex gap-10 border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 p-5">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Asset Cost</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{fmtCurrency(grandTotal, summaryCurrency)}</span>
            {displayMode === 'home' && foreignCurrencies.length > 0 && (
              <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({homeCurrency})</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Asset Value</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{fmtCurrency(totalMarketValue, summaryCurrency)}</span>
            {displayMode === 'home' && foreignCurrencies.length > 0 && (
              <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({homeCurrency})</span>
            )}
          </p>
          <p className={`mt-0.5 text-sm font-medium ${
            totalPnl > 0 ? 'text-green-600 dark:text-green-400' : totalPnl < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
          }`}>
            {totalPnl >= 0 ? '+' : ''}{fmtCurrency(totalPnl, summaryCurrency)}
          </p>
        </div>
        {priceMode === 'live' && liveDayChange !== null && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Change</p>
            <p className={`mt-1 text-3xl font-bold ${
              liveDayChange > 0 ? 'text-green-600 dark:text-green-400' : liveDayChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
            }`}>
              {liveDayChange >= 0 ? '+' : ''}{fmtCurrency(liveDayChange, summaryCurrency)}
            </p>
            {totalMarketValue > 0 && (
              <p className={`mt-0.5 text-sm font-medium ${
                liveDayChange > 0 ? 'text-green-600 dark:text-green-400' : liveDayChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
              }`}>
                {liveDayChange >= 0 ? '+' : ''}
                {((liveDayChange / (totalMarketValue - liveDayChange)) * 100).toFixed(2)}%
              </p>
            )}
          </div>
        )}
      </div>

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

      <CategorySection
        label="Gold"
        subtotal={goldRows.reduce((s, r) => s + r.totalCost, 0)}
        subtotalCurrency={summaryCurrency}
        rows={goldRows}
        style={CAT_STYLES.Gold}
      />

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

      <CategorySection
        label="Bonds"
        subtotal={bondRows.reduce((s, r) => s + r.totalCost, 0)}
        subtotalCurrency={summaryCurrency}
        rows={bondRows}
        style={CAT_STYLES.Bond}
      />

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

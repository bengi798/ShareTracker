'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Trade, SharesTrade, GoldTrade, CryptoTrade, BondTrade, PropertyTrade } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { reportsApi } from '@/lib/api/reports';

// ── Formatting ─────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', currencyDisplay: 'narrowSymbol' });
}
function fmtUnits(n: number) {
  return n % 1 === 0 ? n.toLocaleString() : n.toString();
}
function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Australian Financial Year helpers ──────────────────────────────────
// FY2025 = 1 July 2024 – 30 June 2025
function tradeFinancialYear(dateStr: string): number {
  const [year, month] = dateStr.split('-').map(Number);
  return month >= 7 ? year + 1 : year;
}
function fyStart(fy: number) { return `${fy - 1}-07-01`; }
function fyEnd(fy: number)   { return `${fy}-06-30`; }

// ── Asset key (mirrors positions.ts keying scheme) ─────────────────────
function assetKey(trade: Trade): string {
  switch (trade.assetType) {
    case 'Shares':   return `Shares|${(trade as SharesTrade).ticker.toUpperCase()}|${(trade as SharesTrade).exchange}`;
    case 'Gold':     return `Gold|${(trade as GoldTrade).purityCarats}|${(trade as GoldTrade).weightUnit}`;
    case 'Crypto':   return `Crypto|${(trade as CryptoTrade).coinSymbol.toUpperCase()}`;
    case 'Bond':     return `Bond|${(trade as BondTrade).bondCode.toUpperCase()}`;
    case 'Property': return `Property|${(trade as PropertyTrade).address.toLowerCase()}`;
  }
}

// ── Description helpers ────────────────────────────────────────────────
function tradeDescription(trade: Trade): string {
  switch (trade.assetType) {
    case 'Shares': {
      const t = trade as SharesTrade;
      return `${t.ticker.toUpperCase()} · ${t.exchange}`;
    }
    case 'Gold': {
      const t = trade as GoldTrade;
      const unit = t.weightUnit === 'TroyOunces' ? 'Troy Oz' : t.weightUnit;
      return `${t.purityCarats}K · ${unit}`;
    }
    case 'Crypto':
      return (trade as CryptoTrade).coinSymbol.toUpperCase();
    case 'Bond': {
      const t = trade as BondTrade;
      return `${t.bondCode.toUpperCase()} · ${t.yieldPercent}% · ${t.issuer}`;
    }
    case 'Property': {
      const t = trade as PropertyTrade;
      return `${t.address} · ${t.propertyType}`;
    }
  }
}

// ── Brokerage helper ───────────────────────────────────────────────────
function getBrokerageFees(trade: Trade): number {
  if (trade.assetType === 'Shares' || trade.assetType === 'Crypto') {
    return (trade as SharesTrade | CryptoTrade).brokerageFees ?? 0;
  }
  return 0;
}

// ── Sell metrics (weighted average cost basis + CGT discount) ──────────
interface SellMetrics {
  costBasis:          number;
  proceeds:           number;
  gainLoss:           number;
  cgtDiscountApplies: boolean;
  discountedGain:     number;
}

function computeSellMetrics(sell: Trade, allTrades: Trade[]): SellMetrics {
  const key = assetKey(sell);
  const history = allTrades
    .filter(t => assetKey(t) === key)
    .sort((a, b) =>
      a.dateOfTrade.localeCompare(b.dateOfTrade) ||
      a.createdAt.localeCompare(b.createdAt),
    );

  let sumBuyUnits = 0;
  let sumBuyValue = 0;
  let earliestBuyDate: string | null = null;
  for (const t of history) {
    if (t.tradeType === 'Buy') {
      if (earliestBuyDate === null) earliestBuyDate = t.dateOfTrade;
      sumBuyUnits += t.numberOfUnits;
      // Include brokerage in cost base: BUY $500 + $30 brokerage = $530 cost base
      sumBuyValue += t.pricePerUnit * t.numberOfUnits + getBrokerageFees(t);
    }
    if (t.id === sell.id) break;
  }

  const avgCost   = sumBuyUnits > 0 ? sumBuyValue / sumBuyUnits : 0;
  const costBasis = avgCost * sell.numberOfUnits;
  // Deduct brokerage from proceeds: SELL $500 - $30 brokerage = $470 net proceeds
  const proceeds  = sell.pricePerUnit * sell.numberOfUnits - getBrokerageFees(sell);
  const gainLoss  = proceeds - costBasis;

  // Australian 50% CGT discount: applies when gain is positive and asset held > 12 months
  let cgtDiscountApplies = false;
  if (gainLoss > 0 && earliestBuyDate !== null) {
    const buyDate         = new Date(earliestBuyDate + 'T00:00:00');
    const sellDate        = new Date(sell.dateOfTrade + 'T00:00:00');
    const oneYearAfterBuy = new Date(buyDate);
    oneYearAfterBuy.setFullYear(oneYearAfterBuy.getFullYear() + 1);
    cgtDiscountApplies = sellDate > oneYearAfterBuy;
  }

  const discountedGain = cgtDiscountApplies ? gainLoss * 0.5 : gainLoss;
  return { costBasis, proceeds, gainLoss, cgtDiscountApplies, discountedGain };
}

// ── Main component ─────────────────────────────────────────────────────
export function ReportsView({ trades }: { trades: Trade[] }) {
  const { token } = useAuth();
  // Only AUD-denominated trades are included in capital gains calculations.
  const audTrades = useMemo(
    () => trades.filter(t => !t.currency || t.currency === 'AUD'),
    [trades],
  );
  const excludedCount = trades.length - audTrades.length;

  const availableFYs = useMemo(() => {
    const years = new Set(audTrades.map(t => tradeFinancialYear(t.dateOfTrade)));
    return Array.from(years).sort((a, b) => b - a);
  }, [audTrades]);

  const [selectedFY, setSelectedFY] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  async function handleExport(format: 'pdf' | 'csv') {
    if (selectedFY === null || !token) return;
    const setExporting = format === 'pdf' ? setExportingPdf : setExportingCsv;
    setExporting(true);
    try {
      await reportsApi.export(selectedFY, format, token);
    } catch {
      // silently ignore — the download simply won't happen
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (availableFYs.length > 0 && selectedFY === null) {
      setSelectedFY(availableFYs[0]);
    }
  }, [availableFYs, selectedFY]);

  const fyTrades = useMemo(() => {
    if (selectedFY === null) return [];
    return audTrades
      .filter(t => t.dateOfTrade >= fyStart(selectedFY) && t.dateOfTrade <= fyEnd(selectedFY))
      .sort((a, b) => a.dateOfTrade.localeCompare(b.dateOfTrade));
  }, [audTrades, selectedFY]);

  const sellMetrics = useMemo(() => {
    const map = new Map<string, SellMetrics>();
    fyTrades
      .filter(t => t.tradeType === 'Sell')
      .forEach(t => map.set(t.id, computeSellMetrics(t, audTrades)));
    return map;
  }, [fyTrades, audTrades]);

  const totalProceeds      = useMemo(() => Array.from(sellMetrics.values()).reduce((s, m) => s + m.proceeds,       0), [sellMetrics]);
  const totalCostBasis     = useMemo(() => Array.from(sellMetrics.values()).reduce((s, m) => s + m.costBasis,      0), [sellMetrics]);
  const netGainLoss        = totalProceeds - totalCostBasis;
  const netDiscountedGain  = useMemo(() => Array.from(sellMetrics.values()).reduce((s, m) => s + m.discountedGain, 0), [sellMetrics]);
  const anyDiscountApplied = useMemo(() => Array.from(sellMetrics.values()).some(m => m.cgtDiscountApplies),          [sellMetrics]);
  const hasSells           = sellMetrics.size > 0;

  if (availableFYs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <p className="text-base font-medium text-gray-500">No trades recorded yet.</p>
        <p className="mt-1 text-sm text-gray-400">Add a trade to generate a financial year report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* FY selector + export buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="fy-select" className="text-sm font-medium text-gray-700">
          Financial year
        </label>
        <select
          id="fy-select"
          value={selectedFY ?? ''}
          onChange={e => setSelectedFY(Number(e.target.value))}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {availableFYs.map(fy => (
            <option key={fy} value={fy}>FY{fy}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exportingCsv || selectedFY === null}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingCsv ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Export CSV
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exportingPdf || selectedFY === null}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingPdf ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="flex flex-wrap gap-10 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-gray-500">Total Proceeds</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {hasSells ? fmtCurrency(totalProceeds) : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Cost Basis</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {hasSells ? fmtCurrency(totalCostBasis) : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Gross Capital Gain / (Loss)</p>
          <p className={`mt-1 text-2xl font-bold ${
            !hasSells          ? 'text-gray-400'
            : netGainLoss > 0  ? 'text-green-600'
            : netGainLoss < 0  ? 'text-red-600'
            :                    'text-gray-400'
          }`}>
            {!hasSells
              ? '—'
              : `${netGainLoss >= 0 ? '+' : ''}${fmtCurrency(netGainLoss)}`}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">
            Taxable Gain
            {anyDiscountApplied && (
              <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                50% CGT discount applied
              </span>
            )}
          </p>
          <p className={`mt-1 text-2xl font-bold ${
            !hasSells               ? 'text-gray-400'
            : netDiscountedGain > 0 ? 'text-green-600'
            : netDiscountedGain < 0 ? 'text-red-600'
            :                         'text-gray-400'
          }`}>
            {!hasSells
              ? '—'
              : `${netDiscountedGain >= 0 ? '+' : ''}${fmtCurrency(netDiscountedGain)}`}
          </p>
        </div>
      </div>

      {/* AUD-only disclaimer */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span className="font-semibold">AUD trades only.</span>{' '}
        This report includes only trades denominated in AUD. Capital gains on foreign-currency assets
        require separate foreign income calculations and are not shown here.
        {excludedCount > 0 && (
          <span className="ml-1">
            {excludedCount} non-AUD trade{excludedCount !== 1 ? 's' : ''} excluded.
          </span>
        )}
      </div>

      {/* Trades table */}
      {fyTrades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">No trades recorded in FY{selectedFY}.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Price / Unit</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                  <th className="px-4 py-3 text-right">Cost Basis</th>
                  <th className="px-4 py-3 text-right">Gross Gain / (Loss)</th>
                  <th className="px-4 py-3 text-right">Taxable Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fyTrades.map(trade => {
                  const metrics = trade.tradeType === 'Sell' ? sellMetrics.get(trade.id) : undefined;
                  return (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {fmtDate(trade.dateOfTrade)}
                      </td>
                      <td className="px-4 py-3">
                        {trade.tradeType === 'Buy' ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            BUY
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            SELL
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {tradeDescription(trade)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {fmtUnits(trade.numberOfUnits)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {fmtCurrency(trade.pricePerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {fmtCurrency(trade.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {metrics ? fmtCurrency(metrics.costBasis) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        !metrics               ? 'text-gray-400'
                        : metrics.gainLoss >= 0 ? 'text-green-600'
                        :                         'text-red-600'
                      }`}>
                        {metrics
                          ? `${metrics.gainLoss >= 0 ? '+' : ''}${fmtCurrency(metrics.gainLoss)}`
                          : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        !metrics                    ? 'text-gray-400'
                        : metrics.discountedGain >= 0 ? 'text-green-600'
                        :                               'text-red-600'
                      }`}>
                        {metrics ? (
                          <span className="flex flex-col items-end gap-0.5">
                            <span>{`${metrics.discountedGain >= 0 ? '+' : ''}${fmtCurrency(metrics.discountedGain)}`}</span>
                            {metrics.cgtDiscountApplies && (
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                                50% CGT discount
                              </span>
                            )}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

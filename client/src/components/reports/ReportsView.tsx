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

// ── Sell metrics (FIFO lot-based CGT calculation) ─────────────────────
interface SellMetrics {
  costBasis:                 number;
  proceeds:                  number;
  gainLoss:                  number;
  cgtDiscountApplies:        boolean; // true if any lot qualifies for 50% discount
  discountedGain:            number;  // total taxable gain after applying discounts
  isSplit:                   boolean; // some lots discounted, some not
  splitDiscountedTaxable:    number;  // taxable gain from discounted lots (gross × 50%)
  splitNonDiscountedTaxable: number;  // full gain/loss from non-discounted lots
}

// Processes all AUD trades using FIFO lot tracking so that when a sale spans
// buy lots with different holding periods, the 50% CGT discount is applied
// only to the portion held for more than 12 months.
function computeAllSellMetrics(allTrades: Trade[]): Map<string, SellMetrics> {
  const byAsset = new Map<string, Trade[]>();
  for (const trade of allTrades) {
    const key = assetKey(trade);
    if (!byAsset.has(key)) byAsset.set(key, []);
    byAsset.get(key)!.push(trade);
  }

  const result = new Map<string, SellMetrics>();

  for (const trades of Array.from(byAsset.values())) {
    const sorted = [...trades].sort((a, b) =>
      a.dateOfTrade.localeCompare(b.dateOfTrade) ||
      a.createdAt.localeCompare(b.createdAt),
    );

    // FIFO lot pool: tracks remaining units and cost-per-unit (including brokerage)
    const lots: { date: string; costPerUnit: number; remaining: number }[] = [];

    for (const trade of sorted) {
      if (trade.tradeType === 'Buy') {
        const brokerage = getBrokerageFees(trade);
        const totalCost = trade.pricePerUnit * trade.numberOfUnits + brokerage;
        lots.push({
          date:        trade.dateOfTrade,
          costPerUnit: trade.numberOfUnits > 0 ? totalCost / trade.numberOfUnits : 0,
          remaining:   trade.numberOfUnits,
        });
      } else if (trade.tradeType === 'Sell') {
        const sellBrokerage  = getBrokerageFees(trade);
        const totalProceeds  = trade.pricePerUnit * trade.numberOfUnits - sellBrokerage;
        const proceedsPerUnit = trade.numberOfUnits > 0 ? totalProceeds / trade.numberOfUnits : 0;
        const sellDate        = new Date(trade.dateOfTrade + 'T00:00:00');

        let unitsToSell          = trade.numberOfUnits;
        let totalCostBasis       = 0;
        let discountedTaxable    = 0; // gain × 0.5 for lots held > 12 months
        let nonDiscountedTaxable = 0; // full gain/loss for lots held ≤ 12 months
        let anyDiscount          = false;
        let anyNonDiscount       = false;

        for (const lot of lots) {
          if (unitsToSell <= 0) break;
          if (lot.remaining === 0) continue;

          const unitsFromLot = Math.min(lot.remaining, unitsToSell);
          lot.remaining -= unitsFromLot;
          unitsToSell   -= unitsFromLot;

          const lotCostBasis = lot.costPerUnit * unitsFromLot;
          const lotProceeds  = proceedsPerUnit * unitsFromLot;
          const lotGain      = lotProceeds - lotCostBasis;
          totalCostBasis    += lotCostBasis;

          const buyDate         = new Date(lot.date + 'T00:00:00');
          const oneYearAfterBuy = new Date(buyDate);
          oneYearAfterBuy.setFullYear(oneYearAfterBuy.getFullYear() + 1);
          const discountApplies = lotGain > 0 && sellDate > oneYearAfterBuy;

          if (discountApplies) {
            anyDiscount        = true;
            discountedTaxable += lotGain * 0.5;
          } else {
            anyNonDiscount       = true;
            nonDiscountedTaxable += lotGain;
          }
        }

        result.set(trade.id, {
          costBasis:                 totalCostBasis,
          proceeds:                  totalProceeds,
          gainLoss:                  totalProceeds - totalCostBasis,
          cgtDiscountApplies:        anyDiscount,
          discountedGain:            discountedTaxable + nonDiscountedTaxable,
          isSplit:                   anyDiscount && anyNonDiscount,
          splitDiscountedTaxable:    discountedTaxable,
          splitNonDiscountedTaxable: nonDiscountedTaxable,
        });
      }
    }
  }

  return result;
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

  // Compute FIFO metrics across all FYs so lot pools carry over correctly
  const allSellMetrics = useMemo(() => computeAllSellMetrics(audTrades), [audTrades]);

  // Filter to the selected FY's sells for display and summary calculations
  const sellMetrics = useMemo(() => {
    const map = new Map<string, SellMetrics>();
    if (selectedFY === null) return map;
    for (const t of fyTrades) {
      if (t.tradeType !== 'Sell') continue;
      const m = allSellMetrics.get(t.id);
      if (m) map.set(t.id, m);
    }
    return map;
  }, [allSellMetrics, fyTrades, selectedFY]);

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
                            {metrics.isSplit ? (
                              <>
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                  Partial 50% CGT discount
                                </span>
                                <span className="text-xs text-gray-400">
                                  {`${fmtCurrency(metrics.splitDiscountedTaxable)} discounted + ${fmtCurrency(metrics.splitNonDiscountedTaxable)} full`}
                                </span>
                              </>
                            ) : metrics.cgtDiscountApplies ? (
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                                50% CGT discount
                              </span>
                            ) : null}
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

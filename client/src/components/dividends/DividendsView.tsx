'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Trade, SharesTrade } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';

// EODHD exchange code mapping
const EXCHANGE_CODES: Record<string, string> = {
  ASX:    'AU',
  NYSE:   'US',
  NASDAQ: 'US',
  LSE:    'LSE',
  TSX:    'TO',
};

interface DividendRecord {
  date:            string;
  declarationDate: string | null;
  recordDate:      string | null;
  paymentDate:     string | null;
  period:          string;
  franking:        string;
  value:           number;
  unadjustedValue: number;
  currency:        string;
}

interface ShareOption {
  ticker:        string;
  exchange:      string;
  symbol:        string;        // EODHD symbol e.g. ANZ.AU
  firstBuyDate:  string;
  lastHeldDate:  string;        // today if still holding, else last sell date
  trades:        SharesTrade[];
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtPerShare(value: number, currency: string) {
  try {
    return value.toLocaleString('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  } catch {
    return `${value.toFixed(6)} ${currency}`;
  }
}

function fmtTotal(value: number, currency: string) {
  try {
    return value.toLocaleString('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function computeUnitsAt(trades: SharesTrade[], date: string): number {
  return trades
    .filter(t => t.dateOfTrade <= date)
    .reduce((sum, t) => sum + (t.tradeType === 'Buy' ? t.numberOfUnits : -t.numberOfUnits), 0);
}

export function DividendsView({ trades }: { trades: Trade[] }) {
  const sharesTrades = useMemo(
    () => trades.filter((t): t is SharesTrade => t.assetType === 'Shares'),
    [trades],
  );

  const shareOptions = useMemo<ShareOption[]>(() => {
    const map = new Map<string, SharesTrade[]>();
    for (const t of sharesTrades) {
      const key = `${t.ticker.toUpperCase()}|${t.exchange}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    const today = new Date().toISOString().split('T')[0];
    const options: ShareOption[] = [];

    for (const tList of Array.from(map.values())) {
      const sorted = [...tList].sort((a, b) =>
        a.dateOfTrade.localeCompare(b.dateOfTrade) || a.createdAt.localeCompare(b.createdAt),
      );

      const firstBuy = sorted.find(t => t.tradeType === 'Buy');
      if (!firstBuy) continue;

      const ticker       = firstBuy.ticker.toUpperCase();
      const exchange     = firstBuy.exchange;
      const exchangeCode = EXCHANGE_CODES[exchange];
      if (!exchangeCode) continue;

      const netUnits   = sorted.reduce((sum, t) => sum + (t.tradeType === 'Buy' ? t.numberOfUnits : -t.numberOfUnits), 0);
      const sells      = sorted.filter(t => t.tradeType === 'Sell');
      const lastSell   = sells.length > 0 ? sells[sells.length - 1].dateOfTrade : null;
      const lastHeldDate = netUnits > 0 ? today : (lastSell ?? today);

      options.push({
        ticker,
        exchange,
        symbol:       `${ticker}.${exchangeCode}`,
        firstBuyDate: firstBuy.dateOfTrade,
        lastHeldDate,
        trades:       sorted,
      });
    }

    return options.sort((a, b) => a.ticker.localeCompare(b.ticker));
  }, [sharesTrades]);

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [dividends, setDividends]     = useState<DividendRecord[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const selectedOption = useMemo(
    () => shareOptions.find(o => `${o.ticker}|${o.exchange}` === selectedKey) ?? null,
    [shareOptions, selectedKey],
  );

  // Auto-select first option
  useEffect(() => {
    if (shareOptions.length > 0 && !selectedKey) {
      setSelectedKey(`${shareOptions[0].ticker}|${shareOptions[0].exchange}`);
    }
  }, [shareOptions, selectedKey]);

  // Fetch dividends when selection changes
  useEffect(() => {
    if (!selectedOption) return;
    setLoading(true);
    setError(null);
    setDividends([]);

    fetch(`/eodhd/dividends/${selectedOption.symbol}?from=${selectedOption.firstBuyDate}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DividendRecord[]) => {
        const filtered = Array.isArray(data)
          ? data.filter(d => d.date >= selectedOption.firstBuyDate && d.date <= selectedOption.lastHeldDate)
          : [];
        setDividends(filtered);
      })
      .catch(() => setError('Failed to load dividend data. Please try again.'))
      .finally(() => setLoading(false));
  }, [selectedOption]);

  // Compute total dividends received per currency
  const totalsByCurrency = useMemo(() => {
    if (!selectedOption) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const d of dividends) {
      const units = computeUnitsAt(selectedOption.trades, d.date);
      if (units <= 0) continue;
      map.set(d.currency, (map.get(d.currency) ?? 0) + d.value * units);
    }
    return map;
  }, [dividends, selectedOption]);

  if (shareOptions.length === 0) {
    return (
      <div className="border border-dashed border-gray-400 dark:border-gray-600 py-16 text-center">
        <p className="text-base font-medium text-gray-500 dark:text-gray-400">No shares trades recorded yet.</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Add a shares trade to see dividend history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Share selector */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="share-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Share
        </label>
        <Select
          id="share-select"
          value={selectedKey}
          onChange={e => {
            setSelectedKey(e.target.value);
            setDividends([]);
            setError(null);
          }}
          className="w-auto"
        >
          {shareOptions.map(o => (
            <option key={`${o.ticker}|${o.exchange}`} value={`${o.ticker}|${o.exchange}`}>
              {o.ticker} · {o.exchange}
            </option>
          ))}
        </Select>
      </div>

      {/* Ownership period note */}
      {selectedOption && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing dividends from{' '}
          <span className="font-medium">{fmtDate(selectedOption.firstBuyDate)}</span>
          {' '}to{' '}
          <span className="font-medium">{fmtDate(selectedOption.lastHeldDate)}</span>.
        </p>
      )}

      {loading && <Spinner />}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {!loading && !error && dividends.length === 0 && selectedOption && (
        <div className="border border-dashed border-gray-400 dark:border-gray-600 py-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No dividends found for {selectedOption.ticker} during the ownership period.
          </p>
        </div>
      )}

      {!loading && !error && dividends.length > 0 && (
        <>
          {/* Summary card */}
          <div className="flex flex-wrap gap-10 border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 p-5">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dividend Events</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{dividends.length}</p>
            </div>
            {Array.from(totalsByCurrency.entries()).map(([currency, total]) => (
              <div key={currency}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Received ({currency})</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {fmtTotal(total, currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Dividends table */}
          <div className="overflow-hidden border border-gray-900 dark:border-gray-500">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-zinc-900 text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Ex-Date</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Per Share</th>
                    <th className="px-4 py-3 text-right">Franking</th>
                    <th className="px-4 py-3 text-right">Units Held</th>
                    <th className="px-4 py-3 text-right">Total Received</th>
                    <th className="px-4 py-3 text-right">Currency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {dividends.map((d, i) => {
                    const units = selectedOption
                      ? computeUnitsAt(selectedOption.trades, d.date)
                      : 0;
                    const total = d.value * units;
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                          {fmtDate(d.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                          {d.paymentDate ? fmtDate(d.paymentDate) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            {d.period}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                          {fmtPerShare(d.value, d.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {d.franking && d.franking !== '0%' ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                              {d.franking}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">0%</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                          {units > 0 ? units.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                          {units > 0 ? fmtTotal(total, d.currency) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                          {d.currency}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

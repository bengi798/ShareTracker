'use client';

import { useEffect, useMemo, useState } from 'react';

interface ForexResponse {
  close: number;
}

/**
 * Fetches live forex rates via the local Next.js proxy (/api/forex/[pair]),
 * which calls EODHD server-side to avoid CORS restrictions.
 * Returns rates[fromCurrency] = how many `targetCurrency` per 1 unit of `fromCurrency`.
 * e.g. with targetCurrency='AUD': rates['USD'] = 1.58 means 1 USD = A$1.58
 *
 * Only fetches when `enabled` is true.
 */
export function useForexRates(currencies: string[], targetCurrency: string, enabled: boolean) {
  const [rates, setRates]     = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Stable key so the effect doesn't re-fire on every render
  const key = useMemo(() => `${targetCurrency}:${[...currencies].sort().join(',')}`, [currencies, targetCurrency]);

  useEffect(() => {
    const foreign = currencies.filter(c => c !== targetCurrency);

    if (!enabled || foreign.length === 0) {
      setRates({});
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all(
      foreign.map(async (c) => {
        const res = await fetch(`/api/forex/${c}${targetCurrency}`);
        if (!res.ok) throw new Error(`Forex fetch failed for ${c}`);
        const data: ForexResponse = await res.json();
        return [c, data.close] as [string, number];
      }),
    )
      .then((entries) => setRates(Object.fromEntries(entries)))
      .catch(() => setRates({}))
      .finally(() => setLoading(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { rates, forexLoading: loading };
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SharesPosition, CryptoPosition } from '@/lib/positions';
import type { CryptoQuote, SharesQuote } from '@/lib/types';

const EXCHANGE_CODES: Record<string, string> = {
  ASX: 'AU', NYSE: 'US', NASDAQ: 'US', LSE: 'LSE', TSX: 'TO',
};

interface EodhdLiveResult {
  code:  string;
  close: number;
}

export function useLiveQuotes(
  sharesPositions: SharesPosition[],
  cryptoPositions: CryptoPosition[],
  enabled: boolean,
) {
  const [liveShares, setLiveShares] = useState<SharesQuote[]>([]);
  const [liveCrypto, setLiveCrypto] = useState<CryptoQuote[]>([]);
  const [loading, setLoading]       = useState(false);

  const shareSymbols = useMemo(() =>
    sharesPositions.flatMap(p => {
      const code = EXCHANGE_CODES[p.exchange];
      return code ? [`${p.ticker.toUpperCase()}.${code}`] : [];
    }),
  [sharesPositions]);

  const cryptoSymbols = useMemo(() =>
    cryptoPositions.map(p => {
      const ccy = !p.currency || p.currency === '0' ? 'USD' : p.currency;
      return `${p.coinSymbol.toUpperCase()}-${ccy}.CC`;
    }),
  [cryptoPositions]);

  const symbolsKey = [...shareSymbols, ...cryptoSymbols].join(',');

  useEffect(() => {
    if (!enabled || !symbolsKey) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/eodhd/live?symbols=${symbolsKey}`)
      .then(r => (r.ok ? r.json() : []))
      .then((data: EodhdLiveResult[]) => {
        if (cancelled) return;

        const today = new Date().toISOString().split('T')[0];

        const newShares: SharesQuote[] = sharesPositions.flatMap(p => {
          const code = EXCHANGE_CODES[p.exchange];
          if (!code) return [];
          const symbol = `${p.ticker.toUpperCase()}.${code}`;
          const match = data.find(d => d.code === symbol);
          if (!match) return [];
          return [{ assetType: 'Shares', ticker: p.ticker.toUpperCase(), exchange: p.exchange, lastClose: match.close, asOf: today }];
        });

        const newCrypto: CryptoQuote[] = cryptoPositions.flatMap(p => {
          const ccy    = !p.currency || p.currency === '0' ? 'USD' : p.currency;
          const symbol = `${p.coinSymbol.toUpperCase()}-${ccy}.CC`;
          const match  = data.find(d => d.code === symbol);
          if (!match) return [];
          return [{ assetType: 'Crypto', coinSymbol: p.coinSymbol.toUpperCase(), lastClose: match.close, asOf: today }];
        });

        setLiveShares(newShares);
        setLiveCrypto(newCrypto);
      })
      .catch(() => {
        if (!cancelled) {
          setLiveShares([]);
          setLiveCrypto([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [enabled, symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { liveShares, liveCrypto, liveLoading: loading };
}

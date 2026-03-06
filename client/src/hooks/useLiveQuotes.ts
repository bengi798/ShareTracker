'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SharesPosition, CryptoPosition } from '@/lib/positions';
import type { CryptoQuote, SharesQuote } from '@/lib/types';

const EXCHANGE_CODES: Record<string, string> = {
  ASX: 'AU', NYSE: 'US', NASDAQ: 'US', LSE: 'LSE', TSX: 'TO',
};

interface EodhdLiveResult {
  code:          string;
  close:         number;
  previousClose: number;
  change:        number;
  change_p:      number;
}

export interface LiveChange {
  change:        number;
  changePercent: number;
}

export function useLiveQuotes(
  sharesPositions: SharesPosition[],
  cryptoPositions: CryptoPosition[],
  enabled: boolean,
) {
  const [liveShares, setLiveShares]               = useState<SharesQuote[]>([]);
  const [liveCrypto, setLiveCrypto]               = useState<CryptoQuote[]>([]);
  const [liveDayChange, setDayChange]             = useState<number | null>(null);
  const [liveChanges, setLiveChanges]             = useState<Map<string, LiveChange>>(new Map());
  const [loading, setLoading]                     = useState(false);

  const shareSymbols = useMemo(() =>
    sharesPositions.flatMap(p => {
      const code = EXCHANGE_CODES[p.exchange];
      return code ? [`${p.ticker.toUpperCase()}.${code}`] : [];
    }),
  [sharesPositions]);

  const cryptoSymbols = useMemo(() =>
    cryptoPositions.map(p => `${p.coinSymbol.toUpperCase()}-USD.CC`),
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
          const symbol = `${p.coinSymbol.toUpperCase()}-USD.CC`;
          const match  = data.find(d => d.code === symbol);
          if (!match) return [];
          return [{ assetType: 'Crypto', coinSymbol: p.coinSymbol.toUpperCase(), lastClose: match.close, asOf: today }];
        });

        // Day change = sum of (close - previousClose) * units for all matched positions
        const sharesDayChange = sharesPositions.reduce((sum, p) => {
          const code = EXCHANGE_CODES[p.exchange];
          if (!code) return sum;
          const match = data.find(d => d.code === `${p.ticker.toUpperCase()}.${code}`);
          if (!match || !match.previousClose) return sum;
          return sum + (match.close - match.previousClose) * p.availableUnits;
        }, 0);

        const cryptoDayChange = cryptoPositions.reduce((sum, p) => {
          const match = data.find(d => d.code === `${p.coinSymbol.toUpperCase()}-USD.CC`);
          if (!match || !match.previousClose) return sum;
          return sum + (match.close - match.previousClose) * p.availableUnits;
        }, 0);

        // Build change lookup map keyed by ticker|exchange (shares) or coinSymbol (crypto)
        const changesMap = new Map<string, LiveChange>();
        sharesPositions.forEach(p => {
          const code = EXCHANGE_CODES[p.exchange];
          if (!code) return;
          const match = data.find(d => d.code === `${p.ticker.toUpperCase()}.${code}`);
          if (match) changesMap.set(`${p.ticker.toUpperCase()}|${p.exchange}`, { change: match.change, changePercent: match.change_p });
        });
        cryptoPositions.forEach(p => {
          const match = data.find(d => d.code === `${p.coinSymbol.toUpperCase()}-USD.CC`);
          if (match) changesMap.set(p.coinSymbol.toUpperCase(), { change: match.change, changePercent: match.change_p });
        });

        setLiveShares(newShares);
        setLiveCrypto(newCrypto);
        setDayChange(sharesDayChange + cryptoDayChange);
        setLiveChanges(changesMap);
      })
      .catch(() => {
        if (!cancelled) {
          setLiveShares([]);
          setLiveCrypto([]);
          setDayChange(null);
          setLiveChanges(new Map());
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [enabled, symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { liveShares, liveCrypto, liveDayChange, liveChanges, liveLoading: loading };
}

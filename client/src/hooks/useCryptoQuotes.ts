'use client';

import { useEffect, useState } from 'react';
import { tradesApi } from '@/lib/api/trades';
import { useAuth } from '@/lib/auth/AuthContext';
import type { CryptoQuote } from '@/lib/types';

export function useCryptoQuotes() {
  const { token } = useAuth();
  const [cryptoQuotes, setQuotes]           = useState<CryptoQuote[]>([]);
  const [cryptoQuotesLoading, setLoading]   = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    tradesApi.getCryptoQuotes(token)
      .then(setQuotes)
      .catch(() => setQuotes([]))  // price failure is non-fatal — UI shows "—"
      .finally(() => setLoading(false));
  }, [token]);

  return { cryptoQuotes, cryptoQuotesLoading };
}

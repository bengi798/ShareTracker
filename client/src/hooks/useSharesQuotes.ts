'use client';

import { useEffect, useState } from 'react';
import { tradesApi } from '@/lib/api/trades';
import { useAuth } from '@/lib/auth/AuthContext';
import type { SharesQuote } from '@/lib/types';

export function useSharesQuotes() {
  const { token } = useAuth();
  const [sharesQuotes, setQuotes]           = useState<SharesQuote[]>([]);
  const [sharesQuotesLoading, setLoading]   = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    tradesApi.getSharesQuotes(token)
      .then(setQuotes)
      .catch(() => setQuotes([]))  // price failure is non-fatal — UI shows "—"
      .finally(() => setLoading(false));
  }, [token]);

  return { sharesQuotes, sharesQuotesLoading };
}

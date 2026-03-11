'use client';

import { useEffect, useState } from 'react';
import { tradesApi } from '@/lib/api/trades';
import { useAuth } from '@/lib/auth/AuthContext';
import type { GoldQuote } from '@/lib/types';

export function useGoldQuotes() {
  const { token } = useAuth();
  const [goldQuotes, setQuotes]         = useState<GoldQuote[]>([]);
  const [goldQuotesLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    tradesApi.getGoldQuotes(token)
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, [token]);

  return { goldQuotes, goldQuotesLoading };
}

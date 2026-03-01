'use client';

import { useCallback, useEffect, useState } from 'react';
import { tradesApi } from '@/lib/api/trades';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Trade } from '@/lib/types';

export function useTrades() {
  const { token } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await tradesApi.getAll(token);
      setTrades(data);
    } catch {
      setError('Failed to load trades.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const removeTrade = useCallback(async (id: string) => {
    if (!token) return;
    await tradesApi.delete(id, token);
    setTrades(prev => prev.filter(t => t.id !== id));
  }, [token]);

  const updateTrade = useCallback((updated: Trade) => {
    setTrades(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  return { trades, loading, error, refetch: fetchTrades, removeTrade, updateTrade };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { portfoliosApi } from '@/lib/api/portfolios';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Portfolio } from '@/lib/types';

export function usePortfolios() {
  const { token } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchPortfolios = useCallback(async () => {
    if (!token) return;
    try {
      if (!initialized.current) setLoading(true);
      const data = await portfoliosApi.getAll(token);
      setPortfolios(data);
      initialized.current = true;
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPortfolios(); }, [fetchPortfolios]);

  const createPortfolio = useCallback(async (name: string): Promise<Portfolio> => {
    const portfolio = await portfoliosApi.create({ name }, token!);
    setPortfolios(prev => [...prev, portfolio]);
    return portfolio;
  }, [token]);

  const updatePortfolio = useCallback(async (id: string, name: string): Promise<Portfolio> => {
    const updated = await portfoliosApi.update(id, { name }, token!);
    setPortfolios(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  }, [token]);

  const deletePortfolio = useCallback(async (id: string, reassignToPortfolioId?: string): Promise<void> => {
    await portfoliosApi.delete(id, token!, reassignToPortfolioId);
    setPortfolios(prev => prev.filter(p => p.id !== id));
  }, [token]);

  return { portfolios, loading, createPortfolio, updatePortfolio, deletePortfolio, refetch: fetchPortfolios };
}

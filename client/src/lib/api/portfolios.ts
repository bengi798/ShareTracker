import { apiFetch } from './client';
import type { Portfolio, CreatePortfolioPayload, UpdatePortfolioPayload } from '@/lib/types';

export const portfoliosApi = {
  getAll: (token: string) =>
    apiFetch<Portfolio[]>('/api/portfolios', { token }),

  create: (payload: CreatePortfolioPayload, token: string) =>
    apiFetch<Portfolio>('/api/portfolios', { method: 'POST', body: payload, token }),

  update: (id: string, payload: UpdatePortfolioPayload, token: string) =>
    apiFetch<Portfolio>(`/api/portfolios/${id}`, { method: 'PUT', body: payload, token }),

  delete: (id: string, token: string, reassignToPortfolioId?: string) => {
    const qs = reassignToPortfolioId ? `?reassignToPortfolioId=${reassignToPortfolioId}` : '';
    return apiFetch<void>(`/api/portfolios/${id}${qs}`, { method: 'DELETE', token });
  },
};

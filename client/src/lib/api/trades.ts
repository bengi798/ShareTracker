import { apiFetch } from './client';
import type {
  Trade,
  SharesQuote,
  CryptoQuote,
  CreateSharesPayload,
  CreateGoldPayload,
  CreateCryptoPayload,
  CreateBondPayload,
  CreatePropertyPayload,
} from '@/lib/types';

export const tradesApi = {
  getAll: (token: string) =>
    apiFetch<Trade[]>('/api/trades', { token }),

  createShares: (payload: CreateSharesPayload, token: string) =>
    apiFetch<Trade>('/api/trades/shares', { method: 'POST', body: payload, token }),

  createGold: (payload: CreateGoldPayload, token: string) =>
    apiFetch<Trade>('/api/trades/gold', { method: 'POST', body: payload, token }),

  createCrypto: (payload: CreateCryptoPayload, token: string) =>
    apiFetch<Trade>('/api/trades/crypto', { method: 'POST', body: payload, token }),

  createBond: (payload: CreateBondPayload, token: string) =>
    apiFetch<Trade>('/api/trades/bonds', { method: 'POST', body: payload, token }),

  createProperty: (payload: CreatePropertyPayload, token: string) =>
    apiFetch<Trade>('/api/trades/property', { method: 'POST', body: payload, token }),

  getSharesQuotes: (token: string) =>
    apiFetch<SharesQuote[]>('/api/trades/shares/quotes', { token }),

  getCryptoQuotes: (token: string) =>
    apiFetch<CryptoQuote[]>('/api/trades/crypto/quotes', { token }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/trades/${id}`, { method: 'DELETE', token }),
};

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
  UpdateSharesPayload,
  UpdateGoldPayload,
  UpdateCryptoPayload,
  UpdateBondPayload,
  UpdatePropertyPayload,
} from '@/lib/types';

export const tradesApi = {
  getAll: (token: string) =>
    apiFetch<Trade[]>('/trades', { token }),

  createShares: (payload: CreateSharesPayload, token: string) =>
    apiFetch<Trade>('/trades/shares', { method: 'POST', body: payload, token }),

  createGold: (payload: CreateGoldPayload, token: string) =>
    apiFetch<Trade>('/trades/gold', { method: 'POST', body: payload, token }),

  createCrypto: (payload: CreateCryptoPayload, token: string) =>
    apiFetch<Trade>('/trades/crypto', { method: 'POST', body: payload, token }),

  createBond: (payload: CreateBondPayload, token: string) =>
    apiFetch<Trade>('/trades/bonds', { method: 'POST', body: payload, token }),

  createProperty: (payload: CreatePropertyPayload, token: string) =>
    apiFetch<Trade>('/trades/property', { method: 'POST', body: payload, token }),

  updateShares: (id: string, payload: UpdateSharesPayload, token: string) =>
    apiFetch<Trade>(`/trades/shares/${id}`, { method: 'PUT', body: payload, token }),

  updateGold: (id: string, payload: UpdateGoldPayload, token: string) =>
    apiFetch<Trade>(`/trades/gold/${id}`, { method: 'PUT', body: payload, token }),

  updateCrypto: (id: string, payload: UpdateCryptoPayload, token: string) =>
    apiFetch<Trade>(`/trades/crypto/${id}`, { method: 'PUT', body: payload, token }),

  updateBond: (id: string, payload: UpdateBondPayload, token: string) =>
    apiFetch<Trade>(`/trades/bonds/${id}`, { method: 'PUT', body: payload, token }),

  updateProperty: (id: string, payload: UpdatePropertyPayload, token: string) =>
    apiFetch<Trade>(`/trades/property/${id}`, { method: 'PUT', body: payload, token }),

  getSharesQuotes: (token: string) =>
    apiFetch<SharesQuote[]>('/trades/shares/quotes', { token }),

  getCryptoQuotes: (token: string) =>
    apiFetch<CryptoQuote[]>('/trades/crypto/quotes', { token }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/trades/${id}`, { method: 'DELETE', token }),
};

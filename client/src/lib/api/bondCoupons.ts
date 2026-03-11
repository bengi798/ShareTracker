import { apiFetch } from './client';

export type BondCouponPayment = {
  id: string;
  bondTradeId: string;
  paymentDate: string;
  amount: number;
  currency: string;
  notes?: string | null;
  createdAt: string;
};

export type CreateBondCouponPaymentRequest = {
  bondTradeId: string;
  paymentDate: string;
  amount: number;
  currency: string;
  notes?: string | null;
};

export const bondCouponsApi = {
  getAll: (token: string) =>
    apiFetch<BondCouponPayment[]>('/api/bond-coupons', { token }),

  create: (data: CreateBondCouponPaymentRequest, token: string) =>
    apiFetch<BondCouponPayment>('/api/bond-coupons', { method: 'POST', body: data, token }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`/api/bond-coupons/${id}`, { method: 'DELETE', token }),
};

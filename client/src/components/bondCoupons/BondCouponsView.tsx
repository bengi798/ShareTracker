'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth/AuthContext';
import { bondCouponsApi, type BondCouponPayment, type CreateBondCouponPaymentRequest } from '@/lib/api/bondCoupons';
import type { Trade } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { FormError } from '@/components/ui/FormError';
import { Spinner } from '@/components/ui/Spinner';
import { CURRENCIES } from '@/lib/types';

type FormValues = {
  bondTradeId: string;
  paymentDate: string;
  amount: string;
  currency: string;
  notes: string;
};

export function BondCouponsView({ trades }: { trades: Trade[] }) {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<BondCouponPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const bondTrades = trades.filter(t => t.assetType === 'Bond' && t.tradeType === 'Buy');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { paymentDate: today, currency: 'AUD' },
  });

  useEffect(() => {
    if (!token) return;
    bondCouponsApi.getAll(token)
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [token]);

  // Auto-fill currency from selected bond trade
  const handleBondSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const trade = bondTrades.find(t => t.id === e.target.value);
    if (trade) setValue('currency', trade.currency ?? 'AUD');
  };

  const onSubmit = async (data: FormValues) => {
    if (!token) return;
    const payload: CreateBondCouponPaymentRequest = {
      bondTradeId: data.bondTradeId,
      paymentDate: data.paymentDate,
      amount: parseFloat(data.amount),
      currency: data.currency,
      notes: data.notes || null,
    };
    const created = await bondCouponsApi.create(payload, token);
    setCoupons(prev => [created, ...prev]);
    setShowForm(false);
    reset({ paymentDate: today, currency: 'AUD' });
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeleting(id);
    try {
      await bondCouponsApi.delete(id, token);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const getBondLabel = (bondTradeId: string) => {
    const t = bondTrades.find(b => b.id === bondTradeId) as any;
    if (!t) return bondTradeId;
    return `${t.bondCode} · ${t.yieldPercent}% · ${t.issuer}`;
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bond coupon income is ordinary income — record payments here to include them in your tax report.
        </p>
        <Button type="button" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add payment'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30 p-4 space-y-4"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">Record coupon payment</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bondTradeId">Bond</Label>
              <Select
                id="bondTradeId"
                {...register('bondTradeId', { required: 'Select a bond.' })}
                onChange={handleBondSelect}
              >
                <option value="">Select bond…</option>
                {bondTrades.map(t => (
                  <option key={t.id} value={t.id}>
                    {getBondLabel(t.id)}
                  </option>
                ))}
              </Select>
              {errors.bondTradeId && <FormError message={errors.bondTradeId.message!} />}
            </div>

            <div>
              <Label htmlFor="paymentDate">Payment date</Label>
              <Input
                id="paymentDate"
                type="date"
                {...register('paymentDate', { required: 'Payment date is required.' })}
              />
              {errors.paymentDate && <FormError message={errors.paymentDate.message!} />}
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('amount', {
                  required: 'Amount is required.',
                  validate: v => parseFloat(v) > 0 || 'Amount must be greater than zero.',
                })}
              />
              {errors.amount && <FormError message={errors.amount.message!} />}
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" {...register('currency', { required: 'Currency is required.' })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              {errors.currency && <FormError message={errors.currency.message!} />}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">
                Notes <span className="font-normal text-gray-400">(optional)</span>
              </Label>
              <Input id="notes" placeholder="e.g. Q1 2026 coupon" {...register('notes')} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" isLoading={isSubmitting}>Save payment</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {coupons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No coupon payments recorded yet.</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Add a payment when you receive interest from a bond.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Bond</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {coupons.map(c => (
                <tr key={c.id} className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {new Date(c.paymentDate).toLocaleDateString('en-AU')}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getBondLabel(c.bondTradeId)}</td>
                  <td className="px-4 py-3 text-right font-medium text-teal-700 dark:text-teal-400 whitespace-nowrap">
                    {c.currency} {c.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                    >
                      {deleting === c.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Running total by currency */}
      {coupons.length > 0 && (() => {
        const byCurrency = coupons.reduce<Record<string, number>>((acc, c) => {
          acc[c.currency] = (acc[c.currency] ?? 0) + c.amount;
          return acc;
        }, {});
        return (
          <div className="flex flex-wrap gap-4">
            {Object.entries(byCurrency).map(([cur, total]) => (
              <div key={cur} className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-4 py-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total ({cur})</p>
                <p className="text-xl font-bold text-teal-700 dark:text-teal-400">
                  {cur} {total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

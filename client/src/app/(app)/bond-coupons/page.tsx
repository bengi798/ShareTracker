'use client';

import { useTrades } from '@/hooks/useTradesApi';
import { BondCouponsView } from '@/components/bondCoupons/BondCouponsView';
import { Spinner } from '@/components/ui/Spinner';

export default function BondCouponsPage() {
  const { trades, loading, error } = useTrades();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bond Coupons</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Record interest/coupon payments received from bonds. These are ordinary income for tax purposes.
        </p>
      </div>

      {loading && <Spinner />}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}
      {!loading && !error && <BondCouponsView trades={trades} />}
    </div>
  );
}

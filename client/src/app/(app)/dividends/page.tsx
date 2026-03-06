'use client';

import { useTrades } from '@/hooks/useTradesApi';
import { DividendsView } from '@/components/dividends/DividendsView';
import { Spinner } from '@/components/ui/Spinner';

export default function DividendsPage() {
  const { trades, loading, error } = useTrades();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dividends</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Dividend history for each share you have owned, including franking credits.
        </p>
      </div>

      {loading && <Spinner />}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}
      {!loading && !error && <DividendsView trades={trades} />}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useTrades } from '@/hooks/useTradesApi';
import { TradeTable } from '@/components/trades/TradeTable';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function TradesPage() {
  const { trades, loading, error, removeTrade, updateTrade } = useTrades();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trades</h1>
        <Link href="/trades/new">
          <Button>+ Add Trade</Button>
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {!loading && !error && (
        <TradeTable trades={trades} onDelete={removeTrade} onUpdate={updateTrade} />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTrades } from '@/hooks/useTradesApi';
import { usePortfolios } from '@/hooks/usePortfolios';
import { TradeTable } from '@/components/trades/TradeTable';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function TradesPage() {
  const { trades, loading, error, removeTrade, updateTrade } = useTrades();
  const { portfolios } = usePortfolios();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  const filteredTrades = selectedPortfolioId !== null
    ? trades.filter(t => t.portfolioId === selectedPortfolioId)
    : trades;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trades</h1>
        <Link href="/trades/new">
          <Button>+ Add Trade</Button>
        </Link>
      </div>

      {/* Portfolio filter */}
      {portfolios.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedPortfolioId(null)}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              selectedPortfolioId === null
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-100 hover:text-black dark:hover:text-white'
            }`}
          >
            All Portfolios
          </button>
          {portfolios.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPortfolioId(p.id)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                selectedPortfolioId === p.id
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-100 hover:text-black dark:hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {!loading && !error && (
        <TradeTable trades={filteredTrades} portfolios={portfolios} onDelete={removeTrade} onUpdate={updateTrade} />
      )}
    </div>
  );
}

'use client';

import { usePortfolios } from '@/hooks/usePortfolios';
import { NewTradeForm } from '@/components/trades/NewTradeForm';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export default function NewTradePage() {
  const { portfolios, loading, createPortfolio } = usePortfolios();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Trade</h1>
      <Card className="p-6">
        <NewTradeForm portfolios={portfolios} onCreatePortfolio={createPortfolio} />
      </Card>
    </div>
  );
}

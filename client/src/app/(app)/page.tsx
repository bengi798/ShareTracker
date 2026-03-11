'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useTrades } from '@/hooks/useTradesApi';
import { usePortfolios } from '@/hooks/usePortfolios';
import { useSharesQuotes } from '@/hooks/useSharesQuotes';
import { useCryptoQuotes } from '@/hooks/useCryptoQuotes';
import { PortfolioView } from '@/components/portfolio/PortfolioView';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth/AuthContext';

export default function PortfolioPage() {
  const { homeCurrency }                                          = useAuth();
  const { user }                                                  = useUser();
  const { trades, loading, error }                                = useTrades();
  const { portfolios, loading: portfoliosLoading, createPortfolio } = usePortfolios();
  const { sharesQuotes, sharesQuotesLoading }                     = useSharesQuotes();
  const { cryptoQuotes, cryptoQuotesLoading }                     = useCryptoQuotes();
  const quotes = [...sharesQuotes, ...cryptoQuotes];
  const quotesLoading = sharesQuotesLoading && cryptoQuotesLoading;

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);

  // Auto-create a default portfolio on first load when user has none
  useEffect(() => {
    if (portfoliosLoading || loading || autoCreating) return;
    if (portfolios.length === 0 && user) {
      setAutoCreating(true);
      const firstName = user.firstName ?? 'My';
      createPortfolio(`${firstName}'s Portfolio`)
        .catch(() => {})
        .finally(() => setAutoCreating(false));
    }
  }, [portfoliosLoading, loading, portfolios.length, user, autoCreating, createPortfolio]);

  const overallLoading = loading || portfoliosLoading;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
        <Link href="/trades/new">
          <Button>+ Add Trade</Button>
        </Link>
      </div>

      {overallLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {!overallLoading && !error && (
        <PortfolioView
          trades={trades}
          quotes={quotes}
          quotesLoading={quotesLoading}
          homeCurrency={homeCurrency ?? 'AUD'}
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolioId}
          onPortfolioChange={setSelectedPortfolioId}
        />
      )}
    </div>
  );
}

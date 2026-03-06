'use client';

import Link from 'next/link';
import { useTrades } from '@/hooks/useTradesApi';
import { useSharesQuotes } from '@/hooks/useSharesQuotes';
import { useCryptoQuotes } from '@/hooks/useCryptoQuotes';
import { PortfolioView } from '@/components/portfolio/PortfolioView';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth/AuthContext';

export default function PortfolioPage() {
  const { homeCurrency }                                = useAuth();
  const { trades, loading, error }                      = useTrades();
  const { sharesQuotes, sharesQuotesLoading }           = useSharesQuotes();
  const { cryptoQuotes, cryptoQuotesLoading }           = useCryptoQuotes();
  const quotes = [...sharesQuotes, ...cryptoQuotes];
  const quotesLoading = sharesQuotesLoading && cryptoQuotesLoading;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
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
        <PortfolioView trades={trades} quotes={quotes} quotesLoading={quotesLoading} homeCurrency={homeCurrency ?? 'AUD'} />
      )}
    </div>
  );
}

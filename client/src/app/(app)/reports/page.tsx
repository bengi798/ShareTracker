'use client';

import { useTrades } from '@/hooks/useTradesApi';
import { ReportsView } from '@/components/reports/ReportsView';
import { PlanGate } from '@/components/reports/PlanGate';
import { Spinner } from '@/components/ui/Spinner';
import { useIsInvestor } from '@/lib/auth/usePlan';

export default function ReportsPage() {
  const { trades, loading, error } = useTrades();
  const isInvestor = useIsInvestor();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Capital gains summary by Australian financial year (1 July – 30 June).
        </p>
      </div>

      {isInvestor === null && <Spinner />}

      {isInvestor === false && <PlanGate />}

      {isInvestor === true && (
        <>
          {loading && <Spinner />}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
          )}
          {!loading && !error && <ReportsView trades={trades} />}
        </>
      )}
    </div>
  );
}

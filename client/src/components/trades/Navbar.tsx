'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useIsInvestor } from '@/lib/auth/usePlan';
import { Button } from '@/components/ui/Button';
import { HowToUseModal } from '@/components/trades/HowToUseModal';

function navLink(active: boolean) {
  return active
    ? 'px-3 py-1.5 text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
    : 'px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white';
}

export function Navbar() {
  const { email, logout } = useAuth();
  const isInvestor = useIsInvestor();
  const router   = useRouter();
  const pathname = usePathname();
  const [showHowToUse, setShowHowToUse] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/sign-in');
  };

  return (
    <>
      <header className="border-b border-gray-900 dark:border-gray-500 bg-[#f5f5f3] dark:bg-[#111111]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold tracking-tight text-black dark:text-white">
              ShareTracker
            </Link>
            <nav className="flex gap-1">
              <Link href="/" className={navLink(pathname === '/')}>
                Portfolio
              </Link>
              <Link href="/trades" className={navLink(pathname.startsWith('/trades'))}>
                Trades
              </Link>
              <Link href="/dividends" className={navLink(pathname.startsWith('/dividends'))}>
                Dividends
              </Link>
              <Link href="/reports" className={navLink(pathname.startsWith('/reports'))}>
                Reports
              </Link>
              {isInvestor === false && (
                <Link href="/pricing" className={navLink(pathname.startsWith('/pricing'))}>
                  Pricing
                </Link>
              )}
              <button
                onClick={() => setShowHowToUse(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
              >
                How to use
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isInvestor && (
              <span className="hidden bg-[#0038a8] px-2.5 py-0.5 text-xs font-semibold text-white sm:inline">
                Investor
              </span>
            )}
            <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">{email}</span>
            <Link
              href="/account"
              className="hidden text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white sm:block"
            >
              Account
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {showHowToUse && <HowToUseModal onClose={() => setShowHowToUse(false)} />}
    </>
  );
}

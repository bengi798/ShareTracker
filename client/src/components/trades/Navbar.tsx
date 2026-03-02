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
    ? 'rounded-md px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700'
    : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900';
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
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              ShareTracker
            </Link>
            <nav className="flex gap-1">
              <Link href="/" className={navLink(pathname === '/')}>
                Portfolio
              </Link>
              <Link href="/trades" className={navLink(pathname.startsWith('/trades'))}>
                Trades
              </Link>
              <Link href="/reports" className={navLink(pathname.startsWith('/reports'))}>
                Reports
              </Link>
              {/* Show Pricing link only for non-investor users */}
              {isInvestor === false && (
                <Link href="/pricing" className={navLink(pathname.startsWith('/pricing'))}>
                  Pricing
                </Link>
              )}
              <button
                onClick={() => setShowHowToUse(true)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                How to use
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Investor plan badge */}
            {isInvestor && (
              <span className="hidden rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 sm:inline">
                Investor
              </span>
            )}
            <span className="hidden text-sm text-gray-500 sm:block">{email}</span>
            <Link
              href="/account"
              className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
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

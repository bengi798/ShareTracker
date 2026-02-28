'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useAuth } from '@/lib/auth/AuthContext';
import { useIsInvestor } from '@/lib/auth/usePlan';
import { CURRENCIES } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function AccountPage() {
  const { token, userId, email, homeCurrency, isForeignResident, isLoading, refreshProfile } = useAuth();
  const isInvestor = useIsInvestor();
  const { openUserProfile } = useClerk();

  const [currencyInput, setCurrencyInput] = useState('AUD');
  const [foreignInput, setForeignInput]   = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess]     = useState(false);

  // Pre-populate form once profile data is available
  useEffect(() => {
    if (homeCurrency !== null) setCurrencyInput(homeCurrency);
    if (isForeignResident !== null) setForeignInput(isForeignResident);
  }, [homeCurrency, isForeignResident]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ homeCurrency: currencyInput, isForeignResident: foreignInput }),
      });

      if (!res.ok) throw new Error();

      setSaveSuccess(true);
      refreshProfile(); // re-sync AuthContext cache with the new values
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile and subscription.</p>
      </div>

      {/* ── Account info ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Account</h2>
        <dl className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{email}</dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="text-gray-500">User ID</dt>
            <dd className="font-mono text-xs text-gray-400">{userId}</dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Manage identity (name, email, security) →
          </button>
        </div>
      </div>

      {/* ── Profile preferences ───────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Profile Preferences</h2>
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div>
            <Label htmlFor="homeCurrency">Home currency</Label>
            <Select
              id="homeCurrency"
              value={currencyInput}
              onChange={e => { setCurrencyInput(e.target.value); setSaveSuccess(false); }}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              Used as the default currency for all trades.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="isForeignResident"
              type="checkbox"
              checked={foreignInput}
              onChange={e => { setForeignInput(e.target.checked); setSaveSuccess(false); }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="isForeignResident" className="text-sm font-medium text-gray-700">
                Foreign resident for tax purposes
              </label>
              <p className="text-xs text-gray-500">
                Non-residents are not entitled to the 50% CGT discount.
              </p>
            </div>
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}

          {saveSuccess && (
            <p className="flex items-center gap-1.5 text-sm text-green-600">
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Preferences saved.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* ── Subscription ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Subscription</h2>

        {isInvestor === null ? (
          <Spinner />
        ) : isInvestor ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                Investor
              </span>
              <span className="text-sm text-gray-500">Capital gains reporting enabled</span>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-700">
              Manage →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                Free
              </span>
              <span className="text-sm text-gray-500">Reports locked</span>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Upgrade to Investor →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

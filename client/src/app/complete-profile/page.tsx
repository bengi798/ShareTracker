'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { CURRENCIES } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function CompleteProfilePage() {
  const { token, homeCurrency, isLoading } = useAuth();
  const router = useRouter();

  const [homeCurrencyInput, setHomeCurrencyInput] = useState('AUD');
  const [isForeignResident, setIsForeignResident] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If profile already exists, redirect to the app
  useEffect(() => {
    if (!isLoading && homeCurrency !== null) {
      router.replace('/');
    }
  }, [isLoading, homeCurrency, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ homeCurrency: homeCurrencyInput, isForeignResident }),
      });

      if (!res.ok) throw new Error('Failed to save profile.');
      router.replace('/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Complete your profile</h1>
        <p className="mb-6 text-sm text-gray-500">
          Tell us a bit about yourself so we can set up your portfolio correctly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="homeCurrency" className="block text-sm font-medium text-gray-700">
              Home currency
            </label>
            <select
              id="homeCurrency"
              value={homeCurrencyInput}
              onChange={e => setHomeCurrencyInput(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="isForeignResident"
              type="checkbox"
              checked={isForeignResident}
              onChange={e => setIsForeignResident(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="isForeignResident" className="text-sm font-medium text-gray-700">
                I am a foreign resident for tax purposes
              </label>
              <p className="text-xs text-gray-500">
                Affects CGT discount eligibility (non-residents are not entitled to the 50% discount).
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Saving…' : 'Save and continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}

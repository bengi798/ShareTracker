'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useAuth } from '@/lib/auth/AuthContext';
import { useIsInvestor } from '@/lib/auth/usePlan';
import { usePortfolios } from '@/hooks/usePortfolios';
import { CURRENCIES } from '@/lib/types';
import type { Portfolio } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type ThemePref = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemePref; label: string;}[] = [
  { value: 'light',  label: 'Light'},
  { value: 'dark',   label: 'Dark'},
  { value: 'system', label: 'System'},
];

// ── Delete portfolio modal ─────────────────────────────────────────────
function DeletePortfolioModal({
  portfolio,
  otherPortfolios,
  onConfirm,
  onCancel,
}: {
  portfolio: Portfolio;
  otherPortfolios: Portfolio[];
  onConfirm: (reassignToId?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [reassignTo, setReassignTo] = useState<string>('');
  const [mode, setMode] = useState<'reassign' | 'delete-trades'>(
    otherPortfolios.length > 0 ? 'reassign' : 'delete-trades'
  );
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(mode === 'reassign' ? (reassignTo || undefined) : undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Delete &ldquo;{portfolio.name}&rdquo;
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          What should happen to the trades in this portfolio?
        </p>

        {otherPortfolios.length > 0 && (
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="deleteMode"
                checked={mode === 'reassign'}
                onChange={() => setMode('reassign')}
                className="mt-0.5 h-4 w-4 text-[#0038a8] focus:ring-[#0038a8]"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Reassign trades to another portfolio</span>
                {mode === 'reassign' && (
                  <select
                    value={reassignTo}
                    onChange={e => setReassignTo(e.target.value)}
                    className="mt-2 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0038a8]"
                  >
                    <option value="">Select portfolio…</option>
                    {otherPortfolios.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="deleteMode"
                checked={mode === 'delete-trades'}
                onChange={() => setMode('delete-trades')}
                className="mt-0.5 h-4 w-4 text-[#0038a8] focus:ring-[#0038a8]"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Delete all trades in this portfolio</span>
            </label>
          </div>
        )}

        {otherPortfolios.length === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            All trades in this portfolio will be deleted as there are no other portfolios to reassign them to.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={handleConfirm}
            isLoading={deleting}
            disabled={mode === 'reassign' && !reassignTo}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            Delete portfolio
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export default function AccountPage() {
  const { token, userId, email, homeCurrency, isForeignResident, themePreference, isLoading, refreshProfile } = useAuth();
  const isInvestor = useIsInvestor();
  const { openUserProfile } = useClerk();
  const { portfolios, loading: portfoliosLoading, createPortfolio, updatePortfolio, deletePortfolio } = usePortfolios();

  const [currencyInput, setCurrencyInput]   = useState('AUD');
  const [foreignInput, setForeignInput]     = useState(false);
  const [themeInput, setThemeInput]         = useState<ThemePref>('system');
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess]       = useState(false);

  // Portfolio state
  const [newPortfolioName, setNewPortfolioName]   = useState('');
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [createError, setCreateError]             = useState<string | null>(null);
  const [editingId, setEditingId]                 = useState<string | null>(null);
  const [editName, setEditName]                   = useState('');
  const [savingEdit, setSavingEdit]               = useState(false);
  const [deletingPortfolio, setDeletingPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    if (homeCurrency !== null) setCurrencyInput(homeCurrency);
    if (isForeignResident !== null) setForeignInput(isForeignResident);
    if (themePreference !== null) setThemeInput((themePreference as ThemePref) ?? 'system');
  }, [homeCurrency, isForeignResident, themePreference]);

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
        body: JSON.stringify({ homeCurrency: currencyInput, isForeignResident: foreignInput, themePreference: themeInput }),
      });

      if (!res.ok) throw new Error();

      setSaveSuccess(true);
      refreshProfile();
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPortfolioName.trim();
    if (!name) return;
    setCreatingPortfolio(true);
    setCreateError(null);
    try {
      await createPortfolio(name);
      setNewPortfolioName('');
    } catch {
      setCreateError('Failed to create portfolio.');
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const startEditing = (p: Portfolio) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setSavingEdit(true);
    try {
      await updatePortfolio(id, name);
      setEditingId(null);
    } catch {
      // ignore — keep editing
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePortfolio = async (reassignToId?: string) => {
    if (!deletingPortfolio) return;
    await deletePortfolio(deletingPortfolio.id, reassignToId);
    setDeletingPortfolio(null);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your profile and subscription.</p>
      </div>

      {/* ── Account info ──────────────────────────────────────────── */}
      <div className="border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Account</h2>
        <dl className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{email}</dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">User ID</dt>
            <dd className="font-mono text-xs text-gray-400 dark:text-gray-500">{userId}</dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="text-sm font-medium text-[#0038a8] hover:text-[#002a80] dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            Manage identity (name, email, security) →
          </button>
        </div>
      </div>

      {/* ── Portfolios ────────────────────────────────────────────── */}
      <div className="border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 p-6">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Portfolios</h2>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Group your trades into named portfolios. Filter by portfolio on the Portfolio and Trades pages.
        </p>

        {portfoliosLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-2">
            {portfolios.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No portfolios yet.</p>
            ) : (
              portfolios.map(p => (
                <div key={p.id} className="flex items-center gap-2 rounded border border-gray-200 dark:border-gray-700 px-3 py-2">
                  {editingId === p.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(p.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0038a8]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(p.id)}
                        disabled={savingEdit || !editName.trim()}
                        className="text-xs font-medium text-[#0038a8] dark:text-blue-400 hover:underline disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => startEditing(p)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Rename"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPortfolio(p)}
                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Create new portfolio */}
            <form onSubmit={handleCreatePortfolio} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newPortfolioName}
                onChange={e => setNewPortfolioName(e.target.value)}
                placeholder="New portfolio name…"
                maxLength={100}
                className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0038a8]"
              />
              <Button type="submit" isLoading={creatingPortfolio} disabled={!newPortfolioName.trim()}>
                Create
              </Button>
            </form>
            {createError && <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>}
          </div>
        )}
      </div>

      {/* ── Profile preferences ───────────────────────────────────── */}
      <div className="border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Profile Preferences</h2>
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used as the default currency for all trades.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="isForeignResident"
              type="checkbox"
              checked={foreignInput}
              onChange={e => { setForeignInput(e.target.checked); setSaveSuccess(false); }}
              className="mt-0.5 h-4 w-4 border-gray-900 text-[#0038a8] focus:ring-[#0038a8]"
            />
            <div>
              <label htmlFor="isForeignResident" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Foreign resident for tax purposes
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Non-residents are not entitled to the 50% CGT discount.
              </p>
            </div>
          </div>

          {/* ── Theme preference ──────────────────────────────────── */}
          <div>
            <Label>Appearance</Label>
            <div className="flex gap-2">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setThemeInput(opt.value); setSaveSuccess(false); }}
                  className={`flex items-center gap-2 border px-4 py-2.5 text-sm font-medium transition-colors ${
                    themeInput === opt.value
                      ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              System follows your device&apos;s dark/light mode setting.
            </p>
          </div>

          {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}

          {saveSuccess && (
            <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
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
      <div className="border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Subscription</h2>

        {isInvestor === null ? (
          <Spinner />
        ) : isInvestor ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-[#0038a8] px-3 py-1 text-sm font-semibold text-white">
                Investor
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Capital gains reporting enabled</span>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Manage →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="border border-gray-400 dark:border-gray-500 px-3 py-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Free
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Reports locked</span>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-[#0038a8] dark:text-blue-400 hover:underline">
              Upgrade to Investor →
            </Link>
          </div>
        )}
      </div>

      {/* ── Delete portfolio modal ─────────────────────────────────── */}
      {deletingPortfolio && (
        <DeletePortfolioModal
          portfolio={deletingPortfolio}
          otherPortfolios={portfolios.filter(p => p.id !== deletingPortfolio.id)}
          onConfirm={handleDeletePortfolio}
          onCancel={() => setDeletingPortfolio(null)}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Trade, AssetType } from '@/lib/types';
import { ASSET_TYPES } from '@/lib/types';
import { TradeRow } from './TradeRow';
import { EditTradeModal } from './EditTradeModal';

type Tab = 'All' | AssetType;

const TABS: Tab[] = ['All', ...ASSET_TYPES];

interface TradeTableProps {
  trades: Trade[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (updated: Trade) => void;
}

export function TradeTable({ trades, onDelete, onUpdate }: TradeTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const filtered = activeTab === 'All' ? trades : trades.filter(t => t.assetType === activeTab);

  const count = (tab: Tab) =>
    tab === 'All' ? trades.length : trades.filter(t => t.assetType === tab).length;

  const handleSaved = (updated: Trade) => {
    onUpdate(updated);
    setEditingTrade(null);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300'
                }`}
              >
                {count(tab)}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
            <p className="text-gray-400 dark:text-gray-500">
              {trades.length === 0
                ? 'No trades yet. Add your first trade to get started.'
                : `No ${activeTab.toLowerCase()} trades.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Asset</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Price/Unit</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(trade => (
                  <TradeRow
                    key={trade.id}
                    trade={trade}
                    onDelete={onDelete}
                    onEdit={setEditingTrade}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

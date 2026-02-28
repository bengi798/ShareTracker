'use client';

import { useState } from 'react';
import type { Trade, AssetType } from '@/lib/types';
import { ASSET_TYPES } from '@/lib/types';
import { TradeRow } from './TradeRow';

type Tab = 'All' | AssetType;

const TABS: Tab[] = ['All', ...ASSET_TYPES];

interface TradeTableProps {
  trades: Trade[];
  onDelete: (id: string) => Promise<void>;
}

export function TradeTable({ trades, onDelete }: TradeTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>('All');

  const filtered = activeTab === 'All' ? trades : trades.filter(t => t.assetType === activeTab);

  const count = (tab: Tab) =>
    tab === 'All' ? trades.length : trades.filter(t => t.assetType === tab).length;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
              }`}
            >
              {count(tab)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">
            {trades.length === 0
              ? 'No trades yet. Add your first trade to get started.'
              : `No ${activeTab.toLowerCase()} trades.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
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
                <TradeRow key={trade.id} trade={trade} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Trade } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const ASSET_BADGE: Record<Trade['assetType'], string> = {
  Shares:   'border border-gray-900 dark:border-gray-400 text-gray-900 dark:text-gray-300',
  Gold:     'border border-gray-900 dark:border-gray-400 text-gray-900 dark:text-gray-300',
  Crypto:   'border border-gray-900 dark:border-gray-400 text-gray-900 dark:text-gray-300',
  Bond:     'border border-gray-900 dark:border-gray-400 text-gray-900 dark:text-gray-300',
  Property: 'border border-gray-900 dark:border-gray-400 text-gray-900 dark:text-gray-300',
};

function tradeDescription(trade: Trade): string {
  switch (trade.assetType) {
    case 'Shares':
      return `${trade.ticker} · ${trade.exchange}`;
    case 'Gold':
      return `${trade.purityCarats}K · ${trade.weightUnit === 'TroyOunces' ? 'Troy Oz' : trade.weightUnit}`;
    case 'Crypto':
      return trade.network ? `${trade.coinSymbol} · ${trade.network}` : trade.coinSymbol;
    case 'Bond':
      return `${trade.bondCode} · ${trade.yieldPercent}% · ${trade.issuer}`;
    case 'Property':
      return `${trade.address} · ${trade.propertyType}`;
  }
}

interface TradeRowProps {
  trade: Trade;
  onDelete: (id: string) => Promise<void>;
  onEdit: (trade: Trade) => void;
}

export function TradeRow({ trade, onDelete, onEdit }: TradeRowProps) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setShowConfirm(false);
    try {
      await onDelete(trade.id);
    } finally {
      setDeleting(false);
    }
  };

  const typeColour = trade.tradeType === 'Buy'
    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
    : 'border border-gray-900 dark:border-gray-400 text-gray-900 dark:text-gray-300';

  return (
    <>
      <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800/60">
        <td className="px-4 py-3">
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${ASSET_BADGE[trade.assetType]}`}>
            {trade.assetType}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tradeDescription(trade)}</td>
        <td className="px-4 py-3">
          <span className={`inline-block px-2 py-0.5 text-xs font-medium ${typeColour}`}>
            {trade.tradeType}
          </span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{trade.numberOfUnits}</td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
          ${trade.pricePerUnit.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-white">
          ${trade.totalValue.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{trade.dateOfTrade}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => onEdit(trade)} className="text-xs px-2 py-1">
              Edit
            </Button>
            <Button variant="danger" isLoading={deleting} onClick={() => setShowConfirm(true)} className="text-xs px-2 py-1">
              Delete
            </Button>
          </div>
        </td>
      </tr>

      {showConfirm && (
        <tr>
          <td colSpan={8}>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setShowConfirm(false)}
            >
              <div
                className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-gray-900 dark:border-gray-500 p-6"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Delete trade?</h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  This will permanently delete this {trade.assetType} trade from {trade.dateOfTrade}. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" isLoading={deleting} onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

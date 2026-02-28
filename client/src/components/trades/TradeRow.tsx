'use client';

import { useState } from 'react';
import type { Trade } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const ASSET_BADGE: Record<Trade['assetType'], string> = {
  Shares:   'bg-blue-100   text-blue-700',
  Gold:     'bg-amber-100  text-amber-700',
  Crypto:   'bg-purple-100 text-purple-700',
  Bond:     'bg-teal-100   text-teal-700',
  Property: 'bg-orange-100 text-orange-700',
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
}

export function TradeRow({ trade, onDelete }: TradeRowProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete this ${trade.assetType} trade from ${trade.dateOfTrade}?`)) return;
    setDeleting(true);
    try {
      await onDelete(trade.id);
    } finally {
      setDeleting(false);
    }
  };

  const typeColour = trade.tradeType === 'Buy' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50';

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ASSET_BADGE[trade.assetType]}`}>
          {trade.assetType}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-700">{tradeDescription(trade)}</td>
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColour}`}>
          {trade.tradeType}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{trade.numberOfUnits}</td>
      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
        ${trade.pricePerUnit.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
        ${trade.totalValue.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-gray-500">{trade.dateOfTrade}</td>
      <td className="px-4 py-3 text-right">
        <Button variant="danger" isLoading={deleting} onClick={handleDelete} className="text-xs px-2 py-1">
          Delete
        </Button>
      </td>
    </tr>
  );
}

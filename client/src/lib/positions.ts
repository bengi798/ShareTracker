import type { Trade, Exchange, WeightUnit, PropertyType } from './types';

// ── Base ──────────────────────────────────────────────────────────────
export interface PositionBase {
  availableUnits: number;
  avgCostPerUnit: number;  // weighted average buy price
  totalCost:      number;  // avgCostPerUnit * availableUnits
  currency:       string;  // USD, EUR, etc. (for display only, not used in calculations)
}

// ── Per-asset position types ──────────────────────────────────────────
export interface SharesPosition extends PositionBase {
  key:       string;
  assetType: 'Shares';
  ticker:    string;
  exchange:  Exchange;
}

export interface GoldPosition extends PositionBase {
  key:          string;
  assetType:    'Gold';
  purityCarats: number;
  weightUnit:   WeightUnit;
}

export interface CryptoPosition extends PositionBase {
  key:        string;
  assetType:  'Crypto';
  coinSymbol: string;
}

export interface BondPosition extends PositionBase {
  key:          string;
  assetType:    'Bond';
  bondCode:     string;
  yieldPercent: number;
  maturityDate: string;
  issuer:       string;
}

export interface PropertyPosition extends PositionBase {
  key:          string;
  assetType:    'Property';
  address:      string;
  propertyType: PropertyType;
}

export type Position =
  | SharesPosition
  | GoldPosition
  | CryptoPosition
  | BondPosition
  | PropertyPosition;

export interface AllPositions {
  shares:   SharesPosition[];
  gold:     GoldPosition[];
  crypto:   CryptoPosition[];
  bonds:    BondPosition[];
  property: PropertyPosition[];
}

// ── Internal accumulator (tracks buy totals separately) ───────────────
interface Accumulator {
  netUnits:    number;
  sumBuyUnits: number;
  sumBuyValue: number;
  currency:    string;
}

// ── computePositions ──────────────────────────────────────────────────
export function computePositions(trades: Trade[]): AllPositions {
  // --- Shares ---
  const sharesAcc   = new Map<string, Accumulator & { ticker: string; exchange: Exchange }>();
  // --- Gold ---
  const goldAcc     = new Map<string, Accumulator & { purityCarats: number; weightUnit: WeightUnit }>();
  // --- Crypto ---
  const cryptoAcc   = new Map<string, Accumulator & { coinSymbol: string }>();
  // --- Bond ---
  const bondsAcc    = new Map<string, Accumulator & { bondCode: string; yieldPercent: number; maturityDate: string; issuer: string }>();
  // --- Property ---
  const propertyAcc = new Map<string, Accumulator & { address: string; propertyType: PropertyType }>();

  for (const trade of trades) {
    const isBuy  = trade.tradeType === 'Buy';
    const units  = trade.numberOfUnits;
    const value  = trade.pricePerUnit * units;

    switch (trade.assetType) {
      case 'Shares': {
        const key  = `${trade.ticker.toUpperCase()}|${trade.exchange}`;
        const prev = sharesAcc.get(key) ?? { ticker: trade.ticker, exchange: trade.exchange, currency: trade.currency, netUnits: 0, sumBuyUnits: 0, sumBuyValue: 0 };
        sharesAcc.set(key, {
          ...prev,
          netUnits:    prev.netUnits    + (isBuy ? units : -units),
          sumBuyUnits: prev.sumBuyUnits + (isBuy ? units : 0),
          sumBuyValue: prev.sumBuyValue + (isBuy ? value : 0),
          currency:    trade.currency,
        });
        break;
      }
      case 'Gold': {
        const key  = `${trade.purityCarats}|${trade.weightUnit}`;
        const prev = goldAcc.get(key) ?? { purityCarats: trade.purityCarats, weightUnit: trade.weightUnit, currency: trade.currency, netUnits: 0, sumBuyUnits: 0, sumBuyValue: 0 };
        goldAcc.set(key, {
          ...prev,
          netUnits:    prev.netUnits    + (isBuy ? units : -units),
          sumBuyUnits: prev.sumBuyUnits + (isBuy ? units : 0),
          sumBuyValue: prev.sumBuyValue + (isBuy ? value : 0),
          currency:    trade.currency,
        });
        break;
      }
      case 'Crypto': {
        const key  = trade.coinSymbol.toUpperCase();
        const prev = cryptoAcc.get(key) ?? { coinSymbol: trade.coinSymbol, currency: trade.currency, netUnits: 0, sumBuyUnits: 0, sumBuyValue: 0 };
        cryptoAcc.set(key, {
          ...prev,
          netUnits:    prev.netUnits    + (isBuy ? units : -units),
          sumBuyUnits: prev.sumBuyUnits + (isBuy ? units : 0),
          sumBuyValue: prev.sumBuyValue + (isBuy ? value : 0),
          currency:    trade.currency,
        });
        break;
      }
      case 'Bond': {
        const key  = trade.bondCode.toUpperCase();
        const prev = bondsAcc.get(key) ?? { bondCode: trade.bondCode, yieldPercent: trade.yieldPercent, maturityDate: trade.maturityDate, issuer: trade.issuer, currency: trade.currency, netUnits: 0, sumBuyUnits: 0, sumBuyValue: 0 };
        bondsAcc.set(key, {
          ...prev,
          netUnits:    prev.netUnits    + (isBuy ? units : -units),
          sumBuyUnits: prev.sumBuyUnits + (isBuy ? units : 0),
          sumBuyValue: prev.sumBuyValue + (isBuy ? value : 0),
          currency:    trade.currency,
        });
        break;
      }
      case 'Property': {
        const key  = trade.address.toLowerCase();
        const prev = propertyAcc.get(key) ?? { address: trade.address, propertyType: trade.propertyType, currency: trade.currency, netUnits: 0, sumBuyUnits: 0, sumBuyValue: 0 };
        propertyAcc.set(key, {
          ...prev,
          netUnits:    prev.netUnits    + (isBuy ? units : -units),
          sumBuyUnits: prev.sumBuyUnits + (isBuy ? units : 0),
          sumBuyValue: prev.sumBuyValue + (isBuy ? value : 0),
          currency:    trade.currency,
        });
        break;
      }
    }
  }

  function toBase(acc: Accumulator): PositionBase {
    const avgCostPerUnit = acc.sumBuyUnits > 0 ? acc.sumBuyValue / acc.sumBuyUnits : 0;
    return {
      availableUnits: acc.netUnits,
      avgCostPerUnit,
      totalCost: avgCostPerUnit * acc.netUnits,
      currency: acc.currency,
    };
  }

  return {
    shares: Array.from(sharesAcc.entries())
      .filter(([, a]) => a.netUnits > 0)
      .map(([key, a]) => ({ key, assetType: 'Shares', ticker: a.ticker, exchange: a.exchange, ...toBase(a) })),

    gold: Array.from(goldAcc.entries())
      .filter(([, a]) => a.netUnits > 0)
      .map(([key, a]) => ({ key, assetType: 'Gold', purityCarats: a.purityCarats, weightUnit: a.weightUnit, ...toBase(a) })),

    crypto: Array.from(cryptoAcc.entries())
      .filter(([, a]) => a.netUnits > 0)
      .map(([key, a]) => ({ key, assetType: 'Crypto', coinSymbol: a.coinSymbol, ...toBase(a) })),

    bonds: Array.from(bondsAcc.entries())
      .filter(([, a]) => a.netUnits > 0)
      .map(([key, a]) => ({ key, assetType: 'Bond', bondCode: a.bondCode, yieldPercent: a.yieldPercent, maturityDate: a.maturityDate, issuer: a.issuer, ...toBase(a) })),

    property: Array.from(propertyAcc.entries())
      .filter(([, a]) => a.netUnits > 0)
      .map(([key, a]) => ({ key, assetType: 'Property', address: a.address, propertyType: a.propertyType, ...toBase(a) })),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────
export function totalCostBasis(positions: AllPositions): number {
  const all: Position[] = [
    ...positions.shares,
    ...positions.gold,
    ...positions.crypto,
    ...positions.bonds,
    ...positions.property,
  ];
  return all.reduce((sum, p) => sum + p.totalCost, 0);
}

export function hasAnyPosition(positions: AllPositions): boolean {
  return (
    positions.shares.length > 0 ||
    positions.gold.length > 0 ||
    positions.crypto.length > 0 ||
    positions.bonds.length > 0 ||
    positions.property.length > 0
  );
}

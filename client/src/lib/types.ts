// ── Enums ────────────────────────────────────────────────────────────
export type AssetType    = 'Shares' | 'Gold' | 'Crypto' | 'Bond' | 'Property';
export type TradeType    = 'Buy' | 'Sell';
export type Exchange     = 'NYSE' | 'NASDAQ' | 'ASX' | 'LSE' | 'TSX' | 'Other';
export type WeightUnit   = 'Grams' | 'TroyOunces' | 'Tolas';
export type PropertyType = 'Residential' | 'Commercial' | 'Land' | 'Industrial';

export const ASSET_TYPES: AssetType[]       = ['Shares', 'Gold', 'Crypto', 'Bond', 'Property'];
export const TRADE_TYPES: TradeType[]       = ['Buy', 'Sell'];
export const EXCHANGES: Exchange[]          = ['NYSE', 'NASDAQ', 'ASX', 'LSE', 'TSX', 'Other'];
export const WEIGHT_UNITS: WeightUnit[]     = ['Grams', 'TroyOunces', 'Tolas'];
export const PROPERTY_TYPES: PropertyType[] = ['Residential', 'Commercial', 'Land', 'Industrial'];
export const CURRENCIES: string[]              = ['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'Other'];
export const VALID_PURITY_CARATS            = [9, 14, 18, 22, 24] as const;

// ── Portfolio ─────────────────────────────────────────────────────────
export interface Portfolio {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreatePortfolioPayload { name: string; }
export interface UpdatePortfolioPayload { name: string; }

// ── Polymorphic Trade (matches backend [JsonPolymorphic]) ─────────────
interface TradeBase {
  id: string;
  assetType: AssetType;
  pricePerUnit: number;
  numberOfUnits: number;
  totalValue: number;
  tradeType: TradeType;
  dateOfTrade: string;
  createdAt: string;
  currency: string;
  isForeignTrade: boolean;
  exchangeRateApplied: boolean;
  exchangeRate: number | null;
  totalCostHome: number | null;
  portfolioId: string | null;
}

export interface SharesTrade extends TradeBase {
  assetType: 'Shares';
  ticker: string;
  exchange: Exchange;
  brokerageFees?: number | null;
}

export interface GoldTrade extends TradeBase {
  assetType: 'Gold';
  purityCarats: number;
  weightUnit: WeightUnit;
}

export interface CryptoTrade extends TradeBase {
  assetType: 'Crypto';
  coinSymbol: string;
  network?: string | null;
  brokerageFees?: number | null;
}

export interface BondTrade extends TradeBase {
  assetType: 'Bond';
  bondCode: string;
  yieldPercent: number;
  maturityDate: string;
  issuer: string;
}

export interface PropertyTrade extends TradeBase {
  assetType: 'Property';
  address: string;
  propertyType: PropertyType;
}

export type Trade = SharesTrade | GoldTrade | CryptoTrade | BondTrade | PropertyTrade;

// ── Create payloads (one per endpoint) ───────────────────────────────
interface CreateBase {
  tradeType: TradeType;
  pricePerUnit: number;
  numberOfUnits: number;
  dateOfTrade: string;
  currency: string;
  isForeignTrade: boolean;
  exchangeRate: number | null;
  totalCostHome?: number | null;
  portfolioId?: string | null;
}

export interface CreateSharesPayload extends CreateBase {
  ticker: string;
  exchange: Exchange;
  brokerageFees?: number | null;
}

export interface CreateGoldPayload extends CreateBase {
  purityCarats: number;
  weightUnit: WeightUnit;
}

export interface CreateCryptoPayload extends CreateBase {
  coinSymbol: string;
  network?: string;
  brokerageFees?: number | null;
}

export interface CreateBondPayload extends CreateBase {
  bondCode: string;
  yieldPercent: number;
  maturityDate: string;
  issuer: string;
}

export interface CreatePropertyPayload extends CreateBase {
  address: string;
  propertyType: PropertyType;
}

// ── Update payloads (same as Create but without tradeType) ───────────
interface UpdateBase {
  pricePerUnit: number;
  numberOfUnits: number;
  dateOfTrade: string;
  currency: string;
  isForeignTrade: boolean;
  exchangeRate: number | null;
  totalCostHome?: number | null;
  portfolioId?: string | null;
}

export interface UpdateSharesPayload extends UpdateBase {
  ticker: string;
  exchange: Exchange;
  brokerageFees?: number | null;
}

export interface UpdateGoldPayload extends UpdateBase {
  purityCarats: number;
  weightUnit: WeightUnit;
}

export interface UpdateCryptoPayload extends UpdateBase {
  coinSymbol: string;
  network?: string;
  brokerageFees?: number | null;
}

export interface UpdateBondPayload extends UpdateBase {
  bondCode: string;
  yieldPercent: number;
  maturityDate: string;
  issuer: string;
}

export interface UpdatePropertyPayload extends UpdateBase {
  address: string;
  propertyType: PropertyType;
}

// ── Market data (discriminated union, mirrors Trade pattern) ──────────
// Shared fields — not exported; use Quote instead
interface QuoteBase {
  lastClose: number | null;
  asOf:      string | null; // "YYYY-MM-DD" or null if unavailable
}

export interface SharesQuote extends QuoteBase {
  assetType: 'Shares';    // discriminant
  ticker:    string;
  exchange:  string;       // e.g. "NASDAQ", "NYSE"
}

export interface CryptoQuote extends QuoteBase {
  assetType: 'Crypto';    // discriminant
  coinSymbol: string;
}

// Extend here as new asset-type quote sources are added
export type Quote = SharesQuote | CryptoQuote;

// ── Auth ──────────────────────────────────────────────────────────────
export interface AuthResult {
  userId:       string;
  email:        string;
  token:        string;
  homeCurrency: string;
}

export interface ApiValidationError {
  errors: Record<string, string[]>;
}

export interface ApiMessageError {
  message: string;
}

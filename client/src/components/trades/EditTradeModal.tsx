'use client';

import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { tradesApi } from '@/lib/api/trades';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import type {
  Trade, Exchange, WeightUnit, PropertyType, ApiValidationError,
} from '@/lib/types';
import {
  EXCHANGES, WEIGHT_UNITS, PROPERTY_TYPES, VALID_PURITY_CARATS, CURRENCIES,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { FormError } from '@/components/ui/FormError';

// ── Types ──────────────────────────────────────────────────────────────
type BrokerageFeeMode = 'dollar' | 'percent';

type EditFormValues = {
  pricePerUnit: string;
  numberOfUnits: string;
  dateOfTrade: string;
  currency: string;
  isForeignTrade: boolean;
  exchangeRate: string;
  // Shares
  ticker?: string;
  exchange?: Exchange;
  // Gold
  purityCarats?: string;
  weightUnit?: WeightUnit;
  // Crypto
  coinSymbol?: string;
  network?: string;
  // Bond
  bondCode?: string;
  yieldPercent?: string;
  maturityDate?: string;
  issuer?: string;
  // Property
  address?: string;
  propertyType?: PropertyType;
  // Brokerage (Shares + Crypto only)
  brokerageFeeMode?: BrokerageFeeMode;
  brokerageFeeDollar?: string;
  brokerageFeePercent?: string;
};

// ── Pre-fill form from existing trade ─────────────────────────────────
function buildDefaultValues(trade: Trade): EditFormValues {
  const base: EditFormValues = {
    pricePerUnit:   String(trade.pricePerUnit),
    numberOfUnits:  String(trade.numberOfUnits),
    dateOfTrade:    trade.dateOfTrade,
    currency:       trade.isForeignTrade ? trade.currency : '',
    isForeignTrade: trade.isForeignTrade,
    exchangeRate:   trade.exchangeRate != null ? String(trade.exchangeRate) : '',
    brokerageFeeMode: 'dollar',
  };

  switch (trade.assetType) {
    case 'Shares':
      return {
        ...base,
        ticker:            trade.ticker,
        exchange:          trade.exchange,
        brokerageFeeDollar: trade.brokerageFees != null ? String(trade.brokerageFees) : '',
      };
    case 'Gold':
      return { ...base, purityCarats: String(trade.purityCarats), weightUnit: trade.weightUnit };
    case 'Crypto':
      return {
        ...base,
        coinSymbol:        trade.coinSymbol,
        network:           trade.network ?? '',
        brokerageFeeDollar: trade.brokerageFees != null ? String(trade.brokerageFees) : '',
      };
    case 'Bond':
      return {
        ...base,
        bondCode:     trade.bondCode,
        yieldPercent: String(trade.yieldPercent),
        maturityDate: trade.maturityDate,
        issuer:       trade.issuer,
      };
    case 'Property':
      return { ...base, address: trade.address, propertyType: trade.propertyType };
  }
}

// ── Brokerage sub-component ────────────────────────────────────────────
const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  Grams: 'Grams', TroyOunces: 'Troy Ounces', Tolas: 'Tolas',
};

function BrokerageFeeSection({
  register, control, setValue, errors, tradeTotal,
}: {
  register: UseFormRegister<EditFormValues>;
  control: Control<EditFormValues>;
  setValue: UseFormSetValue<EditFormValues>;
  errors: FieldErrors<EditFormValues>;
  tradeTotal: number;
}) {
  const mode = (useWatch({ control, name: 'brokerageFeeMode' }) ?? 'dollar') as BrokerageFeeMode;
  const pctRaw = useWatch({ control, name: 'brokerageFeePercent' });

  const calculatedDollar = useMemo(() => {
    if (mode !== 'percent') return null;
    const pct = parseFloat(pctRaw ?? '');
    if (!pct || tradeTotal <= 0) return null;
    return Math.round(tradeTotal * (pct / 100) * 100) / 100;
  }, [mode, pctRaw, tradeTotal]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="mb-0">
          Brokerage fee <span className="font-normal text-gray-400">(optional)</span>
        </Label>
        <div className="flex rounded border border-gray-300 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => { setValue('brokerageFeeMode', 'dollar'); setValue('brokerageFeePercent', ''); }}
            className={`px-3 py-1 transition-colors ${mode === 'dollar' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            $ Dollar
          </button>
          <button
            type="button"
            onClick={() => { setValue('brokerageFeeMode', 'percent'); setValue('brokerageFeeDollar', ''); }}
            className={`px-3 py-1 border-l border-gray-300 transition-colors ${mode === 'percent' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            % Percent
          </button>
        </div>
      </div>
      <input type="hidden" {...register('brokerageFeeMode')} />
      {mode === 'dollar' ? (
        <div className="max-w-xs">
          <Input
            type="number" step="0.01" min="0" placeholder="e.g. 9.95"
            {...register('brokerageFeeDollar', {
              validate: v => !v || parseFloat(v) >= 0 || 'Brokerage fee cannot be negative.',
            })}
          />
          {errors.brokerageFeeDollar && <FormError message={errors.brokerageFeeDollar.message!} />}
        </div>
      ) : (
        <div className="max-w-xs">
          <Input
            type="number" step="0.01" min="0" max="100" placeholder="e.g. 0.50"
            {...register('brokerageFeePercent', {
              validate: v => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 100) || 'Percentage must be between 0 and 100.',
            })}
          />
          {errors.brokerageFeePercent && <FormError message={errors.brokerageFeePercent.message!} />}
          {calculatedDollar !== null && (
            <p className="mt-1 text-xs text-gray-500">≈ ${calculatedDollar.toFixed(2)} brokerage</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────────────
const ASSET_BADGE: Record<Trade['assetType'], string> = {
  Shares:   'bg-blue-100   text-blue-700',
  Gold:     'bg-amber-100  text-amber-700',
  Crypto:   'bg-purple-100 text-purple-700',
  Bond:     'bg-teal-100   text-teal-700',
  Property: 'bg-orange-100 text-orange-700',
};

const ASSET_SECTION_BORDER: Record<Trade['assetType'], string> = {
  Shares:   'border-blue-100   bg-blue-50',
  Gold:     'border-amber-100  bg-amber-50',
  Crypto:   'border-purple-100 bg-purple-50',
  Bond:     'border-teal-100   bg-teal-50',
  Property: 'border-orange-100 bg-orange-50',
};

const BROKERAGE_DIVIDER: Record<'Shares' | 'Crypto', string> = {
  Shares: 'border-blue-200',
  Crypto: 'border-purple-200',
};

// ── Main component ─────────────────────────────────────────────────────
interface EditTradeModalProps {
  trade: Trade;
  onClose: () => void;
  onSaved: (updated: Trade) => void;
}

export function EditTradeModal({ trade, onClose, onSaved }: EditTradeModalProps) {
  const { token, homeCurrency } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const isPropertyBuy = trade.assetType === 'Property' && trade.tradeType === 'Buy';
  const hasBrokerage  = trade.assetType === 'Shares' || trade.assetType === 'Crypto';

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EditFormValues>({ defaultValues: buildDefaultValues(trade) });

  const isForeignTrade    = useWatch({ control, name: 'isForeignTrade' }) ?? false;
  const currency          = useWatch({ control, name: 'currency' }) ?? '';
  const pricePerUnitRaw   = useWatch({ control, name: 'pricePerUnit' });
  const numberOfUnitsRaw  = useWatch({ control, name: 'numberOfUnits' });

  const tradeTotal = useMemo(() => {
    const p = parseFloat(pricePerUnitRaw ?? '');
    const u = isPropertyBuy ? 1 : parseFloat(numberOfUnitsRaw ?? '');
    return isNaN(p) || isNaN(u) ? 0 : p * u;
  }, [pricePerUnitRaw, numberOfUnitsRaw, isPropertyBuy]);

  const onSubmit = async (data: EditFormValues) => {
    const numberOfUnits = isPropertyBuy ? 1 : parseFloat(data.numberOfUnits);
    const total         = parseFloat(data.pricePerUnit) * numberOfUnits;

    let brokerageFees: number | null = null;
    if (hasBrokerage) {
      if (data.brokerageFeeMode === 'percent') {
        const pct = parseFloat(data.brokerageFeePercent ?? '');
        brokerageFees = pct > 0 && total > 0 ? Math.round(total * (pct / 100) * 100) / 100 : null;
      } else {
        const v = parseFloat(data.brokerageFeeDollar ?? '');
        brokerageFees = v > 0 ? v : null;
      }
    }

    const common = {
      pricePerUnit:  parseFloat(data.pricePerUnit),
      numberOfUnits,
      dateOfTrade:   data.dateOfTrade,
      currency:      data.isForeignTrade ? data.currency : (homeCurrency ?? 'AUD'),
      isForeignTrade: data.isForeignTrade,
      exchangeRate:  data.isForeignTrade ? parseFloat(data.exchangeRate) : null,
    };

    try {
      let updated: Trade;

      switch (trade.assetType) {
        case 'Shares':
          updated = await tradesApi.updateShares(trade.id, {
            ...common,
            ticker:        (data.ticker ?? trade.ticker).toUpperCase(),
            exchange:      (data.exchange ?? trade.exchange) as Exchange,
            brokerageFees,
          }, token!);
          break;

        case 'Gold':
          updated = await tradesApi.updateGold(trade.id, {
            ...common,
            purityCarats: parseInt(data.purityCarats ?? String(trade.purityCarats)),
            weightUnit:   (data.weightUnit ?? trade.weightUnit) as WeightUnit,
          }, token!);
          break;

        case 'Crypto':
          updated = await tradesApi.updateCrypto(trade.id, {
            ...common,
            coinSymbol:   data.coinSymbol ?? trade.coinSymbol,
            network:      data.network || undefined,
            brokerageFees,
          }, token!);
          break;

        case 'Bond':
          updated = await tradesApi.updateBond(trade.id, {
            ...common,
            bondCode:     data.bondCode    ?? trade.bondCode,
            yieldPercent: parseFloat(data.yieldPercent ?? String(trade.yieldPercent)),
            maturityDate: data.maturityDate ?? trade.maturityDate,
            issuer:       data.issuer       ?? trade.issuer,
          }, token!);
          break;

        case 'Property':
          updated = await tradesApi.updateProperty(trade.id, {
            ...common,
            address:      data.address      ?? trade.address,
            propertyType: (data.propertyType ?? trade.propertyType) as PropertyType,
          }, token!);
          break;
      }

      onSaved(updated!);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = err.body as ApiValidationError;
        Object.entries(body?.errors ?? {}).forEach(([key, messages]) => {
          const field = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof EditFormValues;
          setError(field, { message: messages[0] ?? 'Invalid value.' });
        });
      } else {
        setError('root' as keyof EditFormValues, { message: 'Failed to update trade. Please try again.' });
      }
    }
  };

  return (
    // Backdrop — clicking outside closes the modal
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative mb-10 w-full max-w-2xl rounded-xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ASSET_BADGE[trade.assetType]}`}>
              {trade.assetType}
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Edit Trade</h2>
            <span className={`text-sm font-medium ${trade.tradeType === 'Buy' ? 'text-green-700' : 'text-red-600'}`}>
              ({trade.tradeType})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {(errors as Record<string, { message?: string }>).root && (
            <div className="rounded-md bg-red-50 p-3">
              <FormError message={(errors as Record<string, { message?: string }>).root.message!} />
            </div>
          )}

          {/* Trade date */}
          <div className="max-w-xs">
            <Label htmlFor="edit-dateOfTrade">Trade date</Label>
            <Input
              id="edit-dateOfTrade"
              type="date"
              max={today}
              {...register('dateOfTrade', {
                required: 'Trade date is required.',
                validate: v => v <= today || 'Trade date cannot be in the future.',
              })}
            />
            {errors.dateOfTrade && <FormError message={errors.dateOfTrade.message!} />}
          </div>

          {/* Price + Units */}
          <div className={`grid gap-5 ${isPropertyBuy ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
            <div>
              <Label htmlFor="edit-pricePerUnit">
                {trade.assetType === 'Property' ? 'Purchase price' : 'Price per unit'}
              </Label>
              <Input
                id="edit-pricePerUnit"
                type="number"
                step={trade.assetType === 'Property' ? '10000' : 'any'}
                min="0"
                placeholder="$0.00"
                {...register('pricePerUnit', {
                  required: 'Price per unit is required.',
                  validate: v => parseFloat(v) > 0 || 'Price must be greater than zero.',
                })}
              />
              {errors.pricePerUnit && <FormError message={errors.pricePerUnit.message!} />}
            </div>
            {!isPropertyBuy && (
              <div>
                <Label htmlFor="edit-numberOfUnits">Number of units</Label>
                <Input
                  id="edit-numberOfUnits"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  {...register('numberOfUnits', {
                    required: 'Number of units is required.',
                    validate: v => parseFloat(v) > 0 || 'Units must be greater than zero.',
                  })}
                />
                {errors.numberOfUnits && <FormError message={errors.numberOfUnits.message!} />}
              </div>
            )}
          </div>

          {/* ── Asset-specific fields ─────────────────────────────── */}
          {trade.assetType === 'Shares' && (
            <div className={`rounded-lg border p-4 ${ASSET_SECTION_BORDER['Shares']}`}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-ticker">Ticker symbol</Label>
                  <Input
                    id="edit-ticker"
                    placeholder="e.g. AAPL"
                    {...register('ticker', {
                      required: 'Ticker is required.',
                      maxLength: { value: 10, message: 'Ticker must be 10 characters or fewer.' },
                      pattern: { value: /^[A-Za-z0-9.]+$/, message: 'Ticker must be alphanumeric.' },
                    })}
                  />
                  {errors.ticker && <FormError message={errors.ticker.message!} />}
                </div>
                <div>
                  <Label htmlFor="edit-exchange">Exchange</Label>
                  <Select id="edit-exchange" {...register('exchange', { required: 'Exchange is required.' })}>
                    <option value="">Select exchange…</option>
                    {EXCHANGES.map(e => <option key={e} value={e}>{e}</option>)}
                  </Select>
                  {errors.exchange && <FormError message={errors.exchange.message!} />}
                </div>
              </div>
              <div className={`mt-4 pt-4 border-t ${BROKERAGE_DIVIDER['Shares']}`}>
                <BrokerageFeeSection
                  register={register} control={control} setValue={setValue}
                  errors={errors} tradeTotal={tradeTotal}
                />
              </div>
            </div>
          )}

          {trade.assetType === 'Gold' && (
            <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-lg border p-4 ${ASSET_SECTION_BORDER['Gold']}`}>
              <div>
                <Label htmlFor="edit-purityCarats">Purity (carats)</Label>
                <Select id="edit-purityCarats" {...register('purityCarats', { required: 'Purity is required.' })}>
                  <option value="">Select purity…</option>
                  {VALID_PURITY_CARATS.map(c => <option key={c} value={c}>{c}K</option>)}
                </Select>
                {errors.purityCarats && <FormError message={errors.purityCarats.message!} />}
              </div>
              <div>
                <Label htmlFor="edit-weightUnit">Weight unit</Label>
                <Select id="edit-weightUnit" {...register('weightUnit', { required: 'Weight unit is required.' })}>
                  <option value="">Select unit…</option>
                  {WEIGHT_UNITS.map(u => <option key={u} value={u}>{WEIGHT_UNIT_LABELS[u]}</option>)}
                </Select>
                {errors.weightUnit && <FormError message={errors.weightUnit.message!} />}
              </div>
            </div>
          )}

          {trade.assetType === 'Crypto' && (
            <div className={`rounded-lg border p-4 ${ASSET_SECTION_BORDER['Crypto']}`}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-coinSymbol">Coin symbol</Label>
                  <Input
                    id="edit-coinSymbol"
                    placeholder="e.g. BTC"
                    {...register('coinSymbol', {
                      required: 'Coin symbol is required.',
                      maxLength: { value: 20, message: 'Coin symbol must be 20 characters or fewer.' },
                    })}
                  />
                  {errors.coinSymbol && <FormError message={errors.coinSymbol.message!} />}
                </div>
                <div>
                  <Label htmlFor="edit-network">
                    Network <span className="font-normal text-gray-400">(optional)</span>
                  </Label>
                  <Input id="edit-network" placeholder="e.g. Ethereum" {...register('network')} />
                </div>
              </div>
              <div className={`mt-4 pt-4 border-t ${BROKERAGE_DIVIDER['Crypto']}`}>
                <BrokerageFeeSection
                  register={register} control={control} setValue={setValue}
                  errors={errors} tradeTotal={tradeTotal}
                />
              </div>
            </div>
          )}

          {trade.assetType === 'Bond' && (
            <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-lg border p-4 ${ASSET_SECTION_BORDER['Bond']}`}>
              <div>
                <Label htmlFor="edit-bondCode">Bond code</Label>
                <Input
                  id="edit-bondCode"
                  placeholder="e.g. US10Y"
                  {...register('bondCode', { required: 'Bond code is required.' })}
                />
                {errors.bondCode && <FormError message={errors.bondCode.message!} />}
              </div>
              <div>
                <Label htmlFor="edit-yieldPercent">Yield (%)</Label>
                <Input
                  id="edit-yieldPercent"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  {...register('yieldPercent', {
                    required: 'Yield is required.',
                    validate: v => !v || parseFloat(v) > 0 || 'Yield must be greater than zero.',
                  })}
                />
                {errors.yieldPercent && <FormError message={errors.yieldPercent.message!} />}
              </div>
              <div>
                <Label htmlFor="edit-maturityDate">Maturity date</Label>
                <Input
                  id="edit-maturityDate"
                  type="date"
                  {...register('maturityDate', { required: 'Maturity date is required.' })}
                />
                {errors.maturityDate && <FormError message={errors.maturityDate.message!} />}
              </div>
              <div>
                <Label htmlFor="edit-issuer">Issuer</Label>
                <Input
                  id="edit-issuer"
                  placeholder="e.g. US Treasury"
                  {...register('issuer', { required: 'Issuer is required.' })}
                />
                {errors.issuer && <FormError message={errors.issuer.message!} />}
              </div>
            </div>
          )}

          {trade.assetType === 'Property' && (
            <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-lg border p-4 ${ASSET_SECTION_BORDER['Property']}`}>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="e.g. 123 Main St, Sydney NSW 2000"
                  {...register('address', { required: 'Address is required.' })}
                />
                {errors.address && <FormError message={errors.address.message!} />}
              </div>
              <div>
                <Label htmlFor="edit-propertyType">Property type</Label>
                <Select id="edit-propertyType" {...register('propertyType', { required: 'Property type is required.' })}>
                  <option value="">Select type…</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                {errors.propertyType && <FormError message={errors.propertyType.message!} />}
              </div>
            </div>
          )}

          {/* Foreign trade */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="edit-isForeignTrade"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                {...register('isForeignTrade')}
              />
              <Label htmlFor="edit-isForeignTrade" className="mb-0">Foreign trade</Label>
            </div>
            {isForeignTrade && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="max-w-xs">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select id="edit-currency" {...register('currency', { required: 'Currency is required.' })}>
                    <option value="">Select currency…</option>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  {errors.currency && <FormError message={errors.currency.message!} />}
                </div>
                <div className="max-w-xs">
                  <Label htmlFor="edit-exchangeRate">Exchange rate (1 AUD = X {currency})</Label>
                  <Input
                    id="edit-exchangeRate"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="e.g. 0.6400"
                    {...register('exchangeRate', {
                      required: 'Exchange rate is required for foreign trades.',
                      validate: v => parseFloat(v) > 0 || 'Exchange rate must be greater than zero.',
                    })}
                  />
                  {errors.exchangeRate && <FormError message={errors.exchangeRate.message!} />}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

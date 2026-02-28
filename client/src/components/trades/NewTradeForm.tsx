'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { tradesApi } from '@/lib/api/trades';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  ASSET_TYPES, TRADE_TYPES, EXCHANGES, WEIGHT_UNITS, PROPERTY_TYPES, VALID_PURITY_CARATS, CURRENCIES
} from '@/lib/types';
import type {
  AssetType, TradeType, Exchange, WeightUnit, PropertyType, ApiValidationError,
} from '@/lib/types';
import { computePositions } from '@/lib/positions';
import type { AllPositions } from '@/lib/positions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { FormError } from '@/components/ui/FormError';
import { Spinner } from '@/components/ui/Spinner';

// ── Style constants ──────────────────────────────────────────────────
const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  Grams: 'Grams', TroyOunces: 'Troy Ounces', Tolas: 'Tolas',
};

const ASSET_TAB_ACTIVE: Record<AssetType, string> = {
  Shares: 'bg-blue-600   text-white border-blue-600',
  Gold: 'bg-amber-500  text-white border-amber-500',
  Crypto: 'bg-purple-600 text-white border-purple-600',
  Bond: 'bg-teal-600   text-white border-teal-600',
  Property: 'bg-orange-500 text-white border-orange-500',
};

// ── Form types ───────────────────────────────────────────────────────
type BrokerageFeeMode = 'dollar' | 'percent';

type FormValues = {
  assetType: AssetType;
  tradeType: TradeType;
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

// ── Brokerage sub-component ──────────────────────────────────────────
function BrokerageFeeSection({
  register,
  control,
  setValue,
  errors,
  tradeTotal,
}: {
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  errors: FieldErrors<FormValues>;
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
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 9.95"
            {...register('brokerageFeeDollar', {
              validate: v => !v || parseFloat(v) >= 0 || 'Brokerage fee cannot be negative.',
            })}
          />
          {errors.brokerageFeeDollar && <FormError message={errors.brokerageFeeDollar.message!} />}
        </div>
      ) : (
        <div className="max-w-xs">
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="e.g. 0.50"
            {...register('brokerageFeePercent', {
              validate: v => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 100) || 'Percentage must be between 0 and 100.',
            })}
          />
          {errors.brokerageFeePercent && <FormError message={errors.brokerageFeePercent.message!} />}
          {calculatedDollar !== null && (
            <p className="mt-1 text-xs text-gray-500">
              ≈ ${calculatedDollar.toFixed(2)} brokerage
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function NewTradeForm() {
  const { token, homeCurrency } = useAuth();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  // ── Positions state ──────────────────────────────────────────────
  const [positions, setPositions] = useState<AllPositions | null>(null);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [selectedPositionKey, setSelectedPositionKey] = useState('');

  useEffect(() => {
    if (!token) return;
    setTradesLoading(true);
    tradesApi.getAll(token)
      .then(trades => setPositions(computePositions(trades)))
      .catch(() => setPositions({ shares: [], gold: [], crypto: [], bonds: [], property: [] }))
      .finally(() => setTradesLoading(false));
  }, [token]);

  // ── Form ─────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    shouldUnregister: true,
    defaultValues: {
      assetType: 'Shares',
      tradeType: 'Buy',
      dateOfTrade: today,
      isForeignTrade: false,
      exchangeRate: '',
      brokerageFeeMode: 'dollar',
    },
  });

  const assetType = useWatch({ control, name: 'assetType' }) ?? 'Shares';
  const tradeType = useWatch({ control, name: 'tradeType' }) ?? 'Buy';
  const isForeignTrade = useWatch({ control, name: 'isForeignTrade' }) ?? false;
  const currency = useWatch({ control, name: 'currency' }) ?? 'AUD';
  const pricePerUnitRaw = useWatch({ control, name: 'pricePerUnit' });
  const numberOfUnitsRaw = useWatch({ control, name: 'numberOfUnits' });

  const isSell = tradeType === 'Sell';
  const isPropertyBuy = assetType === 'Property' && !isSell;
  const hasBrokerage = assetType === 'Shares' || assetType === 'Crypto';

  // Live trade total for brokerage percent calculation
  const tradeTotal = useMemo(() => {
    const p = parseFloat(pricePerUnitRaw ?? '');
    const u = isPropertyBuy ? 1 : parseFloat(numberOfUnitsRaw ?? '');
    return isNaN(p) || isNaN(u) ? 0 : p * u;
  }, [pricePerUnitRaw, numberOfUnitsRaw, isPropertyBuy]);

  // Reset selected position whenever asset type or trade type changes
  useEffect(() => {
    setSelectedPositionKey('');
  }, [assetType, tradeType]);

  // ── Available positions for current asset type ───────────────────
  const availablePositions = useMemo((): Array<{ key: string; label: string; availableUnits: number }> => {
    if (!positions) return [];
    switch (assetType) {
      case 'Shares':
        return positions.shares.map(p => ({
          key: p.key,
          label: `${p.ticker} (${p.exchange})`,
          availableUnits: p.availableUnits,
        }));
      case 'Gold':
        return positions.gold.map(p => ({
          key: p.key,
          label: `${p.purityCarats}K gold (${p.weightUnit === 'TroyOunces' ? 'Troy Oz' : p.weightUnit})`,
          availableUnits: p.availableUnits,
        }));
      case 'Crypto':
        return positions.crypto.map(p => ({
          key: p.key,
          label: p.coinSymbol,
          availableUnits: p.availableUnits,
        }));
      case 'Bond':
        return positions.bonds.map(p => ({
          key: p.key,
          label: `${p.bondCode} — ${p.yieldPercent}% (${p.issuer})`,
          availableUnits: p.availableUnits,
        }));
      case 'Property':
        return positions.property.map(p => ({
          key: p.key,
          label: `${p.address} — ${p.propertyType}`,
          availableUnits: p.availableUnits,
        }));
    }
  }, [positions, assetType]);

  const selectedAvailableUnits =
    availablePositions.find(p => p.key === selectedPositionKey)?.availableUnits ?? 0;

  // ── Position selection — populate hidden identifier fields ────────
  const handlePositionSelect = (key: string) => {
    setSelectedPositionKey(key);
    if (!positions || !key) return;

    switch (assetType) {
      case 'Shares': {
        const p = positions.shares.find(pos => pos.key === key);
        if (p) { setValue('ticker', p.ticker); setValue('exchange', p.exchange); }
        break;
      }
      case 'Gold': {
        const p = positions.gold.find(pos => pos.key === key);
        if (p) { setValue('purityCarats', String(p.purityCarats)); setValue('weightUnit', p.weightUnit); }
        break;
      }
      case 'Crypto': {
        const p = positions.crypto.find(pos => pos.key === key);
        if (p) setValue('coinSymbol', p.coinSymbol);
        break;
      }
      case 'Bond': {
        const p = positions.bonds.find(pos => pos.key === key);
        if (p) {
          setValue('bondCode', p.bondCode);
          setValue('yieldPercent', String(p.yieldPercent));
          setValue('maturityDate', p.maturityDate);
          setValue('issuer', p.issuer);
        }
        break;
      }
      case 'Property': {
        const p = positions.property.find(pos => pos.key === key);
        if (p) { setValue('address', p.address); setValue('propertyType', p.propertyType); }
        break;
      }
    }
  };

  // ── Submit ────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    const isSellSubmit = data.tradeType === 'Sell';

    // Property buy is always 1 unit (field is hidden)
    const numberOfUnits =
      data.assetType === 'Property' && !isSellSubmit
        ? 1
        : parseFloat(data.numberOfUnits!);

    const total = parseFloat(data.pricePerUnit) * numberOfUnits;

    // Resolve brokerage fees to a dollar amount (Shares and Crypto only)
    let brokerageFees: number | null = null;
    if (data.assetType === 'Shares' || data.assetType === 'Crypto') {
      if (data.brokerageFeeMode === 'percent') {
        const pct = parseFloat(data.brokerageFeePercent ?? '');
        brokerageFees = pct > 0 && total > 0 ? Math.round(total * (pct / 100) * 100) / 100 : null;
      } else {
        const v = parseFloat(data.brokerageFeeDollar ?? '');
        brokerageFees = v > 0 ? v : null;
      }
    }

    const common = {
      tradeType: data.tradeType,
      pricePerUnit: parseFloat(data.pricePerUnit),
      numberOfUnits,
      dateOfTrade: data.dateOfTrade,
      currency: data.isForeignTrade ? data.currency : (homeCurrency ?? 'AUD'),
      isForeignTrade: data.isForeignTrade,
      exchangeRate: data.isForeignTrade ? parseFloat(data.exchangeRate) : null,
    };

    try {
      switch (data.assetType) {
        case 'Shares': {
          // For sells, read identifiers from positions state — hidden inputs with
          // shouldUnregister:true can lose their setValue'd values on re-render.
          const sharesPos = isSellSubmit
            ? positions?.shares.find(p => p.key === selectedPositionKey)
            : null;
          const ticker   = (sharesPos?.ticker  ?? data.ticker!).toUpperCase();
          const exchange = (sharesPos?.exchange ?? data.exchange!) as Exchange;
          await tradesApi.createShares({ ...common, ticker, exchange, brokerageFees }, token!);
          break;
        }
        case 'Gold': {
          const goldPos      = isSellSubmit ? positions?.gold.find(p => p.key === selectedPositionKey) : null;
          const purityCarats = goldPos?.purityCarats ?? parseInt(data.purityCarats!);
          const weightUnit   = (goldPos?.weightUnit  ?? data.weightUnit!) as WeightUnit;
          await tradesApi.createGold({ ...common, purityCarats, weightUnit }, token!);
          break;
        }
        case 'Crypto': {
          const cryptoPos  = isSellSubmit ? positions?.crypto.find(p => p.key === selectedPositionKey) : null;
          const coinSymbol = cryptoPos?.coinSymbol ?? data.coinSymbol!;
          await tradesApi.createCrypto(
            { ...common, coinSymbol, network: data.network || undefined, brokerageFees },
            token!,
          );
          break;
        }
        case 'Bond': {
          const bondPos = isSellSubmit ? positions?.bonds.find(p => p.key === selectedPositionKey) : null;
          await tradesApi.createBond(
            {
              ...common,
              bondCode:     bondPos?.bondCode     ?? data.bondCode!,
              yieldPercent: bondPos?.yieldPercent  ?? parseFloat(data.yieldPercent!),
              maturityDate: bondPos?.maturityDate   ?? data.maturityDate!,
              issuer:       bondPos?.issuer         ?? data.issuer!,
            },
            token!,
          );
          break;
        }
        case 'Property': {
          const propPos = isSellSubmit ? positions?.property.find(p => p.key === selectedPositionKey) : null;
          await tradesApi.createProperty(
            {
              ...common,
              address:      propPos?.address      ?? data.address!,
              propertyType: (propPos?.propertyType ?? data.propertyType!) as PropertyType,
            },
            token!,
          );
          break;
        }
      }
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = err.body as ApiValidationError;
        Object.entries(body?.errors ?? {}).forEach(([key, messages]) => {
          const field = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof FormValues;
          setError(field, { message: messages[0] ?? 'Invalid value.' });
        });
      } else {
        setError('root', { message: 'Failed to save trade. Please try again.' });
      }
    }
  };

  // ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <div className="rounded-md bg-red-50 p-3">
          <FormError message={errors.root.message!} />
        </div>
      )}

      {/* Asset type selector */}
      <div>
        <Label>Asset type</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {ASSET_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('assetType', type)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${assetType === type
                  ? ASSET_TAB_ACTIVE[type]
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('assetType')} />
      </div>

      {/* Trade type toggle */}
      <div>
        <Label>Trade type</Label>
        <div className="mt-1 flex gap-2">
          {TRADE_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('tradeType', type)}
              className={`rounded-full border px-5 py-1.5 text-sm font-medium transition-colors ${tradeType === type
                  ? type === 'Buy'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-red-500 text-white border-red-500'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('tradeType')} />
      </div>

      {/* Date — always visible */}
      <div className="max-w-xs">
        <Label htmlFor="dateOfTrade">Trade date</Label>
        <Input
          id="dateOfTrade"
          type="date"
          max={today}
          {...register('dateOfTrade', {
            required: 'Trade date is required.',
            validate: v => v <= today || 'Trade date cannot be in the future.',
          })}
        />
        {errors.dateOfTrade && <FormError message={errors.dateOfTrade.message!} />}
      </div>

      {/* ── BUY flow ─────────────────────────────────────────────── */}
      {!isSell && (
        <>
          <div className={`grid gap-5 ${isPropertyBuy ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
            <div>
              <Label htmlFor="pricePerUnit">{assetType === 'Property' ? 'Purchase Price' : 'Price per unit'}</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step={assetType === 'Property' ? "10000" : "any"}
                min="0"
                placeholder="$0.00"
                {...register('pricePerUnit', {
                  required: 'Price per unit is required.',
                  validate: v => parseFloat(v) > 0 || 'Price must be greater than zero.',
                })}
              />
              {errors.pricePerUnit && <FormError message={errors.pricePerUnit.message!} />}
            </div>

            {/* Units field — hidden for property (hardcoded to 1) */}
            {!isPropertyBuy && (
              <div>
                <Label htmlFor="numberOfUnits">Number of units</Label>
                <Input
                  id="numberOfUnits"
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

          {/* Foreign trade */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="isForeignTrade"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                {...register('isForeignTrade')}
              />
              <Label htmlFor="isForeignTrade" className="mb-0">Foreign trade</Label>
            </div>
            {isForeignTrade && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="max-w-xs">
                  <Label htmlFor="currency">Currency</Label>
                  <Select id="currency" {...register('currency', { required: 'Currency is required.' })}>
                    <option value="">Select currency…</option>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  {errors.currency && <FormError message={errors.currency.message!} />}
                </div>
                <div className="max-w-xs">
                  <Label htmlFor="exchangeRate">Exchange rate (1 AUD = X {currency})</Label>
                  <Input
                    id="exchangeRate"
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

          {/* Asset-specific buy fields */}
          {assetType === 'Shares' && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ticker">Ticker symbol</Label>
                  <Input
                    id="ticker"
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
                  <Label htmlFor="exchange">Exchange</Label>
                  <Select id="exchange" {...register('exchange', { required: 'Exchange is required.' })}>
                    <option value="">Select exchange…</option>
                    {EXCHANGES.map(e => <option key={e} value={e}>{e}</option>)}
                  </Select>
                  {errors.exchange && <FormError message={errors.exchange.message!} />}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <BrokerageFeeSection
                  register={register}
                  control={control}
                  setValue={setValue}
                  errors={errors}
                  tradeTotal={tradeTotal}
                />
              </div>
            </div>
          )}

          {assetType === 'Gold' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-lg border border-amber-100 bg-amber-50 p-4">
              <div>
                <Label htmlFor="purityCarats">Purity (carats)</Label>
                <Select id="purityCarats" {...register('purityCarats', { required: 'Purity is required.' })}>
                  <option value="">Select purity…</option>
                  {VALID_PURITY_CARATS.map(c => <option key={c} value={c}>{c}K</option>)}
                </Select>
                {errors.purityCarats && <FormError message={errors.purityCarats.message!} />}
              </div>
              <div>
                <Label htmlFor="weightUnit">Weight unit</Label>
                <Select id="weightUnit" {...register('weightUnit', { required: 'Weight unit is required.' })}>
                  <option value="">Select unit…</option>
                  {WEIGHT_UNITS.map(u => <option key={u} value={u}>{WEIGHT_UNIT_LABELS[u]}</option>)}
                </Select>
                {errors.weightUnit && <FormError message={errors.weightUnit.message!} />}
              </div>
            </div>
          )}

          {assetType === 'Crypto' && (
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="coinSymbol">Coin symbol</Label>
                  <Input
                    id="coinSymbol"
                    placeholder="e.g. BTC"
                    {...register('coinSymbol', {
                      required: 'Coin symbol is required.',
                      maxLength: { value: 20, message: 'Coin symbol must be 20 characters or fewer.' },
                    })}
                  />
                  {errors.coinSymbol && <FormError message={errors.coinSymbol.message!} />}
                </div>
                <div>
                  <Label htmlFor="network">
                    Network <span className="font-normal text-gray-400">(optional)</span>
                  </Label>
                  <Input id="network" placeholder="e.g. Ethereum" {...register('network')} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-200">
                <BrokerageFeeSection
                  register={register}
                  control={control}
                  setValue={setValue}
                  errors={errors}
                  tradeTotal={tradeTotal}
                />
              </div>
            </div>
          )}

          {assetType === 'Bond' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-lg border border-teal-100 bg-teal-50 p-4">
              <div>
                <Label htmlFor="bondCode">Bond code</Label>
                <Input
                  id="bondCode"
                  placeholder="e.g. US10Y"
                  {...register('bondCode', { required: 'Bond code is required.' })}
                />
                {errors.bondCode && <FormError message={errors.bondCode.message!} />}
              </div>
              <div>
                <Label htmlFor="yieldPercent">Yield (%)</Label>
                <Input
                  id="yieldPercent"
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
                <Label htmlFor="maturityDate">Maturity date</Label>
                <Input
                  id="maturityDate"
                  type="date"
                  {...register('maturityDate', { required: 'Maturity date is required.' })}
                />
                {errors.maturityDate && <FormError message={errors.maturityDate.message!} />}
              </div>
              <div>
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  placeholder="e.g. US Treasury"
                  {...register('issuer', { required: 'Issuer is required.' })}
                />
                {errors.issuer && <FormError message={errors.issuer.message!} />}
              </div>
            </div>
          )}

          {assetType === 'Property' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 rounded-lg border border-orange-100 bg-orange-50 p-4">
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g. 123 Main St, Sydney NSW 2000"
                  {...register('address', { required: 'Address is required.' })}
                />
                {errors.address && <FormError message={errors.address.message!} />}
              </div>
              <div>
                <Label htmlFor="propertyType">Property type</Label>
                <Select id="propertyType" {...register('propertyType', { required: 'Property type is required.' })}>
                  <option value="">Select type…</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                {errors.propertyType && <FormError message={errors.propertyType.message!} />}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SELL flow ─────────────────────────────────────────────── */}
      {isSell && (
        <div className="space-y-5">
          {tradesLoading ? (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Spinner />
              Loading your positions…
            </div>
          ) : availablePositions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                No {assetType.toLowerCase()} positions available to sell.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Add a buy trade first to create a position.
              </p>
            </div>
          ) : (
            <>
              {/* Position selector */}
              <div>
                <Label htmlFor="positionSelect">Select position to sell</Label>
                <Select
                  id="positionSelect"
                  value={selectedPositionKey}
                  onChange={e => handlePositionSelect(e.target.value)}
                >
                  <option value="">Choose a position…</option>
                  {availablePositions.map(p => (
                    <option key={p.key} value={p.key}>
                      {assetType == 'Property' ? p.label : `${p.label} — ${p.availableUnits} unit(s) available`}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Hidden identifier fields populated from selected position */}
              {assetType === 'Shares' && (
                <>
                  <input type="hidden" {...register('ticker')} />
                  <input type="hidden" {...register('exchange')} />
                </>
              )}
              {assetType === 'Gold' && (
                <>
                  <input type="hidden" {...register('purityCarats')} />
                  <input type="hidden" {...register('weightUnit')} />
                </>
              )}
              {assetType === 'Crypto' && <input type="hidden" {...register('coinSymbol')} />}
              {assetType === 'Bond' && (
                <>
                  <input type="hidden" {...register('bondCode')} />
                  <input type="hidden" {...register('yieldPercent')} />
                  <input type="hidden" {...register('maturityDate')} />
                  <input type="hidden" {...register('issuer')} />
                </>
              )}
              {assetType === 'Property' && (
                <>
                  <input type="hidden" {...register('address')} />
                  <input type="hidden" {...register('propertyType')} />
                </>
              )}

              {/* Price + units — only shown after a position is selected */}
              {selectedPositionKey && (
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="pricePerUnit">Sale price per unit</Label>
                      <Input
                        id="pricePerUnit"
                        type="number"
                        step="any"
                        placeholder="0.00"
                        {...register('pricePerUnit', {
                          required: 'Sale price is required.',
                          validate: v => parseFloat(v) > 0 || 'Price must be greater than zero.',
                        })}
                      />
                      {errors.pricePerUnit && <FormError message={errors.pricePerUnit.message!} />}
                    </div>
                    <div>
                      <Label htmlFor="numberOfUnits">
                        Number of units{' '}
                        <span className="font-normal text-gray-400">
                          (max: {selectedAvailableUnits})
                        </span>
                      </Label>
                      <Input
                        id="numberOfUnits"
                        type="number"
                        step="any"
                        placeholder="0"
                        max={selectedAvailableUnits}
                        {...register('numberOfUnits', {
                          required: 'Number of units is required.',
                          validate: v => {
                            const n = parseFloat(v ?? '0');
                            if (n <= 0) return 'Units must be greater than zero.';
                            if (n > selectedAvailableUnits) return `Cannot exceed available units (${selectedAvailableUnits}).`;
                            return true;
                          },
                        })}
                      />
                      {errors.numberOfUnits && <FormError message={errors.numberOfUnits.message!} />}
                    </div>
                  </div>

                  {/* Brokerage — Shares and Crypto sell */}
                  {hasBrokerage && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <BrokerageFeeSection
                        register={register}
                        control={control}
                        setValue={setValue}
                        errors={errors}
                        tradeTotal={tradeTotal}
                      />
                    </div>
                  )}

                  {/* Foreign trade */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        id="isForeignTradeSell"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        {...register('isForeignTrade')}
                      />
                      <Label htmlFor="isForeignTradeSell" className="mb-0">Foreign trade</Label>
                    </div>
                    {isForeignTrade && (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="max-w-xs">
                          <Label htmlFor="currencySell">Currency</Label>
                          <Select id="currencySell" {...register('currency', { required: 'Currency is required.' })}>
                            <option value="">Select currency…</option>
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </Select>
                          {errors.currency && <FormError message={errors.currency.message!} />}
                        </div>
                        <div className="max-w-xs">
                          <Label htmlFor="exchangeRateSell">Exchange rate (1 AUD = X {currency})</Label>
                          <Input
                            id="exchangeRateSell"
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
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Submit / Cancel */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSell && (!selectedPositionKey || availablePositions.length === 0)}
        >
          Save trade
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

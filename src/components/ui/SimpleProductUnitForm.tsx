'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { productUnitService } from '@/services/productUnitService';
import { uomService } from '@/services/uomService';
import { LoadingSpinner } from './LoadingSpinner';
import type { UnitOfMeasure } from '@/types';

interface Props {
  productId: number;
  uoms?: UnitOfMeasure[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Step = 'base' | 'sub' | 'review';

export function SimpleProductUnitForm({ productId, uoms: providedUoms, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<Step>('base');
  const [uoms, setUoms] = useState<UnitOfMeasure[]>(providedUoms || []);
  const [loading, setLoading] = useState(!providedUoms);
  const [submitting, setSubmitting] = useState(false);

  // Base unit
  const [baseUomId, setBaseUomId] = useState<number>(0);
  const [baseTotalQty, setBaseTotalQty] = useState<string>('');
  const [baseConversionFactor, setBaseConversionFactor] = useState<string>('');
  const [basePurchasePrice, setBasePurchasePrice] = useState<string>('');
  const [baseSalePrice, setBaseSalePrice] = useState<string>('');

  // Sub unit
  const [hasSubUnit, setHasSubUnit] = useState(false);
  const [subUomId, setSubUomId] = useState<number>(0);
  const [subPurchasePrice, setSubPurchasePrice] = useState<string>('');
  const [subSalePrice, setSubSalePrice] = useState<string>('');

  // Load UoMs if not provided
  useEffect(() => {
    if (providedUoms) return;
    const load = async () => {
      try {
        const data = await uomService.getAll();
        setUoms(data);
      } catch (err: any) {
        toast.error('Failed to load units of measure');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providedUoms]);

  // Computed values for display
  const baseQtyNum = parseFloat(baseTotalQty) || 0;
  const baseConvNum = parseFloat(baseConversionFactor) || 0;
  const basePurchaseNum = parseFloat(basePurchasePrice) || 0;
  const baseSaleNum = parseFloat(baseSalePrice) || 0;

  const computedSubTotalQty = baseQtyNum * baseConvNum;
  const computedSubPurchasePrice = computedSubTotalQty > 0 ? basePurchaseNum / computedSubTotalQty : 0;
  const computedSubSalePrice = computedSubTotalQty > 0 ? baseSaleNum / computedSubTotalQty : 0;

  const baseUomName = uoms.find(u => u.unitOfMeasureId === baseUomId)?.name || 'Unit';
  const subUomName = uoms.find(u => u.unitOfMeasureId === subUomId)?.name || 'Unit';

  // Validation
  const validateBase = (): boolean => {
    if (!baseUomId) {
      toast.error('Select a unit for the base unit');
      return false;
    }
    if (baseQtyNum <= 0) {
      toast.error('Quantity must be greater than 0');
      return false;
    }
    if (baseConvNum <= 0) {
      toast.error('Conversion factor must be greater than 0');
      return false;
    }
    if (basePurchaseNum < 0 || baseSaleNum < 0) {
      toast.error('Prices cannot be negative');
      return false;
    }
    return true;
  };

  const validateSub = (): boolean => {
    if (hasSubUnit && !subUomId) {
      toast.error('Select a unit for the sub-unit');
      return false;
    }
    if (hasSubUnit && subUomId === baseUomId) {
      toast.error('Sub-unit cannot be the same as base unit');
      return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateSub()) return;

    setSubmitting(true);
    try {
      await productUnitService.addDualUnit(productId, {
        firstUnit: {
          unitOfMeasureId: baseUomId,
          totalUnitQty: basePurchaseNum,
          conversionFactorToBase: baseConvNum,
          purchasePrice: basePurchaseNum,
          salePrice: baseSaleNum,
        },
        secondUnit: hasSubUnit
          ? {
              unitOfMeasureId: subUomId,
              purchasePrice: subPurchasePrice ? parseFloat(subPurchasePrice) : undefined,
              salePrice: subSalePrice ? parseFloat(subSalePrice) : undefined,
            }
          : undefined,
      });

      toast.success('Units added successfully!');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to add units');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-6 w-6" />;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex-1 rounded-lg px-4 py-3 text-center text-sm font-semibold ${step === 'base' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
          1. Base Unit
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <div className={`flex-1 rounded-lg px-4 py-3 text-center text-sm font-semibold ${step === 'sub' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
          2. Sub Unit (Optional)
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <div className={`flex-1 rounded-lg px-4 py-3 text-center text-sm font-semibold ${step === 'review' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
          3. Review
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ STEP 1: BASE UNIT */}
      {step === 'base' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-800">
              <strong>Step 1:</strong> Add the base/primary unit (e.g., "Tablet", "Bottle", "Box")
            </p>
          </div>

          {/* UoM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What is the base unit? <span className="text-red-500">*</span>
            </label>
            <select
              value={baseUomId}
              onChange={e => setBaseUomId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value={0}>Select a unit...</option>
              {uoms.filter(u => u.isActive).map(u => (
                <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Total Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many {baseUomName.toLowerCase()}s do you have? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g., 10"
                value={baseTotalQty}
                onChange={e => setBaseTotalQty(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">{baseUomName}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">E.g., if you buy 1 Box containing 10 Tablets, enter 10</p>
          </div>

          {/* Conversion Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversion factor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g., 20"
                value={baseConversionFactor}
                onChange={e => setBaseConversionFactor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">per unit</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              How many of this unit = 1 smallest unit? E.g., 1 Box = 20 Tablets, so enter 20
            </p>
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase price per {baseUomName.toLowerCase()} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs</span>
              <input
                type="number"
                placeholder="0.00"
                value={basePurchasePrice}
                onChange={e => setBasePurchasePrice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale price per {baseUomName.toLowerCase()} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs</span>
              <input
                type="number"
                placeholder="0.00"
                value={baseSalePrice}
                onChange={e => setBaseSalePrice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (validateBase()) setStep('sub');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ STEP 2: SUB UNIT */}
      {step === 'sub' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-800">
              <strong>Step 2 (Optional):</strong> Add a smaller unit with auto-calculated pricing
            </p>
          </div>

          {/* Add sub unit toggle */}
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <input
              type="checkbox"
              checked={hasSubUnit}
              onChange={e => setHasSubUnit(e.target.checked)}
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <label className="flex-1 text-sm font-medium text-gray-700 cursor-pointer">
              Add a smaller sub-unit (e.g., individual tablets/strips)
            </label>
          </div>

          {hasSubUnit && (
            <>
              {/* Sub UoM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={subUomId}
                  onChange={e => setSubUomId(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value={0}>Select a unit...</option>
                  {uoms
                    .filter(u => u.isActive && u.unitOfMeasureId !== baseUomId)
                    .map(u => (
                      <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                </select>
              </div>

              {/* Auto-calculated Sub Total Qty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-unit total quantity <span className="text-gray-400">(auto-calculated)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={computedSubTotalQty.toFixed(2)}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm cursor-not-allowed"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">{subUomName}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {baseTotalQty} {baseUomName} × {baseConversionFactor} = {computedSubTotalQty.toFixed(2)} {subUomName}
                </p>
              </div>

              {/* Auto-calculated Sub Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase price per {subUomName.toLowerCase()}{' '}
                  <span className="text-amber-600 text-xs font-normal">(auto-calculated, edit if needed)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs</span>
                  <input
                    type="number"
                    value={subPurchasePrice || computedSubPurchasePrice.toFixed(2)}
                    onChange={e => setSubPurchasePrice(e.target.value)}
                    className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 pl-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Rs {basePurchasePrice} ÷ {computedSubTotalQty.toFixed(2)} = Rs {computedSubPurchasePrice.toFixed(4)}
                </p>
              </div>

              {/* Auto-calculated Sub Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale price per {subUomName.toLowerCase()}{' '}
                  <span className="text-amber-600 text-xs font-normal">(auto-calculated, edit if needed)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs</span>
                  <input
                    type="number"
                    value={subSalePrice || computedSubSalePrice.toFixed(2)}
                    onChange={e => setSubSalePrice(e.target.value)}
                    className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 pl-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Rs {baseSalePrice} ÷ {computedSubTotalQty.toFixed(2)} = Rs {computedSubSalePrice.toFixed(4)}
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('base')}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Review <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ STEP 3: REVIEW */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-800">
              <strong>Step 3:</strong> Review and confirm
            </p>
          </div>

          {/* Base unit summary */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Base Unit</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Unit</p>
                <p className="font-semibold text-gray-900">{baseUomName}</p>
              </div>
              <div>
                <p className="text-gray-500">Quantity</p>
                <p className="font-semibold text-gray-900">{baseTotalQty} {baseUomName}</p>
              </div>
              <div>
                <p className="text-gray-500">Conversion</p>
                <p className="font-semibold text-gray-900">{baseConversionFactor}</p>
              </div>
              <div>
                <p className="text-gray-500">Purchase Price</p>
                <p className="font-semibold text-gray-900">Rs {basePurchasePrice}</p>
              </div>
              <div>
                <p className="text-gray-500">Sale Price</p>
                <p className="font-semibold text-gray-900">Rs {baseSalePrice}</p>
              </div>
            </div>
          </div>

          {/* Sub unit summary */}
          {hasSubUnit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Sub Unit (Auto-Calculated)</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Unit</p>
                  <p className="font-semibold text-gray-900">{subUomName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Quantity</p>
                  <p className="font-semibold text-gray-900">{computedSubTotalQty.toFixed(2)} {subUomName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Purchase Price</p>
                  <p className="font-semibold text-gray-900">Rs {(subPurchasePrice ? parseFloat(subPurchasePrice) : computedSubPurchasePrice).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sale Price</p>
                  <p className="font-semibold text-gray-900">Rs {(subSalePrice ? parseFloat(subSalePrice) : computedSubSalePrice).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('sub')}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="h-4 w-4 text-white" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Confirm & Save
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

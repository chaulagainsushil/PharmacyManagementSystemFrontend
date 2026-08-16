'use client';

import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import { productUnitService, type AddDualUnitCommand } from '@/services/productUnitService';
import { uomService } from '@/services/uomService';
import { LoadingSpinner } from './LoadingSpinner';
import type { UnitOfMeasure } from '@/types';

interface Props {
  productId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductUnitForm({ productId, onSuccess, onCancel }: Props) {
  // UoM list
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [loadingUoms, setLoadingUoms] = useState(true);

  // First unit (base) form state
  const [firstUomId, setFirstUomId] = useState<number>(0);
  const [firstTotalUnitQty, setFirstTotalUnitQty] = useState<string>('');
  const [firstConversionFactor, setFirstConversionFactor] = useState<string>('');
  const [firstPurchasePrice, setFirstPurchasePrice] = useState<string>('');
  const [firstSalePrice, setFirstSalePrice] = useState<string>('');

  // Second unit (sub) form state
  const [showSecondUnit, setShowSecondUnit] = useState(false);
  const [secondUomId, setSecondUomId] = useState<number>(0);
  const [secondTotalUnitQty, setSecondTotalUnitQty] = useState<string>('');
  const [secondPurchasePrice, setSecondPurchasePrice] = useState<string>('');
  const [secondSalePrice, setSecondSalePrice] = useState<string>('');

  // Track which second-unit fields were manually edited
  const [secondPurchasePriceEdited, setSecondPurchasePriceEdited] = useState(false);
  const [secondSalePriceEdited, setSecondSalePriceEdited] = useState(false);
  const secondPurchasePriceRef = useRef<HTMLInputElement>(null);
  const secondSalePriceRef = useRef<HTMLInputElement>(null);

  // Computed values
  const firstQtyNum = parseFloat(firstTotalUnitQty) || 0;
  const firstConvNum = parseFloat(firstConversionFactor) || 0;
  const firstPurchaseNum = parseFloat(firstPurchasePrice) || 0;
  const firstSaleNum = parseFloat(firstSalePrice) || 0;

  // Second unit auto-calculations
  const computedSecondTotalQty = firstQtyNum > 0 && firstConvNum > 0 ? firstQtyNum * firstConvNum : 0;
  const computedSecondPurchasePrice =
    computedSecondTotalQty > 0 ? firstPurchaseNum / computedSecondTotalQty : 0;
  const computedSecondSalePrice = computedSecondTotalQty > 0 ? firstSaleNum / computedSecondTotalQty : 0;

  // Loading/submitting states
  const [submitting, setSubmitting] = useState(false);

  // Load UoMs on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await uomService.getAll();
        setUoms(data);
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Failed to load units of measure');
      } finally {
        setLoadingUoms(false);
      }
    };
    load();
  }, []);

  // Auto-fill second unit fields when first unit changes
  useEffect(() => {
    if (!showSecondUnit) return;
    if (!secondPurchasePriceEdited) {
      setSecondPurchasePrice(computedSecondPurchasePrice.toFixed(2));
    }
    if (!secondSalePriceEdited) {
      setSecondSalePrice(computedSecondSalePrice.toFixed(2));
    }
  }, [firstQtyNum, firstConvNum, firstPurchaseNum, firstSaleNum, showSecondUnit, secondPurchasePriceEdited, secondSalePriceEdited]);

  // Handle second unit field edits
  const handleSecondPurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondPurchasePrice(e.target.value);
    setSecondPurchasePriceEdited(true);
  };

  const handleSecondSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondSalePrice(e.target.value);
    setSecondSalePriceEdited(true);
  };

  // Validation
  const validateForm = (): string | null => {
    if (!firstUomId) return 'Select a first unit of measure';
    if (parseFloat(firstTotalUnitQty) <= 0) return 'First unit total quantity must be greater than 0';
    if (parseFloat(firstConversionFactor) <= 0) return 'Conversion factor must be greater than 0';
    if (parseFloat(firstPurchasePrice) < 0) return 'Purchase price cannot be negative';
    if (parseFloat(firstSalePrice) < 0) return 'Sale price cannot be negative';

    if (showSecondUnit) {
      if (!secondUomId) return 'Select a second unit of measure';
      if (firstUomId === secondUomId) return 'First and second units cannot be the same';
      if (parseFloat(secondPurchasePrice) < 0) return 'Second unit purchase price cannot be negative';
      if (parseFloat(secondSalePrice) < 0) return 'Second unit sale price cannot be negative';
    }

    return null;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      const firstUnit = {
        unitOfMeasureId: firstUomId,
        totalUnitQty: parseFloat(firstTotalUnitQty),
        conversionFactorToBase: parseFloat(firstConversionFactor),
        purchasePrice: parseFloat(firstPurchasePrice),
        salePrice: parseFloat(firstSalePrice),
      };

      let cmd: AddDualUnitCommand = {
        firstUnit,
      };

      // Add second unit if needed
      if (showSecondUnit) {
        cmd.secondUnit = {
          unitOfMeasureId: secondUomId,
          // Only send prices if user manually edited them
          purchasePrice: secondPurchasePriceEdited ? parseFloat(secondPurchasePrice) : undefined,
          salePrice: secondSalePriceEdited ? parseFloat(secondSalePrice) : undefined,
        };
      }

      await productUnitService.addDualUnit(productId, cmd);
      toast.success('Units added successfully!');

      // Reset form
      setFirstUomId(0);
      setFirstTotalUnitQty('');
      setFirstConversionFactor('');
      setFirstPurchasePrice('');
      setFirstSalePrice('');
      setShowSecondUnit(false);
      setSecondUomId(0);
      setSecondTotalUnitQty('');
      setSecondPurchasePrice('');
      setSecondSalePrice('');
      setSecondPurchasePriceEdited(false);
      setSecondSalePriceEdited(false);

      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to add units');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUoms) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-5 w-5 text-blue-500" />
      </div>
    );
  }

  const availableFirstUoms = uoms.filter((u) => u.isActive);
  const availableSecondUoms = uoms.filter((u) => u.isActive && u.unitOfMeasureId !== firstUomId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      {/* Section title */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Add Product Units
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Define a first unit and optionally a second unit with automatic calculations.
        </p>
      </div>

      {/* First Unit Section */}
      <div className="space-y-4 pb-6 border-b border-gray-100">
        <h4 className="font-semibold text-gray-800">First Unit (Base)</h4>

        <div className="grid grid-cols-2 gap-4">
          {/* First UoM */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={firstUomId}
                onChange={(e) => setFirstUomId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              >
                <option value={0}>— Select unit of measure —</option>
                {availableFirstUoms.map((u) => (
                  <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* First Total Unit Qty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Unit Qty <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.000001"
              step="0.1"
              value={firstTotalUnitQty}
              onChange={(e) => setFirstTotalUnitQty(e.target.value)}
              placeholder="10"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., 10 pieces per pack</p>
          </div>

          {/* First Conversion Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversion Factor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.000001"
              step="0.1"
              value={firstConversionFactor}
              onChange={(e) => setFirstConversionFactor(e.target.value)}
              placeholder="20"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">How many in one container</p>
          </div>

          {/* First Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={firstPurchasePrice}
                onChange={(e) => setFirstPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* First Sale Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={firstSalePrice}
                onChange={(e) => setFirstSalePrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Second Unit Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowSecondUnit(!showSecondUnit)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {showSecondUnit ? '− Remove' : '+ Add'} Second Unit
        </button>
      </div>

      {/* Second Unit Section */}
      {showSecondUnit && (
        <div className="space-y-4 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Prices are auto-calculated based on first unit. Edit to override.
            </p>
          </div>

          <h4 className="font-semibold text-gray-800">Second Unit</h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Second UoM */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={secondUomId}
                  onChange={(e) => setSecondUomId(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                >
                  <option value={0}>— Select unit of measure —</option>
                  {availableSecondUoms.map((u) => (
                    <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Second Total Qty (Read-only) */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Quantity (auto-calculated)
              </label>
              <div className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                {computedSecondTotalQty.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                First Total × Conversion Factor = {firstQtyNum.toFixed(2)} × {firstConvNum.toFixed(2)}
              </p>
            </div>

            {/* Second Purchase Price (auto-fill) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price (per unit)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  ref={secondPurchasePriceRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={secondPurchasePrice}
                  onChange={handleSecondPurchasePriceChange}
                  placeholder="0.00"
                  className={`w-full rounded-lg px-3 py-2.5 pl-9 text-sm outline-none transition-colors ${
                    secondPurchasePriceEdited
                      ? 'border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                      : 'border border-amber-200 bg-amber-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                  }`}
                />
              </div>
              {!secondPurchasePriceEdited && (
                <p className="text-xs text-amber-600 mt-1">Auto-calculated</p>
              )}
            </div>

            {/* Second Sale Price (auto-fill) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price (per unit)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  ref={secondSalePriceRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={secondSalePrice}
                  onChange={handleSecondSalePriceChange}
                  placeholder="0.00"
                  className={`w-full rounded-lg px-3 py-2.5 pl-9 text-sm outline-none transition-colors ${
                    secondSalePriceEdited
                      ? 'border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                      : 'border border-amber-200 bg-amber-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                  }`}
                />
              </div>
              {!secondSalePriceEdited && (
                <p className="text-xs text-amber-600 mt-1">Auto-calculated</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? (
            <>
              <LoadingSpinner className="h-4 w-4 text-white" />
              Adding Units...
            </>
          ) : (
            'Add Units'
          )}
        </button>
      </div>
    </form>
  );
}

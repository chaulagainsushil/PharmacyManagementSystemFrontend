'use client';

import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import { medicineUnitService, type AddDualUnitCommand, type DualUnitBaseEntry, type DualUnitSubEntry } from '@/services/medicineUnitService';
import { uomService } from '@/services/uomService';
import { LoadingSpinner } from './LoadingSpinner';
import type { UnitOfMeasure } from '@/types';

interface Props {
  medicineId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MedicineUnitForm({ medicineId, onSuccess, onCancel }: Props) {
  // UoM list
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [loadingUoms, setLoadingUoms] = useState(true);

  // Base unit form state
  const [baseUomId, setBaseUomId] = useState<number>(0);
  const [baseCostPrice, setBaseCostPrice] = useState<string>('');
  const [baseUnitPrice, setBaseUnitPrice] = useState<string>('');
  const [baseMrp, setBaseMrp] = useState<string>('');
  const [baseIsDefault, setBaseIsDefault] = useState(true);

  // Sub unit form state
  const [showSubUnit, setShowSubUnit] = useState(false);
  const [subUomId, setSubUomId] = useState<number>(0);
  const [subConversionFactor, setSubConversionFactor] = useState<string>('1');
  const [subCostPrice, setSubCostPrice] = useState<string>('');
  const [subUnitPrice, setSubUnitPrice] = useState<string>('');
  const [subMrp, setSubMrp] = useState<string>('');

  // Track whether sub-unit price was manually edited (to control UseAutoCalculatedPrice)
  const [subPriceManuallyEdited, setSubPriceManuallyEdited] = useState(false);
  const subPriceRef = useRef<HTMLInputElement>(null);

  // Computed values
  const basePriceNum = parseFloat(baseUnitPrice) || 0;
  const convFactorNum = parseFloat(subConversionFactor) || 1;
  const suggestedSubPrice = convFactorNum > 0 ? basePriceNum / convFactorNum : 0;
  const totalInBaseUnits = (parseFloat(subUnitPrice) || 0) * convFactorNum;

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

  // Auto-fill sub-unit price when base price or conversion factor changes (if not manually edited)
  useEffect(() => {
    if (!showSubUnit || subPriceManuallyEdited) return;
    setSubUnitPrice(suggestedSubPrice.toFixed(2));
  }, [basePriceNum, convFactorNum, showSubUnit, subPriceManuallyEdited]);

  // Handle sub-unit price input change
  const handleSubPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubUnitPrice(e.target.value);
    setSubPriceManuallyEdited(true);
  };

  // Validation
  const validateForm = (): string | null => {
    if (!baseUomId) return 'Select a base unit of measure';
    if (parseFloat(baseUnitPrice) <= 0) return 'Base unit price must be greater than 0';
    if (parseFloat(baseCostPrice) < 0) return 'Base unit cost price cannot be negative';

    if (showSubUnit) {
      if (!subUomId) return 'Select a sub unit of measure';
      if (baseUomId === subUomId) return 'Base unit and sub unit cannot be the same';
      if (convFactorNum <= 0) return 'Sub unit conversion factor must be greater than 0';
      if (parseFloat(subUnitPrice) <= 0) return 'Sub unit price must be greater than 0';
      if (parseFloat(subCostPrice) < 0) return 'Sub unit cost price cannot be negative';
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
      const baseUnit: DualUnitBaseEntry = {
        unitOfMeasureId: baseUomId,
        costPrice: parseFloat(baseCostPrice) || 0,
        unitPrice: parseFloat(baseUnitPrice),
        mrp: parseFloat(baseMrp) || 0,
        isDefault: baseIsDefault,
        canPurchase: true,
        canSell: true,
      };

      let cmd: AddDualUnitCommand = {
        baseUnit,
        useAutoCalculatedPrice: false,
      };

      // Add sub unit if needed
      if (showSubUnit) {
        const subUnit: DualUnitSubEntry = {
          unitOfMeasureId: subUomId,
          conversionFactorToBase: convFactorNum,
          costPrice: parseFloat(subCostPrice) || 0,
          unitPrice: parseFloat(subUnitPrice),
          mrp: parseFloat(subMrp) || 0,
          canPurchase: true,
          canSell: true,
        };

        cmd = {
          baseUnit,
          subUnit,
          useAutoCalculatedPrice: !subPriceManuallyEdited,
        };
      }

      await medicineUnitService.addDualUnit(medicineId, cmd);
      toast.success('Units added successfully!');

      // Reset form
      setBaseUomId(0);
      setBaseCostPrice('');
      setBaseUnitPrice('');
      setBaseMrp('');
      setBaseIsDefault(true);
      setShowSubUnit(false);
      setSubUomId(0);
      setSubConversionFactor('1');
      setSubCostPrice('');
      setSubUnitPrice('');
      setSubMrp('');
      setSubPriceManuallyEdited(false);

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

  // Available UoMs: not the base unit, and for sub unit, not the base unit either
  const availableBaseUoms = uoms.filter(u => u.isActive);
  const availableSubUoms = uoms.filter(u => u.isActive && u.unitOfMeasureId !== baseUomId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      {/* Section title */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Add Medicine Units
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Define the base unit and optionally a sub unit with automatic price calculation.
        </p>
      </div>

      {/* Base Unit Section */}
      <div className="space-y-4 pb-6 border-b border-gray-100">
        <h4 className="font-semibold text-gray-800">Base Unit</h4>

        <div className="grid grid-cols-2 gap-4">
          {/* Base UoM */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={baseUomId}
                onChange={(e) => setBaseUomId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              >
                <option value={0}>— Select unit of measure —</option>
                {availableBaseUoms.map((u) => (
                  <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Base Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price (Rs)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={baseCostPrice}
                onChange={(e) => setBaseCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Base Unit Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (Rs) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={baseUnitPrice}
                onChange={(e) => setBaseUnitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Base MRP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MRP (Rs)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={baseMrp}
                onChange={(e) => setBaseMrp(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Base is Default */}
          <div className="col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={baseIsDefault}
                onChange={(e) => setBaseIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 outline-none"
              />
              <span className="text-sm text-gray-700">Set as default POS unit</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sub Unit Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowSubUnit(!showSubUnit)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {showSubUnit ? '− Remove' : '+ Add'} Sub Unit
        </button>
      </div>

      {/* Sub Unit Section */}
      {showSubUnit && (
        <div className="space-y-4 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Suggested price is auto-calculated from base unit price. Edit to override.
            </p>
          </div>

          <h4 className="font-semibold text-gray-800">Sub Unit</h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Sub UoM */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={subUomId}
                  onChange={(e) => setSubUomId(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                >
                  <option value={0}>— Select unit of measure —</option>
                  {availableSubUoms.map((u) => (
                    <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Sub Conversion Factor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conversion to Base <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.000001"
                step="0.1"
                value={subConversionFactor}
                onChange={(e) => setSubConversionFactor(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many base units in one sub unit (e.g. 10 tablets per strip)
              </p>
            </div>

            {/* Sub Cost Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price (Rs)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={subCostPrice}
                  onChange={(e) => setSubCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Sub Unit Price (with suggested state) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (Rs) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  ref={subPriceRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={subUnitPrice}
                  onChange={handleSubPriceChange}
                  placeholder="0.00"
                  className={`w-full rounded-lg px-3 py-2.5 pl-9 text-sm outline-none transition-colors ${
                    subPriceManuallyEdited
                      ? 'border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                      : 'border border-amber-200 bg-amber-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                  }`}
                />
              </div>
              {!subPriceManuallyEdited && (
                <p className="text-xs text-amber-600 mt-1">
                  Auto-calculated from base price
                </p>
              )}
            </div>

            {/* Sub MRP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MRP (Rs)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={subMrp}
                  onChange={(e) => setSubMrp(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          {/* Live Total */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100 p-4">
            <p className="text-sm text-indigo-700 font-medium">
              Total in base units: <span className="font-bold text-lg">{totalInBaseUnits.toFixed(2)}</span>
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              (Sub-unit quantity × conversion factor)
            </p>
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

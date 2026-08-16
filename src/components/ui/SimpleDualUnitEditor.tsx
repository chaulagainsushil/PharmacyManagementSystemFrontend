'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, DollarSign } from 'lucide-react';
import type { UnitOfMeasure } from '@/types';

interface Unit {
  uomId: string;
  conversionFactorToBase: string;
  costPrice: string;
  unitPrice: string;
  mrp: string;
}

interface Props {
  unit1: Unit;
  unit2: Unit;
  uoms: UnitOfMeasure[];
  onUnit1Change: (unit: Unit) => void;
  onUnit2Change: (unit: Unit) => void;
  showUnit2: boolean;
  onShowUnit2Change: (show: boolean) => void;
}

export function SimpleDualUnitEditor({
  unit1,
  unit2,
  uoms,
  onUnit1Change,
  onUnit2Change,
  showUnit2,
  onShowUnit2Change,
}: Props) {
  const [autoCalculated, setAutoCalculated] = useState({
    unit2CostPrice: '',
    unit2UnitPrice: '',
    unit2Mrp: '',
  });

  // Auto-calculate unit2 prices when unit1 changes or conversion factor changes
  useEffect(() => {
    if (!showUnit2) return;

    const conv = parseFloat(unit2.conversionFactorToBase) || 1;
    const cost = parseFloat(unit1.costPrice) || 0;
    const price = parseFloat(unit1.unitPrice) || 0;
    const mrp = parseFloat(unit1.mrp) || 0;

    setAutoCalculated({
      unit2CostPrice: conv > 0 ? (cost / conv).toFixed(2) : '0.00',
      unit2UnitPrice: conv > 0 ? (price / conv).toFixed(2) : '0.00',
      unit2Mrp: conv > 0 ? (mrp / conv).toFixed(2) : '0.00',
    });
  }, [unit1, unit2.conversionFactorToBase, showUnit2]);

  const unit1Name = uoms.find(u => u.unitOfMeasureId.toString() === unit1.uomId)?.name || 'Unit 1';
  const unit2Name = uoms.find(u => u.unitOfMeasureId.toString() === unit2.uomId)?.name || 'Unit 2';

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900">Add Units</h3>
        <p className="text-xs text-gray-500">Configure base unit and optional sub-unit</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ UNIT 1 */}
      <div className="space-y-4 rounded-lg bg-blue-50 p-4">
        <h4 className="font-medium text-gray-900">Unit 1 (Base Unit)</h4>

        {/* Unit 1 - UoM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Unit Type <span className="text-red-500">*</span>
          </label>
          <select
            value={unit1.uomId}
            onChange={e => onUnit1Change({ ...unit1, uomId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select unit...</option>
            {uoms.filter(u => u.isActive).map(u => (
              <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Unit 1 - Cost Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cost Price per {unit1Name.toLowerCase()} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-gray-500">Rs</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={unit1.costPrice}
              onChange={e => onUnit1Change({ ...unit1, costPrice: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Unit 1 - Unit Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Selling Price per {unit1Name.toLowerCase()} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-gray-500">Rs</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={unit1.unitPrice}
              onChange={e => onUnit1Change({ ...unit1, unitPrice: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Unit 1 - MRP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            MRP per {unit1Name.toLowerCase()} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-gray-500">Rs</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={unit1.mrp}
              onChange={e => onUnit1Change({ ...unit1, mrp: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ UNIT 2 TOGGLE */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
        <input
          type="checkbox"
          checked={showUnit2}
          onChange={e => onShowUnit2Change(e.target.checked)}
          className="h-4 w-4 rounded accent-blue-600"
        />
        <label className="flex-1 text-sm font-medium text-gray-700 cursor-pointer">
          Add Unit 2 (smaller unit with auto-calculated pricing)
        </label>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ UNIT 2 */}
      {showUnit2 && (
        <div className="space-y-4 rounded-lg bg-amber-50 p-4">
          <h4 className="font-medium text-gray-900">Unit 2 (Sub Unit - Auto-Calculated)</h4>

          {/* Unit 2 - UoM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unit Type <span className="text-red-500">*</span>
            </label>
            <select
              value={unit2.uomId}
              onChange={e => onUnit2Change({ ...unit2, uomId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select unit...</option>
              {uoms.filter(u => u.isActive && u.unitOfMeasureId.toString() !== unit1.uomId).map(u => (
                <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Unit 2 - Conversion Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Conversion Factor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 20"
                value={unit2.conversionFactorToBase}
                onChange={e => onUnit2Change({ ...unit2, conversionFactorToBase: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-500">per {unit1Name.toLowerCase()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              How many {unit2Name.toLowerCase()} = 1 {unit1Name.toLowerCase()}?
            </p>
          </div>

          {/* Unit 2 - Cost Price (Auto-Calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cost Price per {unit2Name.toLowerCase()}{' '}
              <span className="text-amber-600 text-xs font-normal">(auto-calculated)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-500">Rs</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={unit2.costPrice || autoCalculated.unit2CostPrice}
                onChange={e => onUnit2Change({ ...unit2, costPrice: e.target.value })}
                className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rs {unit1.costPrice} ÷ {unit2.conversionFactorToBase} = Rs {autoCalculated.unit2CostPrice}
            </p>
          </div>

          {/* Unit 2 - Unit Price (Auto-Calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Selling Price per {unit2Name.toLowerCase()}{' '}
              <span className="text-amber-600 text-xs font-normal">(auto-calculated)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-500">Rs</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={unit2.unitPrice || autoCalculated.unit2UnitPrice}
                onChange={e => onUnit2Change({ ...unit2, unitPrice: e.target.value })}
                className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rs {unit1.unitPrice} ÷ {unit2.conversionFactorToBase} = Rs {autoCalculated.unit2UnitPrice}
            </p>
          </div>

          {/* Unit 2 - MRP (Auto-Calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              MRP per {unit2Name.toLowerCase()}{' '}
              <span className="text-amber-600 text-xs font-normal">(auto-calculated)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-500">Rs</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={unit2.mrp || autoCalculated.unit2Mrp}
                onChange={e => onUnit2Change({ ...unit2, mrp: e.target.value })}
                className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rs {unit1.mrp} ÷ {unit2.conversionFactorToBase} = Rs {autoCalculated.unit2Mrp}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

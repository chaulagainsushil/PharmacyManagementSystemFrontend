'use client';

import { useEffect, useState } from 'react';
import { Calculator, ArrowRight, Package, Box } from 'lucide-react';

interface UnitCalculatorProps {
  /** Label for the full unit (e.g., "Box", "Packet", "Strip") */
  fullUnitLabel?: string;
  /** Label for the sub unit (e.g., "Strip", "Tablet", "Piece") */
  subUnitLabel?: string;
  /** Current full unit quantity */
  fullUnitQuantity?: number;
  /** Pieces per full unit (conversion factor) */
  piecesPerFullUnit?: number;
  /** Callback when values change */
  onChange?: (data: { fullUnits: number; piecesPerUnit: number; totalPieces: number }) => void;
}

export function UnitCalculator({
  fullUnitLabel = 'Box',
  subUnitLabel = 'Strip',
  fullUnitQuantity = 0,
  piecesPerFullUnit = 1,
  onChange,
}: UnitCalculatorProps) {
  const [fullUnits, setFullUnits] = useState(fullUnitQuantity);
  const [piecesPerUnit, setPiecesPerUnit] = useState(piecesPerFullUnit);
  const totalPieces = fullUnits * piecesPerUnit;

  useEffect(() => {
    setFullUnits(fullUnitQuantity);
  }, [fullUnitQuantity]);

  useEffect(() => {
    setPiecesPerUnit(piecesPerFullUnit);
  }, [piecesPerFullUnit]);

  useEffect(() => {
    onChange?.({ fullUnits, piecesPerUnit, totalPieces });
  }, [fullUnits, piecesPerUnit, totalPieces, onChange]);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-amber-900">Quantity Calculator</h3>
      </div>

      {/* Three-tier unit breakdown */}
      <div className="grid grid-cols-3 gap-3 items-end">
        {/* Full Unit Input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            <Box className="inline h-4 w-4 mr-1 text-amber-600" />
            {fullUnitLabel}s
          </label>
          <input
            type="number"
            min={0}
            value={fullUnits}
            onChange={e => setFullUnits(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1 font-medium">Full Units</p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="text-center">
            <ArrowRight className="h-5 w-5 text-amber-600 mx-auto" />
            <p className="text-xs font-medium text-amber-700 mt-1">×</p>
          </div>
        </div>

        {/* Conversion Factor Input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            <Package className="inline h-4 w-4 mr-1 text-amber-600" />
            {subUnitLabel}s per {fullUnitLabel}
          </label>
          <input
            type="number"
            min={1}
            step="1"
            value={piecesPerUnit}
            onChange={e => setPiecesPerUnit(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            placeholder="1"
          />
          <p className="text-xs text-gray-500 mt-1 font-medium">Conversion</p>
        </div>
      </div>

      {/* Calculation Result */}
      <div className="rounded-lg border-2 border-amber-400 bg-white p-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-amber-600">{fullUnits}</p>
            <p className="text-xs text-gray-600 font-medium">{fullUnitLabel}(s)</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-xl font-bold text-gray-400">×</div>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{piecesPerUnit}</p>
            <p className="text-xs text-gray-600 font-medium">{subUnitLabel}s/pack</p>
          </div>
        </div>

        <div className="mt-3 border-t-2 border-amber-200 pt-3">
          <p className="text-center text-xs text-gray-600 font-medium mb-1">Total</p>
          <div className="flex items-center justify-center gap-2">
            <div className="text-3xl font-bold text-emerald-600">{totalPieces}</div>
            <div className="text-sm text-emerald-600 font-semibold">{subUnitLabel}s</div>
          </div>
        </div>
      </div>

      {/* Info text */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Formula:</span> {fullUnits} {fullUnitLabel}(s) × {piecesPerUnit} {subUnitLabel}s/pack = <span className="font-bold text-emerald-600">{totalPieces} total {subUnitLabel}s</span>
        </p>
      </div>
    </div>
  );
}

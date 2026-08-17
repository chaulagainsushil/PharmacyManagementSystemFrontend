'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { medicineService } from '@/services/medicineService';
import { uomService } from '@/services/uomService';
import { categoryService } from '@/services/categoryService';
import { manufacturerService } from '@/services/manufacturerService';
import { LoadingSpinner } from './LoadingSpinner';
import type {
  UnitOfMeasure, Category, Manufacturer, CreateMedicineDto, CreateMedicineUnitDto,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Unit1State {
  uomId: string;
  quantity: string;           // Number of base units (e.g. 10 strips)
  piecesPerUnit: string;      // Conversion factor (e.g. 10 tablets per strip)
  mrp: string;
  sellPrice: string;
  purchasePrice: string;
}

interface Unit2State {
  uomId: string;
  primaryStockQty: string;    // Atomic unit count (auto-calculated, editable)
  mrp: string;
  sellPrice: string;
  purchasePrice: string;
  mrpManual: boolean;
  sellManual: boolean;
  purchaseManual: boolean;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddMedicineForm({ onSuccess, onCancel }: Props) {
  // Lookups
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Medicine info
  const [medicineName, setMedicineName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reorderLevel, setReorderLevel] = useState('20');

  // Unit 1 (Base Unit / Strip)
  const [unit1, setUnit1] = useState<Unit1State>({
    uomId: '',
    quantity: '',
    piecesPerUnit: '',
    mrp: '',
    sellPrice: '',
    purchasePrice: '',
  });

  // Unit 2 (Sub Unit / Tablet) — shown always as "atomic unit"
  const [unit2, setUnit2] = useState<Unit2State>({
    uomId: '',
    primaryStockQty: '',
    mrp: '',
    sellPrice: '',
    purchasePrice: '',
    mrpManual: false,
    sellManual: false,
    purchaseManual: false,
  });

  const [showUnit2, setShowUnit2] = useState(true);

  // Extra units (for "+ Add Another Unit" button)
  const [extraUnits, setExtraUnits] = useState<Unit1State[]>([]);

  // ── Load lookups ────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const [u, c, m] = await Promise.all([
          uomService.getAll(),
          categoryService.getAll(),
          manufacturerService.getAll(),
        ]);
        setUoms(u);
        setCategories(c);
        setManufacturers(m);
      } catch {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Auto-calculations ────────────────────────────────────────────────────────

  // totalPieces = quantity × piecesPerUnit
  const totalPieces = (() => {
    const qty = parseFloat(unit1.quantity) || 0;
    const pieces = parseFloat(unit1.piecesPerUnit) || 0;
    return qty * pieces;
  })();

  // Unit 2 primary stock qty = totalPieces (auto)
  const unit2AutoQty = totalPieces > 0 ? String(totalPieces) : '';

  // When totalPieces changes, update unit2 qty if not manually set
  useEffect(() => {
    setUnit2(prev => ({ ...prev, primaryStockQty: unit2AutoQty }));
  }, [unit2AutoQty]);

  // Auto-calculate unit2 prices from unit1 prices / totalPieces
  useEffect(() => {
    if (totalPieces <= 0) return;

    setUnit2(prev => ({
      ...prev,
      mrp: prev.mrpManual ? prev.mrp : (parseFloat(unit1.mrp) / totalPieces).toFixed(2),
      sellPrice: prev.sellManual ? prev.sellPrice : (parseFloat(unit1.sellPrice) / totalPieces).toFixed(2),
      purchasePrice: prev.purchaseManual ? prev.purchasePrice : (parseFloat(unit1.purchasePrice) / totalPieces).toFixed(2),
    }));
  }, [unit1.mrp, unit1.sellPrice, unit1.purchasePrice, totalPieces]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const u1 = (field: keyof Unit1State, value: string) =>
    setUnit1(prev => ({ ...prev, [field]: value }));

  const u2 = (field: keyof Unit2State, value: string | boolean) =>
    setUnit2(prev => ({ ...prev, [field]: value }));

  const unit1UomName = uoms.find(u => u.unitOfMeasureId.toString() === unit1.uomId)?.name ?? 'Unit 1';
  const unit2UomName = uoms.find(u => u.unitOfMeasureId.toString() === unit2.uomId)?.name ?? 'Unit 2';
  const availableUnit2Uoms = uoms.filter(u => u.isActive && u.unitOfMeasureId.toString() !== unit1.uomId);

  // Conversion summary: "1 Strip = 10 Tablets"
  const conversionLabel = (() => {
    if (!unit1.uomId || !unit2.uomId || !unit1.piecesPerUnit) return null;
    return `1 ${unit1UomName} = ${unit1.piecesPerUnit} ${unit2UomName}s`;
  })();

  // Inventory summary
  const unitsConfigured = [unit1.uomId, showUnit2 ? unit2.uomId : ''].filter(Boolean).length;

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!medicineName.trim()) return 'Medicine name is required';
    if (!unit1.uomId) return 'Select a base unit type (Unit 1)';
    if (!unit1.quantity || parseFloat(unit1.quantity) <= 0) return 'Unit 1 quantity must be > 0';
    if (!unit1.piecesPerUnit || parseFloat(unit1.piecesPerUnit) <= 0) return 'Conversion factor (pieces per unit) must be > 0';
    if (showUnit2) {
      if (!unit2.uomId) return 'Select Unit 2 type';
      if (unit2.uomId === unit1.uomId) return 'Unit 2 must be different from Unit 1';
    }
    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      const units: CreateMedicineUnitDto[] = [];

      // Unit 2 — atomic/smallest unit (Tablet level) - THIS IS THE BASE UNIT
      if (showUnit2 && unit2.uomId) {
        units.push({
          unitOfMeasureId: parseInt(unit2.uomId),
          conversionFactorToBase: 1, // Base unit always has factor of 1
          costPrice: parseFloat(unit2.purchasePrice) || 0,
          unitPrice: parseFloat(unit2.sellPrice) || 0,
          mrp: parseFloat(unit2.mrp) || 0,
          isBaseUnit: true, // This is the base unit (smallest/atomic unit)
          isDefault: false, // Not default for POS
          canPurchase: false,
          canSell: true,
        });
      }

      // Unit 1 — packaging unit (Strip/Box level) - THIS CONVERTS TO BASE UNIT
      units.push({
        unitOfMeasureId: parseInt(unit1.uomId),
        conversionFactorToBase: showUnit2 ? (parseFloat(unit1.piecesPerUnit) || 1) : 1, // Factor = 1 if it's the base unit
        costPrice: parseFloat(unit1.purchasePrice) || 0,
        unitPrice: parseFloat(unit1.sellPrice) || 0,
        mrp: parseFloat(unit1.mrp) || 0,
        isBaseUnit: !showUnit2, // Base unit only if Unit 2 is not shown
        isDefault: true, // Default for POS
        canPurchase: true,
        canSell: true,
      });

      const dto: CreateMedicineDto = {
        name: medicineName.trim(),
        genericName: genericName.trim() || undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        manufacturerId: manufacturerId ? parseInt(manufacturerId) : undefined,
        reorderLevel: parseInt(reorderLevel) || 20,
        requiresPrescription: false,
        isActive: true,
        units,
      };

      await medicineService.create(dto);
      toast.success(`Medicine "${medicineName}" added successfully!`);
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save medicine');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner className="h-6 w-6 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Section 1: Medicine Information ──────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Section header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-white border border-gray-200">
            <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">Medicine Information</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Row 1: Name, Generic Name, Manufacturer, Category */}
          <div className="grid grid-cols-4 gap-3">
            {/* Medicine Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Paracetamol 500mg"
                  value={medicineName}
                  onChange={e => setMedicineName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  autoFocus
                />
              </div>
            </div>

            {/* Generic Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Generic Name</label>
              <input
                type="text"
                placeholder="Paracetamol"
                value={genericName}
                onChange={e => setGenericName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Manufacturer</label>
              <div className="relative">
                <select
                  value={manufacturerId}
                  onChange={e => setManufacturerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                >
                  <option value="">Select...</option>
                  {manufacturers.map(m => (
                    <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>
                  ))}
                </select>
                <svg className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                >
                  <option value="">Select...</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                  ))}
                </select>
                <svg className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Row 2: Derived info tags (dosage, form) */}
          {(unit1.uomId || medicineName) && (
            <div className="flex gap-2 flex-wrap">
              {genericName && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Dosage: {genericName}
                </span>
              )}
              {unit2.uomId && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Form: {unit2UomName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Unit & Pricing Configuration ───────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Section header */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-800">Unit &amp; Pricing Configuration</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure multiple units (Strips, Tablets) dynamically loaded from the Unit table. Define conversion rates and specific prices for each tier.
          </p>
        </div>

        {/* Dual panels */}
        <div className="px-4 pb-4">
          <div className="flex items-stretch gap-0">

            {/* ── Unit 1 Panel (Base Unit) ── */}
            <div className="flex-1 rounded-xl border-2 border-blue-400 bg-white p-4 space-y-3">
              <h4 className="text-sm font-semibold text-blue-700">
                Unit 1 — Base Unit ({unit1UomName !== 'Unit 1' ? unit1UomName : 'Strip'})
              </h4>

              {/* Row: Unit Type, Quantity, Conversion */}
              <div className="grid grid-cols-3 gap-3">
                {/* Unit Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Unit Type</label>
                  <div className="relative">
                    <select
                      value={unit1.uomId}
                      onChange={e => u1('uomId', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    >
                      <option value="">Select</option>
                      {uoms.filter(u => u.isActive).map(u => (
                        <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>{u.name}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Loaded from Unit table</p>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={unit1.quantity}
                      onChange={e => u1('quantity', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Number of base units</p>
                </div>

                {/* Conversion / Pieces per Unit */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Conversion / Pieces per Unit</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={unit1.piecesPerUnit}
                      onChange={e => u1('piecesPerUnit', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {/* Calculated total badge */}
                    {totalPieces > 0 && (
                      <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-2 text-xs font-semibold text-gray-500">
                        {totalPieces}
                      </span>
                    )}
                  </div>
                  {unit1.quantity && unit1.piecesPerUnit && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {unit1.quantity} {unit1UomName}s × {unit1.piecesPerUnit} {unit2UomName !== 'Unit 2' ? unit2UomName : 'Tablet'}s = Calculated total pieces
                    </p>
                  )}
                </div>
              </div>

              {/* Row: MRP, Sell Price, Purchase Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">MRP</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="500"
                      value={unit1.mrp}
                      onChange={e => u1('mrp', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sell Price</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="450"
                      value={unit1.sellPrice}
                      onChange={e => u1('sellPrice', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="400"
                      value={unit1.purchasePrice}
                      onChange={e => u1('purchasePrice', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Breakdown summary */}
              {totalPieces > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <span>📦</span>
                  <span>
                    {unit1.quantity} {unit1UomName}s × 📋 {unit1.piecesPerUnit} {unit2UomName !== 'Unit 2' ? unit2UomName : 'Tablets'} = 📋 {totalPieces} {unit2UomName !== 'Unit 2' ? unit2UomName : 'Tablets'}
                  </span>
                </div>
              )}
            </div>

            {/* ── Middle arrow + conversion label ── */}
            <div className="flex flex-col items-center justify-center px-3 gap-1 shrink-0">
              <ChevronRight className="h-5 w-5 text-gray-400" />
              {conversionLabel && (
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-600 leading-tight">1 {unit1UomName} =</p>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{unit1.piecesPerUnit} {unit2UomName !== 'Unit 2' ? unit2UomName : 'Tablets'}</p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Conversion</p>
                </div>
              )}
            </div>

            {/* ── Unit 2 Panel (Sub Unit / Atomic) ── */}
            {showUnit2 && (
              <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Unit 2 — {unit2UomName !== 'Unit 2' ? unit2UomName : 'Tablet'}
                  </h4>
                </div>

                {/* Row: Unit Type, Primary Stock Qty */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Type</label>
                    <div className="relative">
                      <select
                        value={unit2.uomId}
                        onChange={e => u2('uomId', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      >
                        <option value="">Select</option>
                        {availableUnit2Uoms.map(u => (
                          <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>{u.name}</option>
                        ))}
                      </select>
                      <svg className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Quantity derived from Unit 1 Conversion</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Primary Stock Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={unit2.primaryStockQty}
                      onChange={e => u2('primaryStockQty', e.target.value)}
                      placeholder="100"
                      className="w-full rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">Total pieces of tablets</p>
                  </div>
                </div>

                {/* "This is the atomic unit." label */}
                {unit2.uomId && (
                  <p className="text-xs font-semibold text-gray-700">This is the atomic unit.</p>
                )}

                {/* Row: MRP, Sell Price, Purchase Price (auto-calculated) */}
                <div className="grid grid-cols-3 gap-3">
                  {/* MRP */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">MRP</label>
                    {/* Source fraction label */}
                    {!unit2.mrpManual && unit1.mrp && totalPieces > 0 && (
                      <div className="mb-1 flex items-center gap-0.5 text-[10px] text-gray-400">
                        <span className="rounded bg-gray-100 px-1 py-0.5">Rs. {parseFloat(unit1.mrp).toFixed(0)}</span>
                        <span>/</span>
                        <span className="rounded bg-gray-100 px-1 py-0.5">{totalPieces}</span>
                      </div>
                    )}
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unit2.mrp}
                        onChange={e => { u2('mrp', e.target.value); u2('mrpManual', true); }}
                        placeholder="5.00"
                        className={`w-full rounded-lg pl-8 pr-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-100 ${
                          unit2.mrpManual
                            ? 'border border-gray-200 focus:border-blue-400'
                            : 'border border-amber-200 bg-amber-50 focus:border-blue-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Sell Price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sell Price</label>
                    {!unit2.sellManual && unit1.sellPrice && totalPieces > 0 && (
                      <div className="mb-1 flex items-center gap-0.5 text-[10px] text-gray-400">
                        <span className="rounded bg-gray-100 px-1 py-0.5">Rs. {parseFloat(unit1.sellPrice).toFixed(0)}</span>
                        <span>/</span>
                        <span className="rounded bg-gray-100 px-1 py-0.5">{totalPieces}</span>
                      </div>
                    )}
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unit2.sellPrice}
                        onChange={e => { u2('sellPrice', e.target.value); u2('sellManual', true); }}
                        placeholder="4.50"
                        className={`w-full rounded-lg pl-8 pr-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-100 ${
                          unit2.sellManual
                            ? 'border border-gray-200 focus:border-blue-400'
                            : 'border border-amber-200 bg-amber-50 focus:border-blue-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Price</label>
                    {!unit2.purchaseManual && unit1.purchasePrice && totalPieces > 0 && (
                      <div className="mb-1 flex items-center gap-0.5 text-[10px] text-gray-400">
                        <span className="rounded bg-gray-100 px-1 py-0.5">Rs. {parseFloat(unit1.purchasePrice).toFixed(0)}</span>
                        <span>/</span>
                        <span className="rounded bg-gray-100 px-1 py-0.5">{totalPieces}</span>
                      </div>
                    )}
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unit2.purchasePrice}
                        onChange={e => { u2('purchasePrice', e.target.value); u2('purchaseManual', true); }}
                        placeholder="4.00"
                        className={`w-full rounded-lg pl-8 pr-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-100 ${
                          unit2.purchaseManual
                            ? 'border border-gray-200 focus:border-blue-400'
                            : 'border border-amber-200 bg-amber-50 focus:border-blue-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Derived price explanation */}
                {unit2.sellPrice && !unit2.sellManual && unit1.sellPrice && (
                  <p className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1.5 leading-relaxed">
                    Prices derived from primary stock unit of {totalPieces} {unit2UomName !== 'Unit 2' ? unit2UomName : 'Tablets'}: {unit2UomName !== 'Unit 2' ? unit2UomName : 'Tablet'} Sell: Rs. {parseFloat(unit2.sellPrice).toFixed(2)}, MRP: Rs. {parseFloat(unit2.mrp || '0').toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* + Add Another Unit */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowUnit2(!showUnit2)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {showUnit2 ? 'Remove Unit 2' : '+ Add Another Unit'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 3: Inventory Summary ──────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Inventory Summary</h3>
        <div className="flex items-center gap-6">
          {/* Summary tiles */}
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Base Unit</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {unit1UomName !== 'Unit 1' ? unit1UomName : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Available Base Quantity</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {unit1.quantity || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total Pieces</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {totalPieces > 0 ? totalPieces : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Units Configured</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{unitsConfigured}</p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Minimum/Reorder Level */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Minimum/Reorder Level</label>
            <input
              type="number"
              min="0"
              value={reorderLevel}
              onChange={e => setReorderLevel(e.target.value)}
              className="w-20 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-center"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {submitting && <LoadingSpinner className="h-3.5 w-3.5 text-white" />}
              Save Medicine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

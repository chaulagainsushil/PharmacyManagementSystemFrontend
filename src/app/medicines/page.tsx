'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Search, Pill, ListPlus,
  CheckCircle, XCircle, ChevronDown, ChevronUp, X, Settings,
  Crown, Gem, Shield, Sparkles, ShoppingCart, DollarSign, Tag,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { FormField, SelectField } from '@/components/ui/FormField';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnitsManager } from '@/components/ui/UnitsManager';
import { SimpleMedicineUnitForm } from '@/components/ui/SimpleMedicineUnitForm';
import { SimpleDualUnitEditor } from '@/components/ui/SimpleDualUnitEditor';
import { UnitCalculator } from '@/components/ui/UnitCalculator';
import { medicineService } from '@/services/medicineService';
import { categoryService } from '@/services/categoryService';
import { manufacturerService } from '@/services/manufacturerService';
import { uomService } from '@/services/uomService';
import { useAuth } from '@/context/AuthContext';
import type {
  Medicine, CreateMedicineDto, UpdateMedicineDto, Category, Manufacturer,
  BulkCreateMedicineItemResult, UnitOfMeasure, CreateMedicineUnitDto,
} from '@/types';

// ── Medicine Limit Upgrade Modal ──────────────────────────────────────────────

function MedicineLimitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  const plans = [
    {
      name: 'Silver',
      price: 'Rs 999',
      duration: '6 months',
      Icon: Shield,
      color: 'text-slate-700',
      bg: 'bg-slate-50',
      border: 'border-slate-300',
    },
    {
      name: 'Gold',
      price: 'Rs 1,799',
      duration: '1 year',
      Icon: Crown,
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      popular: true,
    },
    {
      name: 'Diamond',
      price: 'Rs 4,999',
      duration: 'Lifetime',
      Icon: Gem,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
      border: 'border-indigo-400',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="" size="lg">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
          <Sparkles className="h-7 w-7 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Medicine Limit Reached</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your free trial allows up to <span className="font-semibold text-gray-700">20 medicines</span>.
          Upgrade to a paid plan for unlimited medicine management.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border-2 ${plan.border} ${plan.bg} p-4 text-center`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500 px-2.5 py-0.5 text-xs font-bold text-white">
                Popular
              </span>
            )}
            <plan.Icon className={`mx-auto mb-2 h-6 w-6 ${plan.color}`} />
            <p className={`font-bold text-sm ${plan.color}`}>{plan.name}</p>
            <p className="text-lg font-extrabold text-gray-900 mt-1">{plan.price}</p>
            <p className="text-xs text-gray-500">{plan.duration}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Unlimited medicines</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Maybe Later
        </button>
        <button
          onClick={() => { onClose(); router.push('/subscription/billing'); }}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow"
        >
          Upgrade Now
        </button>
      </div>
    </Modal>
  );
}

// ── Inline Unit Editor ─────────────────────────────────────────────────────────

interface InlineUnit {
  id: string;
  uomId: string;
  conversionFactorToBase: string;
  canPurchase: boolean;
  canSell: boolean;
  costPrice: string;
  unitPrice: string;
  mrp: string;
  isBase: boolean;
  isDefault: boolean;
}

function defaultInlineUnits(): InlineUnit[] {
  return [
    {
      id: '1',
      uomId: '',
      conversionFactorToBase: '1',
      canPurchase: false,
      canSell: true,
      costPrice: '',
      unitPrice: '',
      mrp: '',
      isBase: true,
      isDefault: false,
    },
    {
      id: '2',
      uomId: '',
      conversionFactorToBase: '',
      canPurchase: false,
      canSell: true,
      costPrice: '',
      unitPrice: '',
      mrp: '',
      isBase: false,
      isDefault: true,
    },
  ];
}

interface InlineUnitsEditorProps {
  units: InlineUnit[];
  uoms: UnitOfMeasure[];
  onChange: (units: InlineUnit[]) => void;
}

function InlineUnitsEditor({ units, uoms, onChange }: InlineUnitsEditorProps) {
  const usedIds = units.map(u => u.uomId).filter(Boolean);

  const update = (id: string, field: keyof InlineUnit, value: string | boolean) => {
    onChange(units.map(u => {
      if (u.id !== id) {
        if (field === 'isDefault' && value === true) return { ...u, isDefault: false };
        if (field === 'isBase' && value === true) return { ...u, isBase: false };
        return u;
      }
      const updated = { ...u, [field]: value };
      if (field === 'isBase' && value === true) updated.conversionFactorToBase = '1';
      return updated;
    }));
  };

  // Calculate the unit hierarchy for display
  const baseUnit = units.find(u => u.isBase);
  const nonBaseUnits = units.filter(u => !u.isBase);
  const baseUomName = uoms.find(x => x.unitOfMeasureId.toString() === baseUnit?.uomId)?.name || 'Base Unit';

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-indigo-800">Units of Measure & Breakdown</p>
        <p className="text-xs text-indigo-400 mt-0.5">
          Define units with pricing, conversion factors, and purchase/sale flags. The breakdown shows: Full Unit → Sub Unit → Base Unit ({baseUomName}).
        </p>
      </div>

      {/* Unit Hierarchy Visualization */}
      {nonBaseUnits.length > 0 && baseUnit && (
        <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-3">
          <p className="text-xs font-semibold text-purple-800 mb-2">📊 Unit Hierarchy</p>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {nonBaseUnits.map((u, idx) => {
              const uom = uoms.find(x => x.unitOfMeasureId.toString() === u.uomId);
              const baseFactor = Number(u.conversionFactorToBase) || 1;
              return (
                <div key={u.id} className="flex items-center gap-1">
                  <div className="px-2.5 py-1.5 rounded-lg bg-white border border-purple-300 font-semibold text-purple-700">
                    {uom?.name || 'Unit'}
                  </div>
                  {idx < nonBaseUnits.length - 1 && <div className="text-purple-500 font-bold">→</div>}
                </div>
              );
            })}
            <div className="text-purple-500 font-bold">→</div>
            <div className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold">
              {baseUomName} (Base)
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {units.map((u, idx) => {
          const availableUoms = uoms.filter(x => x.isActive && (x.unitOfMeasureId.toString() === u.uomId || !usedIds.includes(x.unitOfMeasureId.toString())));
          const selectedUom = uoms.find(x => x.unitOfMeasureId.toString() === u.uomId);

          return (
            <div key={u.id} className={`rounded-xl border bg-white p-4 space-y-3 ${u.isBase ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'}`}>
              {/* Header: Unit Type Flags */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Unit {idx + 1}</span>
                <div className="flex gap-3 flex-wrap justify-end">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="baseUnit"
                      checked={u.isBase}
                      onChange={() => update(u.id, 'isBase', true)}
                      className="h-3.5 w-3.5 accent-indigo-600"
                    />
                    <span className={`text-xs font-semibold ${u.isBase ? 'text-indigo-700' : 'text-gray-400'}`}>Base Unit</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultUnit"
                      checked={u.isDefault}
                      onChange={() => update(u.id, 'isDefault', true)}
                      className="h-3.5 w-3.5 accent-yellow-500"
                    />
                    <span className={`text-xs font-semibold ${u.isDefault ? 'text-yellow-600' : 'text-gray-400'}`}>★ Default</span>
                  </label>
                </div>
              </div>

              {/* Row 1: UoM selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Unit of Measure *</label>
                <select
                  value={u.uomId}
                  onChange={e => update(u.id, 'uomId', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Select —</option>
                  {availableUoms.map(x => (
                    <option key={x.unitOfMeasureId} value={x.unitOfMeasureId}>
                      {x.name} ({x.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 2: Conversion factor (only for non-base units) */}
              {!u.isBase && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Conversion Factor (how many base units = 1 {selectedUom?.symbol || 'unit'}) *
                  </label>
                  <input
                    type="number"
                    min={0.000001}
                    step="0.01"
                    placeholder="e.g. 10"
                    value={u.conversionFactorToBase}
                    onChange={e => update(u.id, 'conversionFactorToBase', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              )}

              {/* Row 3: Pricing (Cost Price, Unit Price, MRP) */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <ShoppingCart className="inline h-3 w-3 mr-0.5" />
                    Cost Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={u.costPrice}
                    onChange={e => update(u.id, 'costPrice', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <DollarSign className="inline h-3 w-3 mr-0.5" />
                    Sale Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={u.unitPrice}
                    onChange={e => update(u.id, 'unitPrice', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <Tag className="inline h-3 w-3 mr-0.5" />
                    MRP
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={u.mrp}
                    onChange={e => update(u.id, 'mrp', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Row 4: Can Purchase / Can Sell flags */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={u.canPurchase}
                    onChange={e => update(u.id, 'canPurchase', e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-green-600"
                  />
                  <span className="text-xs font-medium text-gray-600">Can Purchase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={u.canSell}
                    onChange={e => update(u.id, 'canSell', e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-blue-600"
                  />
                  <span className="text-xs font-medium text-gray-600">Can Sell</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-indigo-500 bg-indigo-50 rounded px-2 py-1">
        💡 Leave unit dropdowns empty to skip — you can add more units later.
      </p>
    </div>
  );
}

// ── Bulk Entry Form ───────────────────────────────────────────────────────────

type BulkRow = CreateMedicineDto & { _id: string };

function newRow(): BulkRow {
  return {
    _id: Math.random().toString(36).slice(2),
    name: '',
    genericName: '',
    categoryId: undefined,
    manufacturerId: undefined,
    reorderLevel: 10,
    requiresPrescription: false,
    isActive: true,
    units: [],
  };
}

interface BulkFormProps {
  categories: Category[];
  manufacturers: Manufacturer[];
  uoms: UnitOfMeasure[];
  onAdd: (row: BulkRow) => void;
}

function BulkEntryForm({ categories, manufacturers, uoms, onAdd }: BulkFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMedicineDto>();
  const [localUnits, setLocalUnits] = useState<InlineUnit[]>(defaultInlineUnits());
  const [calculatorData, setCalculatorData] = useState({ fullUnits: 0, piecesPerUnit: 1, totalPieces: 0 });

  const onSubmit = (data: CreateMedicineDto) => {
    const filledUnits = localUnits.filter(u => u.uomId);
    if (filledUnits.length === 0) {
      toast.error('Add at least one unit');
      return;
    }

    const unitDtos = buildUnitDtos(filledUnits);
    if (!unitDtos) return;

    onAdd({
      ...data,
      _id: Math.random().toString(36).slice(2),
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      manufacturerId: data.manufacturerId ? Number(data.manufacturerId) : undefined,
      reorderLevel: Number(data.reorderLevel) || 10,
      units: unitDtos,
    });

    reset({ reorderLevel: 10, isActive: true, requiresPrescription: false });
    setLocalUnits(defaultInlineUnits());
  };

  const buildUnitDtos = (units: InlineUnit[]): CreateMedicineUnitDto[] | null => {
    const baseCount = units.filter(u => u.isBase).length;
    const defaultCount = units.filter(u => u.isDefault).length;
    if (baseCount === 0) { toast.error('Select a base unit'); return null; }
    if (defaultCount === 0) { toast.error('Select a default unit'); return null; }

    return units.map(u => ({
      unitOfMeasureId: Number(u.uomId),
      conversionFactorToBase: u.isBase ? 1 : (Number(u.conversionFactorToBase) || 1),
      canPurchase: u.canPurchase,
      canSell: u.canSell,
      costPrice: Number(u.costPrice) || 0,
      unitPrice: Number(u.unitPrice) || 0,
      mrp: Number(u.mrp) || 0,
      isBaseUnit: u.isBase,
      isDefault: u.isDefault,
    }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">New Medicine Entry</p>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField
            label="Medicine Name *"
            placeholder="e.g. Paracetamol 500mg"
            error={errors.name?.message}
            {...register('name', { required: 'Required' })}
          />
        </div>
        <FormField label="Generic Name" placeholder="e.g. Acetaminophen" {...register('genericName')} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
          <select
            {...register('categoryId')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">— None —</option>
            {categories.map(c => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Manufacturer</label>
          <select
            {...register('manufacturerId')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">— None —</option>
            {manufacturers.map(m => (
              <option key={m.manufacturerId} value={m.manufacturerId}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <FormField
          label="Reorder Level"
          type="number"
          min={0}
          {...register('reorderLevel')}
        />
        <div className="col-span-2 flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded text-blue-600" {...register('isActive')} defaultChecked />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded text-purple-600"
              {...register('requiresPrescription')}
            />
            Requires Prescription
          </label>
        </div>
      </div>

      {/* Inline Units */}
      <InlineUnitsEditor units={localUnits} uoms={uoms} onChange={setLocalUnits} />

      {/* Unit Quantity Calculator */}
      <UnitCalculator
        fullUnitLabel={uoms.find(x => x.unitOfMeasureId.toString() === localUnits[0]?.uomId)?.name || 'Packet'}
        subUnitLabel={uoms.find(x => x.unitOfMeasureId.toString() === localUnits[1]?.uomId)?.name || 'Piece'}
        fullUnitQuantity={calculatorData.fullUnits}
        piecesPerFullUnit={Number(localUnits[0]?.conversionFactorToBase) || 1}
        onChange={setCalculatorData}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add to List
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MedicinesPage() {
  const { subscription } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Single add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [saving, setSaving] = useState(false);
  const [inlineUnits, setInlineUnits] = useState<InlineUnit[]>(defaultInlineUnits());

  // Dual unit state (for inline form)
  const [unit1, setUnit1] = useState({ uomId: '', conversionFactorToBase: '', costPrice: '', unitPrice: '', mrp: '' });
  const [unit2, setUnit2] = useState({ uomId: '', conversionFactorToBase: '', costPrice: '', unitPrice: '', mrp: '' });
  const [showUnit2, setShowUnit2] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Units modal
  const [unitsTarget, setUnitsTarget] = useState<Medicine | null>(null);
  const [showUnitForm, setShowUnitForm] = useState(false);

  // Quantity calculator state
  const [calculatorData, setCalculatorData] = useState({ fullUnits: 0, piecesPerUnit: 1, totalPieces: 0 });

  // Bulk modal
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkCreateMedicineItemResult[] | null>(null);

  // Medicine limit modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const isAtLimit =
    subscription?.medicineLimit != null && medicines.length >= subscription.medicineLimit;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMedicineDto>();

  // Load metadata
  const loadMeta = useCallback(async () => {
    const [cats, mfgs, allUoms] = await Promise.all([
      categoryService.getAll(),
      manufacturerService.getAll(),
      uomService.getAll(),
    ]);
    setCategories(cats);
    setManufacturers(mfgs);
    setUoms(allUoms);
  }, []);

  const loadAll = useCallback(async () => {
    const meds = await medicineService.getAll();
    setMedicines(meds);
  }, []);

  useEffect(() => {
    Promise.all([loadMeta(), loadAll()]).finally(() => setLoading(false));
  }, [loadMeta, loadAll]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = value.trim()
          ? await medicineService.search(value.trim())
          : await medicineService.getAll();
        setMedicines(results);
      } catch { /* silently retain */ }
      finally {
        setSearching(false);
      }
    }, 350);
  };

  const clearSearch = () => {
    setSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    medicineService.getAll().then(setMedicines).catch(() => {});
  };

  const reload = useCallback(async () => {
    const results = search.trim()
      ? await medicineService.search(search.trim())
      : await medicineService.getAll();
    setMedicines(results);
  }, [search]);

  // Create/Edit modal handlers
  const openCreate = () => {
    if (isAtLimit) {
      setLimitModalOpen(true);
      return;
    }
    reset({ reorderLevel: 10, isActive: true, requiresPrescription: false });
    setInlineUnits(defaultInlineUnits());
    setUnit1({ uomId: '', conversionFactorToBase: '', costPrice: '', unitPrice: '', mrp: '' });
    setUnit2({ uomId: '', conversionFactorToBase: '', costPrice: '', unitPrice: '', mrp: '' });
    setShowUnit2(false);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = async (m: Medicine) => {
    setEditing(m);
    setModalOpen(true);
    try {
      const full = await medicineService.getById(m.medicineId);
      reset({
        name: full.name,
        genericName: full.genericName ?? undefined,
        categoryId: full.categoryId ?? undefined,
        manufacturerId: full.manufacturerId ?? undefined,
        reorderLevel: full.reorderLevel,
        requiresPrescription: full.requiresPrescription,
        isActive: full.isActive,
      });
      // Populate inline units from existing units
      if (full.units && full.units.length > 0) {
        const converted: InlineUnit[] = full.units.map((unit, idx) => ({
          id: `${idx}`,
          uomId: unit.unitOfMeasureId.toString(),
          conversionFactorToBase: unit.conversionFactorToBase.toString(),
          canPurchase: unit.canPurchase,
          canSell: unit.canSell,
          costPrice: unit.costPrice.toString(),
          unitPrice: unit.unitPrice.toString(),
          mrp: unit.mrp.toString(),
          isBase: unit.isBaseUnit,
          isDefault: unit.isDefault,
        }));
        setInlineUnits(converted);
      }
    } catch {
      toast.error('Failed to load medicine details');
      setModalOpen(false);
    }
  };

  const onSubmit = async (data: CreateMedicineDto) => {
    setSaving(true);
    try {
      // Validate Unit 1
      if (!unit1.uomId) {
        toast.error('Select Unit 1 type');
        return;
      }
      if (!unit1.costPrice || !unit1.unitPrice || !unit1.mrp) {
        toast.error('Fill in all Unit 1 prices');
        return;
      }

      // Validate Unit 2 if enabled
      if (showUnit2) {
        if (!unit2.uomId) {
          toast.error('Select Unit 2 type');
          return;
        }
        if (unit2.uomId === unit1.uomId) {
          toast.error('Unit 2 cannot be the same as Unit 1');
          return;
        }
        if (!unit2.conversionFactorToBase || parseFloat(unit2.conversionFactorToBase) <= 0) {
          toast.error('Enter valid conversion factor for Unit 2');
          return;
        }
      }

      // Build unit DTOs
      const unitDtos: CreateMedicineUnitDto[] = [];

      // Unit 1 (base unit)
      unitDtos.push({
        unitOfMeasureId: parseInt(unit1.uomId),
        conversionFactorToBase: 1,
        costPrice: parseFloat(unit1.costPrice),
        unitPrice: parseFloat(unit1.unitPrice),
        mrp: parseFloat(unit1.mrp),
        isBaseUnit: true,
        canPurchase: true,
        canSell: true,
        isDefault: true,
      });

      // Unit 2 (sub unit) if enabled
      if (showUnit2) {
        const convFactor = parseFloat(unit2.conversionFactorToBase);
        const cost = unit2.costPrice ? parseFloat(unit2.costPrice) : undefined;
        const price = unit2.unitPrice ? parseFloat(unit2.unitPrice) : undefined;
        const mrp = unit2.mrp ? parseFloat(unit2.mrp) : undefined;

        unitDtos.push({
          unitOfMeasureId: parseInt(unit2.uomId),
          conversionFactorToBase: convFactor,
          costPrice: cost,
          unitPrice: price,
          mrp: mrp,
          isBaseUnit: false,
          canPurchase: false,
          canSell: true,
          isDefault: false,
        });
      }

      const payload: CreateMedicineDto | UpdateMedicineDto = {
        name: data.name,
        genericName: data.genericName,
        categoryId: data.categoryId || null,
        manufacturerId: data.manufacturerId || null,
        reorderLevel: Number(data.reorderLevel) || 10,
        requiresPrescription: data.requiresPrescription || false,
        isActive: data.isActive !== false,
        units: unitDtos,
      };

      if (editing) {
        await medicineService.update(editing.medicineId, payload as UpdateMedicineDto);
        toast.success('Medicine updated');
      } else {
        await medicineService.create(payload as CreateMedicineDto);
        toast.success('Medicine created');
      }
      setModalOpen(false);
      await reload();
    } catch (e: any) {
      const msg: string = e.response?.data?.message ?? 'Something went wrong';
      if (
        msg.toLowerCase().includes('plan allows a maximum') ||
        msg.toLowerCase().includes('upgrade your plan')
      ) {
        setModalOpen(false);
        setLimitModalOpen(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const buildUnitDtos = (units: InlineUnit[]): CreateMedicineUnitDto[] | null => {
    const baseCount = units.filter(u => u.isBase).length;
    const defaultCount = units.filter(u => u.isDefault).length;
    if (baseCount === 0) {
      toast.error('Select a base unit');
      return null;
    }
    if (defaultCount === 0) {
      toast.error('Select a default unit');
      return null;
    }

    return units.map(u => ({
      unitOfMeasureId: Number(u.uomId),
      conversionFactorToBase: u.isBase ? 1 : (Number(u.conversionFactorToBase) || 1),
      canPurchase: u.canPurchase,
      canSell: u.canSell,
      costPrice: Number(u.costPrice) || 0,
      unitPrice: Number(u.unitPrice) || 0,
      mrp: Number(u.mrp) || 0,
      isBaseUnit: u.isBase,
      isDefault: u.isDefault,
    }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await medicineService.delete(deleteTarget.medicineId);
      toast.success('Medicine deleted');
      setDeleteTarget(null);
      await reload();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk helpers
  const openBulk = () => {
    setBulkRows([]);
    setBulkResults(null);
    setShowForm(true);
    setBulkOpen(true);
  };

  const closeBulk = () => {
    setBulkOpen(false);
    setBulkResults(null);
  };

  const handleBulkAdd = (row: BulkRow) => {
    setBulkRows(prev => [...prev, row]);
    setShowForm(false);
  };

  const removeBulkRow = (id: string) => {
    setBulkRows(prev => prev.filter(r => r._id !== id));
  };

  const submitBulk = async () => {
    if (bulkRows.length === 0) {
      toast.error('Add at least one medicine');
      return;
    }
    if (isAtLimit) {
      setBulkOpen(false);
      setLimitModalOpen(true);
      return;
    }

    setBulkSaving(true);
    try {
      const result = await medicineService.bulkCreate(bulkRows);
      setBulkResults(result.results);
      if (result.totalCreated > 0) {
        toast.success(`${result.totalCreated} medicine(s) created`);
        await reload();
      }
      if (result.totalFailed > 0) {
        const limitFailed = result.results.filter(
          r => !r.success && r.message.toLowerCase().includes('upgrade your plan')
        );
        if (limitFailed.length === result.totalFailed) {
          setBulkOpen(false);
          setLimitModalOpen(true);
        } else {
          toast.error(`${result.totalFailed} row(s) failed`);
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Bulk create failed');
    } finally {
      setBulkSaving(false);
    }
  };

  if (loading) return <AppLayout title="Medicines"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Medicines">
      {/* Trial plan medicine limit banner */}
      {subscription?.planType === 'Trial' && subscription.medicineLimit != null && (
        <div
          className={`mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm ${medicines.length >= subscription.medicineLimit
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}
        >
          <span>
            {medicines.length}/{subscription.medicineLimit} medicines used
            {medicines.length >= subscription.medicineLimit && ' — limit reached!'}
          </span>
          <button
            onClick={() => setLimitModalOpen(true)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Search & Actions Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" /> Add Medicine
          </button>
          <button
            onClick={openBulk}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ListPlus className="h-4 w-4" /> Bulk Add
          </button>
        </div>
      </div>

      {/* Medicines List */}
      {searching && (
        <div className="text-center py-8">
          <LoadingSpinner /> Searching...
        </div>
      )}

      {!searching && medicines.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
          <Pill className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-semibold text-gray-600">No medicines found</p>
          <p className="text-sm text-gray-500 mt-1">
            {search ? 'Try a different search' : 'Add your first medicine to get started'}
          </p>
        </div>
      )}

      {!searching && medicines.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Medicine</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Default Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Stock (Base)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {medicines.map(m => {
                const defaultUnit = m.units?.find(u => u.isDefault);
                const lowStock = m.totalStockInBaseUnit < (m.reorderLevel || 10);

                return (
                  <tr key={m.medicineId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{m.name}</span>
                        {m.genericName && (
                          <span className="text-xs text-gray-500">{m.genericName}</span>
                        )}
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {m.categoryName && (
                            <Badge variant="gray" className="text-xs">
                              {m.categoryName}
                            </Badge>
                          )}
                          {m.manufacturerName && (
                            <Badge variant="gray" className="text-xs">
                              {m.manufacturerName}
                            </Badge>
                          )}
                          {m.requiresPrescription && (
                            <Badge variant="yellow" className="text-xs">
                              Rx
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {defaultUnit ? (
                        <div>
                          <div className="font-semibold">
                            {defaultUnit.uomName} ({defaultUnit.uomSymbol})
                          </div>
                          <div className="text-xs text-gray-500">
                            ₹{defaultUnit.unitPrice.toFixed(2)} / ₹{defaultUnit.mrp.toFixed(2)} MRP
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No default unit</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-semibold ${lowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {m.totalStockInBaseUnit}
                      </div>
                      {lowStock && (
                        <div className="text-xs text-red-600">Low ({m.reorderLevel} min)</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          title="Edit"
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => setUnitsTarget(m)}
                          title="Manage Units"
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <Settings className="h-4 w-4" /> Units
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          title="Delete"
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Medicine' : 'Add New Medicine'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FormField
                label="Medicine Name *"
                placeholder="e.g. Paracetamol 500mg"
                error={errors.name?.message}
                {...register('name', { required: 'Medicine name is required' })}
              />
            </div>
            <FormField
              label="Generic Name"
              placeholder="e.g. Acetaminophen"
              {...register('genericName')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                {...register('categoryId')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">— None —</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacturer</label>
              <select
                {...register('manufacturerId')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">— None —</option>
                {manufacturers.map(m => (
                  <option key={m.manufacturerId} value={m.manufacturerId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <FormField
              label="Reorder Level"
              type="number"
              min={0}
              {...register('reorderLevel')}
            />
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-blue-600"
                  {...register('isActive')}
                  defaultChecked
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-purple-600"
                  {...register('requiresPrescription')}
                />
                Requires Prescription
              </label>
            </div>
          </div>

          <SimpleDualUnitEditor
            unit1={unit1}
            unit2={unit2}
            uoms={uoms}
            onUnit1Change={setUnit1}
            onUnit2Change={setUnit2}
            showUnit2={showUnit2}
            onShowUnit2Change={setShowUnit2}
          />

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? <LoadingSpinner /> : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
      />

      {/* Units Manager Modal */}
      {unitsTarget && (
        <Modal open={unitsTarget !== null} onClose={() => setUnitsTarget(null)} title={`Manage Units: ${unitsTarget.name}`} size="lg">
          <div className="space-y-6">
            {/* Tab buttons */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setShowUnitForm(false)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  !showUnitForm
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Existing Units
              </button>
              <button
                onClick={() => setShowUnitForm(true)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  showUnitForm
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Add Dual Unit
              </button>
            </div>

            {/* Content */}
            {!showUnitForm ? (
              <UnitsManager medicineId={unitsTarget.medicineId} />
            ) : (
              <SimpleMedicineUnitForm
                medicineId={unitsTarget.medicineId}
                onSuccess={() => {
                  setShowUnitForm(false);
                  reload(); // Reload medicine list to reflect new units
                }}
                onCancel={() => setShowUnitForm(false)}
              />
            )}
          </div>
        </Modal>
      )}

      {/* Bulk Modal */}
      <Modal
        open={bulkOpen}
        onClose={closeBulk}
        title="Bulk Add Medicines"
        size="xl"
      >
        {bulkResults === null ? (
          <div className="space-y-4">
            {showForm && (
              <BulkEntryForm
                categories={categories}
                manufacturers={manufacturers}
                uoms={uoms}
                onAdd={handleBulkAdd}
              />
            )}

            {bulkRows.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-700">
                    {bulkRows.length} medicine(s) ready to add
                  </span>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {showForm ? 'Hide Form' : 'Add More'}
                  </button>
                </div>
                {bulkRows.map((row, idx) => (
                  <div
                    key={row._id}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-gray-900">{row.name}</span>
                    <button
                      onClick={() => removeBulkRow(row._id)}
                      className="text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {bulkRows.length > 0 && (
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={closeBulk}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitBulk}
                  disabled={bulkSaving}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {bulkSaving ? <LoadingSpinner /> : `Create ${bulkRows.length} Medicine(s)`}
                </button>
              </div>
            )}
          </div>
        ) : (
          // Bulk Results
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {bulkResults.filter(r => r.success).length}
                </div>
                <div className="text-xs text-green-700 font-medium">Successful</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {bulkResults.filter(r => !r.success).length}
                </div>
                <div className="text-xs text-red-700 font-medium">Failed</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {bulkResults.length}
                </div>
                <div className="text-xs text-blue-700 font-medium">Total</div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-200">
              {bulkResults.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3 flex-1">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Row {result.index + 1}</div>
                      <div className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={closeBulk}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Medicine Limit Modal */}
      <MedicineLimitModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />
    </AppLayout>
  );
}

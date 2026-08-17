import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';
import { medicineService } from '@/services/medicineService';
import { uomService } from '@/services/uomService';
import { categoryService } from '@/services/categoryService';
import { manufacturerService } from '@/services/manufacturerService';
import { medicineUnitService } from '@/services/medicineUnitService';
import { LoadingSpinner } from './LoadingSpinner';
import type {
  UnitOfMeasure, Category, Manufacturer, UpdateMedicineDto, Medicine,
} from '@/types';

interface Props {
  medicineId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Unit1State {
  medicineUnitId: number;
  uomId: string;
  mrp: string;
  sellPrice: string;
  purchasePrice: string;
}

interface Unit2State {
  medicineUnitId: number;
  uomId: string;
  mrp: string;
  sellPrice: string;
  purchasePrice: string;
}

export function EditMedicineForm({ medicineId, onSuccess, onCancel }: Props) {
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [medicineName, setMedicineName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reorderLevel, setReorderLevel] = useState('20');
  const [quantityInBaseUnit, setQuantityInBaseUnit] = useState('0');

  const [unit1, setUnit1] = useState<Unit1State>({
    medicineUnitId: 0,
    uomId: '',
    mrp: '',
    sellPrice: '',
    purchasePrice: '',
  });

  const [unit2, setUnit2] = useState<Unit2State>({
    medicineUnitId: 0,
    uomId: '',
    mrp: '',
    sellPrice: '',
    purchasePrice: '',
  });

  const [hasUnit2, setHasUnit2] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, mfgs, allUoms, medicine, units] = await Promise.all([
          categoryService.getAll(),
          manufacturerService.getAll(),
          uomService.getAll(),
          medicineService.getById(medicineId),
          medicineUnitService.getByMedicine(medicineId),
        ]);

        setCategories(cats);
        setManufacturers(mfgs);
        setUoms(allUoms);

        if (medicine) {
          setMedicineName(medicine.name);
          setGenericName(medicine.genericName || '');
          setManufacturerId(medicine.manufacturerId?.toString() || '');
          setCategoryId(medicine.categoryId?.toString() || '');
          setReorderLevel(medicine.reorderLevel?.toString() || '20');
          setQuantityInBaseUnit(medicine.totalStockInBaseUnit?.toString() || '0');
          // Store the UpdatedAt timestamp for concurrency control
          setUpdatedAt(medicine.updatedAt);
        }

        if (units && units.length > 0) {
          const defaultUnit = units.find((u: any) => u.isDefault) || units[0];
          const baseUnit = units.find((u: any) => u.isBaseUnit);

          setUnit1({
            medicineUnitId: defaultUnit.medicineUnitId,
            uomId: defaultUnit.unitOfMeasureId.toString(),
            mrp: defaultUnit.mrp?.toString() || '',
            sellPrice: defaultUnit.unitPrice?.toString() || '',
            purchasePrice: defaultUnit.costPrice?.toString() || '',
          });

          if (baseUnit && baseUnit.medicineUnitId !== defaultUnit.medicineUnitId) {
            setHasUnit2(true);
            setUnit2({
              medicineUnitId: baseUnit.medicineUnitId,
              uomId: baseUnit.unitOfMeasureId.toString(),
              mrp: baseUnit.mrp?.toString() || '',
              sellPrice: baseUnit.unitPrice?.toString() || '',
              purchasePrice: baseUnit.costPrice?.toString() || '',
            });
          }
        }
      } catch (error) {
        toast.error('Failed to load medicine details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [medicineId]);

  const validate = (): string | null => {
    if (!medicineName.trim()) return 'Medicine name is required';
    if (!unit1.uomId) return 'Unit 1 type is required';
    if (!unit1.sellPrice || parseFloat(unit1.sellPrice) <= 0) return 'Unit 1 sell price must be > 0';
    if (hasUnit2) {
      if (!unit2.uomId) return 'Unit 2 type is required';
      if (!unit2.sellPrice || parseFloat(unit2.sellPrice) <= 0) return 'Unit 2 sell price must be > 0';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      const unitUpdates: any[] = [
        {
          medicineUnitId: unit1.medicineUnitId,
          costPrice: parseFloat(unit1.purchasePrice) || 0,
          unitPrice: parseFloat(unit1.sellPrice) || 0,
          mrp: parseFloat(unit1.mrp) || 0,
        },
      ];

      if (hasUnit2) {
        unitUpdates.push({
          medicineUnitId: unit2.medicineUnitId,
          costPrice: parseFloat(unit2.purchasePrice) || 0,
          unitPrice: parseFloat(unit2.sellPrice) || 0,
          mrp: parseFloat(unit2.mrp) || 0,
        });
      }

      const dto: any = {
        name: medicineName.trim(),
        genericName: genericName.trim() || undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        manufacturerId: manufacturerId ? parseInt(manufacturerId) : undefined,
        reorderLevel: parseInt(reorderLevel) || 20,
        unitUpdates,
        updatedAt, // Include the timestamp for concurrency control
      };

      await medicineService.update(medicineId, dto);
      toast.success(`Medicine "${medicineName}" updated successfully!`);
      onSuccess();
    } catch (e: any) {
      const message = e.response?.data?.message ?? 'Failed to update medicine';
      toast.error(message);
      // If conflict error, reload the form to get fresh data
      if (message.includes('modified by another user')) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner className="h-6 w-6 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Medicine Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Medicine Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Medicine Name *</label>
            <input
              type="text"
              value={medicineName}
              onChange={e => setMedicineName(e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Generic Name</label>
            <input
              type="text"
              value={genericName}
              onChange={e => setGenericName(e.target.value)}
              placeholder="e.g. Acetaminophen"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            >
              <option value="">— None —</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Manufacturer</label>
            <select
              value={manufacturerId}
              onChange={e => setManufacturerId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            >
              <option value="">— None —</option>
              {manufacturers.map(m => (
                <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity in Base Unit</label>
            <input
              type="number"
              value={quantityInBaseUnit}
              onChange={e => setQuantityInBaseUnit(e.target.value)}
              min={0}
              className="w-full rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100"
            />
            <p className="text-[10px] text-gray-500 mt-1">Current stock in base units</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reorder Level</label>
            <input
              type="number"
              value={reorderLevel}
              onChange={e => setReorderLevel(e.target.value)}
              min={0}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Unit 1 */}
      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <h4 className="text-sm font-semibold text-blue-900">Unit 1 (Default) - Pricing</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">MRP</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
              <input
                type="number"
                value={unit1.mrp}
                onChange={e => setUnit1({...unit1, mrp: e.target.value})}
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sell Price *</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
              <input
                type="number"
                value={unit1.sellPrice}
                onChange={e => setUnit1({...unit1, sellPrice: e.target.value})}
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-blue-300 bg-blue-50 pl-8 pr-2 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Price</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
              <input
                type="number"
                value={unit1.purchasePrice}
                onChange={e => setUnit1({...unit1, purchasePrice: e.target.value})}
                min={0}
                step="0.01"
                className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unit 2 */}
      {hasUnit2 && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <h4 className="text-sm font-semibold text-green-900">Unit 2 (Base) - Pricing</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">MRP</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                <input
                  type="number"
                  value={unit2.mrp}
                  onChange={e => setUnit2({...unit2, mrp: e.target.value})}
                  min={0}
                  step="0.01"
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sell Price *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                <input
                  type="number"
                  value={unit2.sellPrice}
                  onChange={e => setUnit2({...unit2, sellPrice: e.target.value})}
                  min={0}
                  step="0.01"
                  className="w-full rounded-lg border border-green-300 bg-green-50 pl-8 pr-2 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Price</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-gray-400">Rs.</span>
                <input
                  type="number"
                  value={unit2.purchasePrice}
                  onChange={e => setUnit2({...unit2, purchasePrice: e.target.value})}
                  min={0}
                  step="0.01"
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {submitting ? <LoadingSpinner /> : 'Update'}
        </button>
      </div>
    </div>
  );
}

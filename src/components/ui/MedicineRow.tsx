'use client';

import { Trash2, Minus, Plus } from 'lucide-react';
import type { Medicine, CartItem, SaleUnitType } from '@/types';

interface Props {
  row: CartItem;
  medicines: Medicine[];
  onChange: (id: string, updated: Partial<CartItem>) => void;
  onRemove: (id: string) => void;
}

export function MedicineRow({ row, medicines, onChange, onRemove }: Props) {
  const selected = medicines.find(m => m.medicineId === row.medicineId) ?? null;

  const handleMedicine = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const med = medicines.find(m => m.medicineId === Number(e.target.value));
    if (!med) return;
    const unitPrice = row.saleUnitType === 1 ? med.stripPrice : med.tabletPrice;
    onChange(row.id, {
      medicineId: med.medicineId,
      medicineName: med.name,
      tabletsPerStrip: med.tabletsPerStrip,
      unitPrice,
    });
  };

  const handleUnitType = (type: SaleUnitType) => {
    if (!selected) return;
    const unitPrice = type === 1 ? selected.stripPrice : selected.tabletPrice;
    onChange(row.id, { saleUnitType: type, unitPrice });
  };

  const decrement = () => {
    if (!selected) return;
    onChange(row.id, { quantity: Math.max(1, row.quantity - 1) });
  };

  const increment = () => {
    if (!selected) return;
    onChange(row.id, { quantity: row.quantity + 1 });
  };

  const lineTotal =
    row.quantity * row.unitPrice * (1 - row.discountPercent / 100);

  return (
    <tr className="border-b border-gray-100 last:border-0">
      {/* Medicine select */}
      <td className="px-3 py-2">
        <select
          value={row.medicineId === 0 ? '' : row.medicineId}
          onChange={handleMedicine}
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
        >
          <option value="">— Select medicine —</option>
          {medicines.map(m => (
            <option key={m.medicineId} value={m.medicineId} disabled={m.totalStockInTablets === 0}>
              {m.name}{m.totalStockInTablets === 0 ? ' (out of stock)' : ''}
            </option>
          ))}
        </select>
        {selected && (
          <p className="mt-0.5 text-xs text-gray-400 pl-1">
            Stock: {selected.totalStockInTablets.toLocaleString()} tabs
            {selected.requiresPrescription && (
              <span className="ml-1.5 rounded bg-purple-100 px-1 py-0.5 text-xs font-semibold text-purple-700">Rx</span>
            )}
          </p>
        )}
      </td>

      {/* Unit type */}
      <td className="px-3 py-2">
        <div className="flex gap-1">
          {([1, 0] as SaleUnitType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleUnitType(type)}
              disabled={!selected}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                row.saleUnitType === type
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 text-gray-500 hover:border-blue-300'
              }`}
            >
              {type === 1 ? 'Strip' : 'Tab'}
            </button>
          ))}
        </div>
        {selected && (
          <p className="mt-0.5 text-xs text-gray-400">
            Rs {Number(row.unitPrice).toFixed(2)}
          </p>
        )}
      </td>

      {/* Quantity with +/- buttons */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={decrement}
            disabled={!selected || row.quantity <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={1}
            value={row.quantity}
            onChange={e => onChange(row.id, { quantity: Math.max(1, Number(e.target.value)) })}
            disabled={!selected}
            className="w-12 rounded-lg border border-gray-200 px-1 py-1.5 text-center text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={increment}
            disabled={!selected}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </td>

      {/* Discount */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={row.discountPercent}
            onChange={e =>
              onChange(row.id, {
                discountPercent: Math.min(100, Math.max(0, Number(e.target.value))),
              })
            }
            disabled={!selected}
            className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:bg-gray-50"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </td>

      {/* Line total */}
      <td className="px-3 py-2 text-right text-sm font-semibold text-gray-800">
        {selected ? `Rs ${lineTotal.toFixed(2)}` : '—'}
      </td>

      {/* Remove */}
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          className="text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

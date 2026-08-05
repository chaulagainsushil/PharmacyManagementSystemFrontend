'use client';

import { useRef, useState, useEffect } from 'react';
import { Trash2, Minus, Plus, ChevronDown, X, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { medicineService } from '@/services/medicineService';
import { medicineUnitService } from '@/services/medicineUnitService';
import type { Medicine, CartItem, MedicineUnitForPos } from '@/types';

interface Props {
  row: CartItem;
  medicines: Medicine[];
  onChange: (id: string, updated: Partial<CartItem>) => void;
  onRemove: (id: string) => void;
  onMedicineSelect?: (med: Medicine) => void;
}

export function MedicineRow({ row, medicines, onChange, onRemove, onMedicineSelect }: Props) {
  const selected = medicines.find((m) => m.medicineId === row.medicineId) ?? null;

  const [open, setOpen]         = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [list, setList]         = useState<Medicine[]>([]);
  const [loading, setLoading]   = useState(false);

  // POS units for the currently selected medicine
  const [unitsLoading, setUnitsLoading] = useState(false);

  const allRef     = useRef<Medicine[]>([]);
  const loadedRef  = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setInputVal('');
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Reset input when row is cleared after sale
  useEffect(() => {
    if (!row.medicineName) setInputVal('');
  }, [row.medicineName]);

  // ── Load full medicine list once ───────────────────────────────────────────
  const fetchAll = () => {
    if (loadedRef.current) { setList(allRef.current); return; }
    setLoading(true);
    medicineService
      .getAll()
      .then((data) => {
        const active = data.filter((m) => m.isActive);
        allRef.current = active;
        loadedRef.current = true;
        setList(active);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  // ── Debounced search ───────────────────────────────────────────────────────
  const doSearch = (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setList(allRef.current); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      medicineService
        .search(q.trim())
        .then((data) => setList(data.filter((m) => m.isActive)))
        .catch(() =>
          setList(
            allRef.current.filter(
              (m) =>
                m.name.toLowerCase().includes(q.toLowerCase()) ||
                (m.genericName ?? '').toLowerCase().includes(q.toLowerCase())
            )
          )
        )
        .finally(() => setLoading(false));
    }, 250);
  };

  // ── Pick medicine: load its POS units then set default ────────────────────
  const pick = async (med: Medicine) => {
    setOpen(false);
    setInputVal(med.name);
    onMedicineSelect?.(med);

    setUnitsLoading(true);
    try {
      const units = await medicineUnitService.getForPos(med.medicineId);
      const defaultUnit = units.find((u) => u.isDefault) ?? units[0];
      onChange(row.id, {
        medicineId:     med.medicineId,
        medicineName:   med.name,
        medicineUnitId: defaultUnit?.medicineUnitId ?? 0,
        uomName:        defaultUnit?.uomName ?? '',
        unitPrice:      defaultUnit?.unitPrice ?? 0,
        availableUnits: units,
      });
    } catch {
      // Fallback: no units loaded
      onChange(row.id, {
        medicineId:     med.medicineId,
        medicineName:   med.name,
        medicineUnitId: 0,
        uomName:        '',
        unitPrice:      0,
        availableUnits: [],
      });
    } finally {
      setUnitsLoading(false);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputVal('');
    setList(allRef.current);
    setOpen(true);
    onChange(row.id, {
      medicineId:     0,
      medicineName:   '',
      medicineUnitId: 0,
      uomName:        '',
      unitPrice:      0,
      availableUnits: [],
    });
  };

  // Switch unit within the same row
  const handleUnitSwitch = (unit: MedicineUnitForPos) => {
    onChange(row.id, {
      medicineUnitId: unit.medicineUnitId,
      uomName:        unit.uomName,
      unitPrice:      unit.unitPrice,
    });
  };

  const lineTotal = row.quantity * row.unitPrice * (1 - row.discountPercent / 100);

  // Highlight search term in dropdown
  const hi = (text: string) => {
    const q = inputVal.trim();
    if (!q) return <>{text}</>;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, i)}
        <mark className="rounded bg-yellow-200 px-0.5 text-yellow-900">
          {text.slice(i, i + q.length)}
        </mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  const displayValue = open ? inputVal : (selected?.name ?? '');

  return (
    <tr className="border-b border-gray-100 last:border-0">
      {/* ── Medicine selector ──────────────────────────────────────────────── */}
      <td className="px-3 py-2">
        <div ref={wrapperRef} className="relative">
          <div
            className={`flex items-center gap-1 rounded-xl border-2 bg-white px-2 transition-all ${
              open ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <input
              type="text"
              value={displayValue}
              onFocus={() => { setOpen(true); setInputVal(''); fetchAll(); }}
              onChange={(e) => { setInputVal(e.target.value); doSearch(e.target.value); }}
              placeholder="Click to select or search medicine…"
              autoComplete="off"
              className="flex-1 bg-transparent py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            {loading ? (
              <LoadingSpinner className="h-4 w-4 flex-shrink-0 text-blue-400" />
            ) : selected ? (
              <button type="button" onMouseDown={clear} className="rounded-full p-0.5 text-gray-300 hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            )}
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-[520px] rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                <span>
                  {loading
                    ? 'Loading…'
                    : inputVal.trim()
                    ? `${list.length} result${list.length !== 1 ? 's' : ''} for "${inputVal}"`
                    : `${list.length} medicines — type to filter`}
                </span>
                {inputVal && !loading && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setInputVal(''); setList(allRef.current); }}
                    className="text-blue-500 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {!loading && list.length > 0 && (
                <div className="grid grid-cols-[1fr_90px_140px] border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <span>Medicine</span>
                  <span className="text-center">Stock</span>
                  <span className="text-right">Units</span>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner className="h-6 w-6 text-blue-400" />
                </div>
              )}

              {!loading && list.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">
                  No medicines found{inputVal ? ` for "${inputVal}"` : ''}
                </p>
              )}

              {!loading &&
                list.map((m, idx) => {
                  const isSel = m.medicineId === row.medicineId;
                  const oos   = m.totalStockInTablets === 0;
                  const low   = !oos && m.totalStockInTablets <= m.reorderLevel;
                  // Show unit count from the medicine's units array if loaded
                  const unitCount = m.units?.length ?? 0;
                  return (
                    <button
                      key={m.medicineId}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); if (!oos) pick(m); }}
                      className={[
                        'grid w-full grid-cols-[1fr_90px_140px] items-center gap-3 px-4 py-3 text-left transition-colors',
                        idx > 0 ? 'border-t border-gray-50' : '',
                        isSel ? 'bg-blue-50' : 'hover:bg-gray-50',
                        oos ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      {/* Name */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className={`text-sm font-semibold ${isSel ? 'text-blue-700' : 'text-gray-900'}`}>
                            {hi(m.name)}
                          </span>
                          {m.requiresPrescription && (
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-bold text-purple-700">Rx</span>
                          )}
                          {isSel && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-600">✓</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs text-gray-500">
                            {m.genericName ? hi(m.genericName) : <span className="italic text-gray-300">—</span>}
                          </span>
                          {m.categoryName && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{m.categoryName}</span>
                          )}
                          {m.manufacturerName && (
                            <span className="text-xs text-gray-400">· {m.manufacturerName}</span>
                          )}
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="text-center">
                        {oos ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Out</span>
                        ) : low ? (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                            {m.totalStockInTablets} ⚠
                          </span>
                        ) : (
                          <>
                            <p className="text-base font-bold text-emerald-600">{m.totalStockInTablets.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">base units</p>
                          </>
                        )}
                      </div>

                      {/* Unit info */}
                      <div className="text-right">
                        {unitCount > 0 ? (
                          <>
                            <p className="text-xs font-semibold text-gray-700">{unitCount} unit type{unitCount !== 1 ? 's' : ''}</p>
                            {m.units?.slice(0, 2).map((u) => (
                              <p key={u.medicineUnitId} className="text-xs text-gray-400">
                                {u.uomName}: Rs {Number(u.unitPrice).toFixed(2)}
                              </p>
                            ))}
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">No units set</p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Info bar below selected medicine */}
        {selected && !open && (
          <p className="mt-1 pl-1 text-xs text-gray-400">
            <span className={selected.totalStockInTablets <= selected.reorderLevel ? 'font-semibold text-orange-500' : ''}>
              {selected.totalStockInTablets.toLocaleString()} base units in stock
            </span>
            {selected.requiresPrescription && (
              <span className="ml-1.5 rounded bg-purple-100 px-1 py-0.5 text-xs font-semibold text-purple-700">Rx</span>
            )}
          </p>
        )}
      </td>

      {/* ── Unit type selector ─────────────────────────────────────────────── */}
      <td className="px-3 py-2 min-w-[130px]">
        {unitsLoading ? (
          <LoadingSpinner className="h-4 w-4 text-blue-400" />
        ) : row.availableUnits.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.availableUnits.map((unit) => (
              <button
                key={unit.medicineUnitId}
                type="button"
                onClick={() => handleUnitSwitch(unit)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  row.medicineUnitId === unit.medicineUnitId
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}
                title={`Rs ${Number(unit.unitPrice).toFixed(2)} (×${unit.conversionFactorToBase} base units)`}
              >
                {unit.uomName}
                {unit.isDefault && (
                  <span className="ml-1 opacity-60 text-[10px]">★</span>
                )}
              </button>
            ))}
          </div>
        ) : selected ? (
          <span className="text-xs text-red-400">No units — set up units first</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
        {row.medicineUnitId !== 0 && !unitsLoading && (
          <p className="mt-0.5 text-xs text-gray-400">Rs {Number(row.unitPrice).toFixed(2)}</p>
        )}
      </td>

      {/* ── Quantity ───────────────────────────────────────────────────────── */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => selected && onChange(row.id, { quantity: Math.max(1, row.quantity - 1) })}
            disabled={!selected || row.quantity <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={1}
            value={row.quantity}
            onChange={(e) => onChange(row.id, { quantity: Math.max(1, Number(e.target.value)) })}
            disabled={!selected}
            className="w-12 rounded-lg border border-gray-200 px-1 py-1.5 text-center text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={() => selected && onChange(row.id, { quantity: row.quantity + 1 })}
            disabled={!selected}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </td>

      {/* ── Discount ───────────────────────────────────────────────────────── */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={row.discountPercent}
            onChange={(e) =>
              onChange(row.id, { discountPercent: Math.min(100, Math.max(0, Number(e.target.value))) })
            }
            disabled={!selected}
            className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </td>

      {/* ── Line total ──────────────────────────────────────────────────────── */}
      <td className="px-3 py-2 text-right text-sm font-semibold text-gray-800">
        {selected && row.medicineUnitId !== 0 ? `Rs ${lineTotal.toFixed(2)}` : '—'}
      </td>

      {/* ── Remove ─────────────────────────────────────────────────────────── */}
      <td className="px-3 py-2 text-center">
        <button type="button" onClick={() => onRemove(row.id)} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

import { Info, Copy } from 'lucide-react';

/**
 * Informational banner explaining how to sell medicines in dual units
 * Shows users how to add the same medicine multiple times with different units
 */
export function DualUnitSalesGuide() {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Sell in Multiple Units</p>
          <p className="text-xs leading-relaxed">
            To sell a medicine in both units (e.g., Strip + Tablet), add the medicine twice:
          </p>
          <div className="mt-2 space-y-1 text-xs ml-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-600 text-white w-5 h-5 flex items-center justify-center text-[10px]">1</span>
              <span>Add medicine <strong>Strip</strong> with quantity 2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-600 text-white w-5 h-5 flex items-center justify-center text-[10px]">2</span>
              <span>Click "Add Item" to add another row</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-600 text-white w-5 h-5 flex items-center justify-center text-[10px]">3</span>
              <span>Add same medicine <strong>Tablet</strong> with quantity 10</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-600 text-white w-5 h-5 flex items-center justify-center text-[10px]">4</span>
              <span>Both units will be deducted from inventory in the same sale</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

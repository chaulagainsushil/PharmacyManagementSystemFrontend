import api from '@/lib/api';
import type { MedicineUnit, MedicineUnitForPos, CreateMedicineUnitDto } from '@/types';

export interface AddMedicineUnitCommand extends CreateMedicineUnitDto {
  medicineId: number;
}

export interface SetDefaultUnitCommand {
  medicineId: number;
  medicineUnitId: number;
}

export interface UpdateMedicineUnitPriceCommand {
  unitPrice: number;
}

export const medicineUnitService = {
  /** All units for a medicine (management view, includes inactive) */
  getByMedicine: (medicineId: number) =>
    api.get<MedicineUnit[]>(`/api/medicineunit/by-medicine/${medicineId}`).then((r) => r.data),

  /** Active units for POS dropdown — default unit first */
  getForPos: (medicineId: number) =>
    api.get<MedicineUnitForPos[]>(`/api/medicineunit/pos/${medicineId}`).then((r) => r.data),

  /** Attach a unit of measure to a medicine */
  addUnit: (cmd: AddMedicineUnitCommand) =>
    api.post<MedicineUnit>('/api/medicineunit', cmd).then((r) => r.data),

  /** Set default POS unit */
  setDefault: (cmd: SetDefaultUnitCommand) =>
    api.post<{ message: string }>('/api/medicineunit/set-default', cmd).then((r) => r.data),

  /** Update price for a medicine unit */
  updatePrice: (medicineUnitId: number, cmd: UpdateMedicineUnitPriceCommand) =>
    api.patch<MedicineUnit>(`/api/medicineunit/${medicineUnitId}/price`, cmd).then((r) => r.data),

  /** Deactivate (soft-delete) a unit */
  deactivate: (medicineUnitId: number) =>
    api.delete<{ message: string }>(`/api/medicineunit/${medicineUnitId}`).then((r) => r.data),
};

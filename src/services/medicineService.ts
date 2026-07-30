import api from '@/lib/api';
import type { Medicine, CreateMedicineDto } from '@/types';

export const medicineService = {
  getAll: () => api.get<Medicine[]>('/api/medicine').then((r) => r.data),
  getById: (id: number) => api.get<Medicine>(`/api/medicine/${id}`).then((r) => r.data),
  create: (dto: CreateMedicineDto) =>
    api.post<Medicine>('/api/medicine', dto).then((r) => r.data),
  update: (id: number, dto: CreateMedicineDto) =>
    api.put<Medicine>(`/api/medicine/${id}`, dto).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/medicine/${id}`).then((r) => r.data),
};

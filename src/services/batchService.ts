import api from '@/lib/api';
import type { MedicineBatch, CreateMedicineBatchDto } from '@/types';

export const batchService = {
  getAll: () => api.get<MedicineBatch[]>('/api/medicinebatch').then((r) => r.data),
  getById: (id: number) =>
    api.get<MedicineBatch>(`/api/medicinebatch/${id}`).then((r) => r.data),
  getByMedicine: (medicineId: number) =>
    api
      .get<MedicineBatch[]>(`/api/medicinebatch/by-medicine/${medicineId}`)
      .then((r) => r.data),
  create: (dto: CreateMedicineBatchDto) =>
    api.post<MedicineBatch>('/api/medicinebatch', dto).then((r) => r.data),
  update: (id: number, dto: Omit<CreateMedicineBatchDto, 'medicineId' | 'receivedDate'>) =>
    api.put<MedicineBatch>(`/api/medicinebatch/${id}`, dto).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/medicinebatch/${id}`).then((r) => r.data),
};

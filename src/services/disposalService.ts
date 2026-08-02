import api from '@/lib/api';
import type { DisposalResponse, CreateDisposalRequestDto } from '@/types';

export const disposalService = {
  getAll: () =>
    api.get<DisposalResponse[]>('/api/disposal').then((r) => r.data),

  getById: (id: number) =>
    api.get<DisposalResponse>(`/api/disposal/${id}`).then((r) => r.data),

  create: (dto: CreateDisposalRequestDto) =>
    api.post<DisposalResponse>('/api/disposal', dto).then((r) => r.data),
};

import api from '@/lib/api';
import type { CreateSaleRequestDto, SaleResponse } from '@/types';

export const saleService = {
  create: (dto: CreateSaleRequestDto) =>
    api.post<SaleResponse>('/api/sales', dto).then((r) => r.data),

  getAll: () =>
    api.get<SaleResponse[]>('/api/sales').then((r) => r.data),

  getById: (id: number) =>
    api.get<SaleResponse>(`/api/sales/${id}`).then((r) => r.data),
};

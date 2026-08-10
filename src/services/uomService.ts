import api from '@/lib/api';
import type { UnitOfMeasure, CreateUomDto, UpdateUomDto } from '@/types';

export const uomService = {
  /** GET /api/uom — all UoMs; pass true to include inactive ones */
  getAll: (includeInactive = false) =>
    api
      .get<UnitOfMeasure[]>(`/api/uom${includeInactive ? '?includeInactive=true' : ''}`)
      .then((r) => r.data),

  /** GET /api/uom/:id */
  getById: (id: number) =>
    api.get<UnitOfMeasure>(`/api/uom/${id}`).then((r) => r.data),

  /** POST /api/uom — PharmacyAdmin / SystemAdmin only */
  create: (dto: CreateUomDto) =>
    api.post<UnitOfMeasure>('/api/uom', dto).then((r) => r.data),

  /** PUT /api/uom/:id — PharmacyAdmin / SystemAdmin only */
  update: (id: number, dto: UpdateUomDto) =>
    api.put<UnitOfMeasure>(`/api/uom/${id}`, dto).then((r) => r.data),

  /**
   * Toggle active/inactive by fetching current state and flipping isActive.
   * Passes the current updatedAt for optimistic concurrency.
   */
  toggleActive: (uom: UnitOfMeasure) =>
    api
      .put<UnitOfMeasure>(`/api/uom/${uom.unitOfMeasureId}`, {
        name: uom.name,
        symbol: uom.symbol,
        isActive: !uom.isActive,
        updatedAt: uom.updatedAt,
      } satisfies UpdateUomDto)
      .then((r) => r.data),

  /** DELETE /api/uom/:id — SystemAdmin only */
  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/uom/${id}`).then((r) => r.data),
};

import api from '@/lib/api';
import type { UnitOfMeasure } from '@/types';

export const uomService = {
  getAll: (includeInactive = false) =>
    api
      .get<UnitOfMeasure[]>(`/api/uom${includeInactive ? '?includeInactive=true' : ''}`)
      .then((r) => r.data),
};

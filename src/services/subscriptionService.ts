import api from '@/lib/api';
import type { SubscriptionInfo, RenewSubscriptionDto, UpgradeSubscriptionDto } from '@/types';

export const subscriptionService = {
  /** GET /api/subscription/mine — returns the current tenant's subscription */
  getMine: () =>
    api.get<SubscriptionInfo>('/api/subscription/mine').then((r) => r.data),

  /** POST /api/subscription/renew — renew with same plan */
  renew: (dto?: RenewSubscriptionDto) =>
    api.post<SubscriptionInfo>('/api/subscription/renew', dto ?? {}).then((r) => r.data),

  /** POST /api/subscription/upgrade — change to a different plan */
  upgrade: (dto: UpgradeSubscriptionDto) =>
    api.post<SubscriptionInfo>('/api/subscription/upgrade', dto).then((r) => r.data),
};

import api from '@/lib/api';
import type { AuthResponse, LoginDto, SignupDto, TenantSignupDto } from '@/types';

export const authService = {
  /** POST /api/auth/login */
  login: (dto: LoginDto) =>
    api.post<AuthResponse>('/api/auth/login', dto).then((r) => r.data),

  /**
   * POST /api/auth/tenant-signup
   * Creates a brand-new tenant (pharmacy) + first PharmacyAdmin user.
   * Returns a JWT with tenantId claim on success.
   */
  tenantSignup: (dto: TenantSignupDto) =>
    api.post<AuthResponse>('/api/auth/tenant-signup', dto).then((r) => r.data),

  /**
   * POST /api/auth/signup
   * Adds a pharmacist to an existing tenant (used from the Add Pharmacist page).
   */
  signup: (dto: SignupDto) =>
    api.post<AuthResponse>('/api/auth/signup', dto).then((r) => r.data),
};

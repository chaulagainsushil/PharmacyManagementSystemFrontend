import api from '@/lib/api';
import type { AuthResponse, LoginDto, SignupDto } from '@/types';

export const authService = {
  login: (dto: LoginDto) =>
    api.post<AuthResponse>('/api/auth/login', dto).then((r) => r.data),

  signup: (dto: SignupDto) =>
    api.post<AuthResponse>('/api/auth/signup', dto).then((r) => r.data),
};

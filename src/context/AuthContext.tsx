'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import type { LoginDto } from '@/types';

interface AuthUser {
  email: string;
  fullName: string;
  roles: string[];
  /** Integer PK from AppUsers — used as PharmacistId when creating sales */
  userId: number | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('pms_user');
    const token  = localStorage.getItem('pms_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (dto: LoginDto): Promise<string | null> => {
    const res = await authService.login(dto);
    if (!res.isSuccess || !res.token) return res.message;
    localStorage.setItem('pms_token', res.token);
    const u: AuthUser = {
      email: res.email!,
      fullName: res.fullName!,
      roles: res.roles,
      userId: res.userId ?? null,
    };
    localStorage.setItem('pms_user', JSON.stringify(u));
    setUser(u);
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

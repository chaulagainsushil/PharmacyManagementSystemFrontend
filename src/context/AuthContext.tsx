'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { subscriptionService } from '@/services/subscriptionService';
import type { LoginDto, SubscriptionInfo } from '@/types';

interface AuthUser {
  email: string;
  fullName: string;
  roles: string[];
  /** Integer PK from AppUsers — used as PharmacistId when creating sales */
  userId: number | null;
  /** UUID of the pharmacy tenant this user belongs to */
  tenantId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  subscription: SubscriptionInfo | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  /** Call after renew/upgrade to refresh subscription in context without re-login */
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser]                   = useState<AuthUser | null>(null);
  const [subscription, setSubscription]   = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading]             = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored      = localStorage.getItem('pms_user');
    const token       = localStorage.getItem('pms_token');
    const storedSub   = localStorage.getItem('pms_subscription');

    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    if (storedSub) {
      try { setSubscription(JSON.parse(storedSub)); } catch {}
    }
    setLoading(false);
  }, []);

  /** Fetch fresh subscription data from the API and persist it */
  const refreshSubscription = useCallback(async () => {
    try {
      const sub = await subscriptionService.getMine();
      setSubscription(sub);
      localStorage.setItem('pms_subscription', JSON.stringify(sub));
    } catch {
      // If the call fails (e.g. 404 — no subscription yet), just clear the cached value
      setSubscription(null);
      localStorage.removeItem('pms_subscription');
    }
  }, []);

  const login = useCallback(async (dto: LoginDto): Promise<string | null> => {
    const res = await authService.login(dto);
    if (!res.isSuccess || !res.token) return res.message;

    localStorage.setItem('pms_token', res.token);

    const u: AuthUser = {
      email:    res.email!,
      fullName: res.fullName!,
      roles:    res.roles,
      userId:   res.userId ?? null,
      tenantId: res.tenantId ?? null,
    };
    localStorage.setItem('pms_user', JSON.stringify(u));
    setUser(u);

    // Fetch subscription immediately so any page can read it right after login
    try {
      const sub = await subscriptionService.getMine();
      setSubscription(sub);
      localStorage.setItem('pms_subscription', JSON.stringify(sub));
    } catch {
      // Non-fatal — some roles (SystemAdmin) may have no tenant subscription
      setSubscription(null);
      localStorage.removeItem('pms_subscription');
    }

    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    localStorage.removeItem('pms_subscription');
    setUser(null);
    setSubscription(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/LoadingSpinner';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, loading, subscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not logged in → go to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Subscription expired → redirect to expired page so the user can renew
    // We only check after data has loaded and there's a known subscription.
    // Users with no subscription (e.g. SystemAdmin) are not blocked.
    if (subscription && subscription.status === 'Expired') {
      router.replace('/subscription/expired');
    }
  }, [loading, isAuthenticated, subscription, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <PageLoader />
      </div>
    );
  }

  // Show a full-screen loader while redirecting to /subscription/expired
  if (subscription && subscription.status === 'Expired') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

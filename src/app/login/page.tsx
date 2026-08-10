'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Activity, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { LoginDto } from '@/types';

export default function LoginPage() {
  const { login, subscription } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginDto>();

  const onSubmit = async (data: LoginDto) => {
    setSubmitting(true);
    try {
      const err = await login(data);
      if (err) {
        // Map known backend error messages to friendlier UI copy
        const msg = err.toLowerCase();
        if (msg.includes('pharmacy') || msg.includes('tenant')) {
          toast.error(err); // Pass through tenant-specific messages verbatim
        } else if (msg.includes('invalid') || msg.includes('password') || msg.includes('credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (msg.includes('lock') || msg.includes('ban')) {
          toast.error('Account is locked. Please contact your administrator.');
        } else if (msg.includes('not found') || msg.includes('no user')) {
          toast.error('No account found with this email address.');
        } else {
          toast.error(err);
        }
        return;
      }

      toast.success('Welcome back!');

      // If subscription is expired, AppLayout will redirect — go to dashboard
      // and let the guard handle it
      router.replace('/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">PharmaCare PMS</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="pharmacist@pms.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {submitting && <LoadingSpinner className="h-4 w-4 text-white" />}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            New pharmacy?{' '}
            <a href="/signup" className="font-medium text-blue-600 hover:underline">Register your pharmacy</a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Pharmacy Management System © 2026
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Activity, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { authService } from '@/services/authService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { SignupDto } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw]        = useState(false);
  const [showCon, setShowCon]      = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupDto>();
  const password = watch('password');

  const onSubmit = async (data: SignupDto) => {
    setSubmitting(true);
    try {
      const res = await authService.signup(data);
      if (!res.isSuccess) {
        toast.error(res.message);
        return;
      }
      toast.success('Account created! Please log in.');
      router.replace('/login');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Registration failed');
    } finally { setSubmitting(false); }
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
          <p className="mt-1 text-sm text-slate-400">Create a new account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ram Prasad Sharma"
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  {...register('fullName', { required: 'Full name is required' })}
                />
              </div>
              {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
            </div>

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
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showCon ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: v => v === password || 'Passwords do not match',
                  })}
                />
                <button type="button" onClick={() => setShowCon(!showCon)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition-colors mt-2"
            >
              {submitting && <LoadingSpinner className="h-4 w-4 text-white" />}
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">Sign In</Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Pharmacy Management System © 2026
        </p>
      </div>
    </div>
  );
}

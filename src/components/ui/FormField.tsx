import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 outline-none transition-colors',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
FormField.displayName = 'FormField';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
SelectField.displayName = 'SelectField';

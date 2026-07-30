import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'orange' | 'purple' | 'red';
  className?: string;
}

const colorMap = {
  blue:    { card: 'bg-blue-600',    icon: 'bg-blue-500',    title: 'text-blue-100', value: 'text-white', sub: 'text-blue-200' },
  emerald: { card: 'bg-emerald-600', icon: 'bg-emerald-500', title: 'text-emerald-100', value: 'text-white', sub: 'text-emerald-200' },
  orange:  { card: 'bg-orange-500',  icon: 'bg-orange-400',  title: 'text-orange-100', value: 'text-white', sub: 'text-orange-200' },
  purple:  { card: 'bg-purple-600',  icon: 'bg-purple-500',  title: 'text-purple-100', value: 'text-white', sub: 'text-purple-200' },
  red:     { card: 'bg-red-500',     icon: 'bg-red-400',     title: 'text-red-100',    value: 'text-white', sub: 'text-red-200' },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('rounded-2xl p-5 shadow-md', c.card, className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className={cn('text-sm font-medium', c.title)}>{title}</p>
          <p className={cn('mt-1 text-3xl font-bold', c.value)}>{value}</p>
          {subtitle && <p className={cn('mt-1 text-xs', c.sub)}>{subtitle}</p>}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0', c.icon)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

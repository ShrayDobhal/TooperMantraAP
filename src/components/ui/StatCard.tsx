import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/format';
import { Skeleton } from './Feedback';

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  loading,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Percentage change vs the previous period, e.g. 12.5 or -4. */
  delta?: number | null;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4 shadow-2xs', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      )}
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta !== undefined && delta !== null && !loading && (
          <span className={cn('inline-flex items-center font-medium', up ? 'text-emerald-600' : 'text-red-600')}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </div>
  );
}

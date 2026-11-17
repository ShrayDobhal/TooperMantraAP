'use client';
import React from 'react';
import { cn } from '@/lib/format';

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: React.ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-slate-200', className)} role="tablist">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Compact segmented control (used for range pickers and small filters). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn('inline-flex rounded-lg border border-slate-200 bg-white p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors',
            o.value === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

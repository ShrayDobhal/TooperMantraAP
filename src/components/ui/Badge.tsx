import React from 'react';
import { cn } from '@/lib/format';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status?: string | null): BadgeTone {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'READY':
    case 'RESOLVED':
    case 'LIVE':
    case 'PUBLISHED':
      return 'success';
    case 'PROCESSING':
    case 'ENCODING':
    case 'QUEUED':
    case 'UPCOMING':
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return 'info';
    case 'OPEN':
    case 'DRAFT':
    case 'INACTIVE':
      return 'warning';
    case 'SUSPENDED':
    case 'FAILED':
    case 'DELETED':
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

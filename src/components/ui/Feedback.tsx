'use client';
import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/format';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Something went wrong.';
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-800">Couldn&apos;t load this data</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">{message}</p>
      {onRetry && (
        <Button size="sm" className="mt-4" onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: 'info' | 'error' | 'success' | 'warning';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-brand-100 bg-brand-50 text-brand-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return <div className={cn('rounded-lg border px-3 py-2 text-sm', tones[tone], className)}>{children}</div>;
}

export function ProgressBar({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'success' | 'error' }) {
  const color = tone === 'success' ? 'bg-emerald-500' : tone === 'error' ? 'bg-red-500' : 'bg-brand-600';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** Shown where data depends on the mobile app sending analytics events. */
export function AppEventsEmpty({ what }: { what: string }) {
  return (
    <EmptyState
      title={`No ${what} yet`}
      description={
        <>
          This fills in once the Topper Mantra mobile app sends analytics events. The event spec for the app developer is in
          the backend repo at <code className="rounded bg-slate-100 px-1">docs/integration/mobile-analytics-events.md</code>.
        </>
      }
    />
  );
}

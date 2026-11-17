'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Gauge, HardDrive, Server } from 'lucide-react';
import { systemApi, SystemHealth } from '@/api/system';
import { AppShell } from '@/components/AppShell';
import { Badge, Card, CardHeader, Column, DataTable, ErrorState, PageHeader, StatCard } from '@/components/ui';
import { cn, fmtNumber } from '@/lib/format';

type RouteRow = SystemHealth['api']['routes'][number];

function ms(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return v < 10 ? `${v.toFixed(1)} ms` : `${Math.round(v)} ms`;
}

function latencyTone(v: number) {
  return v >= 1000 ? 'text-red-600' : v >= 300 ? 'text-amber-600' : 'text-slate-700';
}

function uptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

export default function SystemPage() {
  const q = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => systemApi.health(),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
  const d = q.data;

  const columns: Column<RouteRow>[] = [
    { key: 'route', header: 'Endpoint', cell: (r) => <code className="text-xs text-slate-800">{r.route}</code> },
    { key: 'count', header: 'Requests', align: 'right', cell: (r) => fmtNumber(r.count) },
    { key: 'p50', header: 'p50', align: 'right', cell: (r) => <span className={latencyTone(r.p50)}>{ms(r.p50)}</span> },
    { key: 'p95', header: 'p95', align: 'right', cell: (r) => <span className={latencyTone(r.p95)}>{ms(r.p95)}</span> },
    { key: 'p99', header: 'p99', align: 'right', cell: (r) => <span className={latencyTone(r.p99)}>{ms(r.p99)}</span> },
    {
      key: 'errors',
      header: 'Errors',
      align: 'right',
      cell: (r) => <span className={cn(r.errors > 0 ? 'font-medium text-red-600' : 'text-slate-500')}>{fmtNumber(r.errors)}</span>,
    },
  ];

  const routes = [...(d?.api.routes || [])].sort((a, b) => b.p95 - a.p95);

  return (
    <AppShell>
      <PageHeader
        title="System health"
        description="Live database and cache latency, and API response times measured on the server. Refreshes every 10 seconds."
        actions={d ? <Badge tone="neutral">{d.server.env}</Badge> : undefined}
      />
      {q.isError ? (
        <Card>
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Database (PostgreSQL)"
            icon={<Database className="h-4 w-4" />}
            value={d ? (d.db.ok ? ms(d.db.latencyMs) : 'Down') : '—'}
            hint={d ? (d.db.ok ? 'round-trip query' : 'not reachable') : undefined}
            loading={q.isLoading}
          />
          <StatCard
            label="Cache (Redis)"
            icon={<HardDrive className="h-4 w-4" />}
            value={d ? (d.redis.ok ? ms(d.redis.latencyMs) : 'Down') : '—'}
            hint={d ? (d.redis.mode === 'redis' ? 'connected' : 'in-memory fallback — Redis is not connected') : undefined}
            loading={q.isLoading}
          />
          <StatCard label="API uptime" icon={<Server className="h-4 w-4" />} value={d ? uptime(d.api.uptimeSeconds) : '—'} hint={d ? `Node ${d.server.nodeVersion}` : undefined} loading={q.isLoading} />
          <StatCard
            label="Requests since start"
            icon={<Gauge className="h-4 w-4" />}
            value={fmtNumber(d?.api.totalRequests)}
            hint={d ? `${fmtNumber(d.server.memoryMb)} MB memory` : undefined}
            loading={q.isLoading}
          />
        </div>
      )}
      {d && d.redis.mode === 'memory' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Redis is not connected, so the server is using its in-memory cache. Caching and rate limits reset on every restart.
        </div>
      )}
      <Card>
        <CardHeader title="Endpoint latency" description="Server-side response time since the last restart, slowest first. Amber ≥ 300 ms, red ≥ 1 s." />
        <DataTable columns={columns} rows={routes} rowKey={(r) => r.route} loading={q.isLoading} error={null} />
      </Card>
    </AppShell>
  );
}

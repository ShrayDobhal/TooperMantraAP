'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { analyticsApi, MentorRow } from '@/api/analytics';
import { AppShell } from '@/components/AppShell';
import { Card, Column, DataTable, EmptyState, PageHeader, RangePicker, StatCard } from '@/components/ui';
import { useRange } from '@/hooks/useRange';
import { fmtMinutes, fmtNumber, fmtPercent } from '@/lib/format';

export default function MentorAnalyticsPage() {
  const [range, setRange] = useRange('30d');
  const q = useQuery({ queryKey: ['analytics', 'mentors', range], queryFn: () => analyticsApi.mentors({ range }), staleTime: 30_000 });
  const items = q.data?.items || [];
  const claimed = items.reduce((a, m) => a + m.doubtsClaimed, 0);
  const resolved = items.reduce((a, m) => a + m.doubtsResolved, 0);
  const rated = items.filter((m) => m.avgRating !== null && m.ratingsCount > 0);
  const avgRating = rated.length ? rated.reduce((a, m) => a + (m.avgRating || 0) * m.ratingsCount, 0) / rated.reduce((a, m) => a + m.ratingsCount, 0) : null;

  const columns: Column<MentorRow>[] = [
    {
      key: 'name',
      header: 'Mentor',
      cell: (m) => (
        <div>
          <p className="font-medium text-slate-900">{m.name || 'Unnamed mentor'}</p>
          <p className="text-xs text-slate-500">{m.phone || '—'}</p>
        </div>
      ),
    },
    { key: 'claimed', header: 'Doubts claimed', align: 'right', cell: (m) => fmtNumber(m.doubtsClaimed) },
    { key: 'resolved', header: 'Resolved', align: 'right', cell: (m) => fmtNumber(m.doubtsResolved) },
    {
      key: 'rate',
      header: 'Resolution rate',
      align: 'right',
      cell: (m) => (m.doubtsClaimed ? fmtPercent(m.doubtsResolved / m.doubtsClaimed) : '—'),
    },
    { key: 'time', header: 'Avg time to resolve', align: 'right', cell: (m) => fmtMinutes(m.avgResolutionMinutes) },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      cell: (m) =>
        m.avgRating !== null && m.ratingsCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {m.avgRating.toFixed(1)}
            <span className="text-xs text-slate-500">({fmtNumber(m.ratingsCount)})</span>
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <AppShell>
      <PageHeader title="Mentor performance" description="Doubt resolution and student ratings for each mentor." actions={<RangePicker value={range} onChange={setRange} />} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active mentors" value={fmtNumber(items.filter((m) => m.doubtsClaimed > 0).length)} loading={q.isLoading} />
        <StatCard label="Doubts claimed" value={fmtNumber(claimed)} loading={q.isLoading} />
        <StatCard label="Doubts resolved" value={fmtNumber(resolved)} hint={claimed ? `${fmtPercent(resolved / claimed)} of claimed` : undefined} loading={q.isLoading} />
        <StatCard label="Avg rating" value={avgRating ? avgRating.toFixed(2) : '—'} loading={q.isLoading} />
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(m) => m.mentorUserId}
          loading={q.isLoading}
          error={q.isError ? q.error : null}
          onRetry={() => q.refetch()}
          empty={<EmptyState title="No mentor activity in this range" />}
        />
      </Card>
    </AppShell>
  );
}

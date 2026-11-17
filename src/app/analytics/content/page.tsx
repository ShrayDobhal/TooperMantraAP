'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, VideoRow } from '@/api/analytics';
import { AppShell } from '@/components/AppShell';
import { Card, Column, DataTable, EmptyState, PageHeader, RangePicker, Select, StatCard } from '@/components/ui';
import { useRange } from '@/hooks/useRange';
import { fmtMinutes, fmtNumber, fmtPercent, fmtSeconds, titleCase } from '@/lib/format';

export default function ContentAnalyticsPage() {
  const [range, setRange] = useRange('30d');
  const [limit, setLimit] = useState(50);

  const q = useQuery({
    queryKey: ['analytics', 'videos', range, limit],
    queryFn: () => analyticsApi.videos({ range, limit }),
    staleTime: 30_000,
  });
  const items = q.data?.items || [];
  const totalViewers = items.reduce((a, v) => a + v.uniqueViewers, 0);
  const totalMinutes = items.reduce((a, v) => a + v.watchMinutes, 0);
  const avgCompletion = items.length ? items.reduce((a, v) => a + (v.completionRate <= 1 ? v.completionRate : v.completionRate / 100), 0) / items.length : null;

  const columns: Column<VideoRow>[] = [
    {
      key: 'title',
      header: 'Recording',
      cell: (v) => (
        <div className="flex items-center gap-3">
          {v.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.thumbnailUrl} alt="" className="h-9 w-14 shrink-0 rounded-md border border-slate-100 object-cover" />
          ) : (
            <div className="h-9 w-14 shrink-0 rounded-md bg-slate-100" />
          )}
          <div className="min-w-0">
            <p className="max-w-[320px] truncate font-medium text-slate-900">{v.title}</p>
            <p className="text-xs text-slate-500">{titleCase(v.category)}</p>
          </div>
        </div>
      ),
    },
    { key: 'uniqueViewers', header: 'Students', align: 'right', cell: (v) => fmtNumber(v.uniqueViewers) },
    { key: 'views', header: 'Plays', align: 'right', cell: (v) => fmtNumber(v.views) },
    { key: 'watch', header: 'Watch time', align: 'right', cell: (v) => fmtMinutes(v.watchMinutes) },
    { key: 'avg', header: 'Avg per student', align: 'right', cell: (v) => fmtSeconds(v.avgWatchSeconds) },
    {
      key: 'completion',
      header: 'Completion',
      align: 'right',
      cell: (v) => {
        const pct = v.completionRate <= 1 ? v.completionRate * 100 : v.completionRate;
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="hidden h-1.5 w-16 rounded-full bg-slate-100 sm:block">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
            </div>
            <span>{fmtPercent(pct / 100)}</span>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Content performance"
        description="Which recordings students open, how long they watch, and how many finish them."
        actions={
          <>
            <Select value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))} className="h-8 w-[110px] text-xs">
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
              <option value="100">Top 100</option>
            </Select>
            <RangePicker value={range} onChange={setRange} />
          </>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Recordings watched" value={fmtNumber(items.length)} loading={q.isLoading} />
        <StatCard label="Total watch time" value={fmtMinutes(totalMinutes)} loading={q.isLoading} />
        <StatCard label="Avg completion" value={fmtPercent(avgCompletion)} hint={`${fmtNumber(totalViewers)} student views`} loading={q.isLoading} />
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(v) => v.videoId}
          loading={q.isLoading}
          error={q.isError ? q.error : null}
          onRetry={() => q.refetch()}
          empty={<EmptyState title="No recordings watched in this range" description="Plays are counted when students open a recording in the app." />}
        />
      </Card>
    </AppShell>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, ClickRow, ScreenRow } from '@/api/analytics';
import { AppShell } from '@/components/AppShell';
import { BarList, BarsChart, Heatmap } from '@/components/charts';
import {
  AppEventsEmpty,
  Card,
  CardBody,
  CardHeader,
  Column,
  DataTable,
  ErrorState,
  Input,
  PageHeader,
  RangePicker,
  Select,
  Skeleton,
} from '@/components/ui';
import { useRange } from '@/hooks/useRange';
import { fmtHour, fmtMinutes, fmtNumber, fmtSeconds, titleCase } from '@/lib/format';

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export default function EngagementPage() {
  const [range, setRange] = useRange('7d');
  const [date, setDate] = useState(todayIST());
  const [screen, setScreen] = useState('');

  const hourly = useQuery({ queryKey: ['analytics', 'hourly', date], queryFn: () => analyticsApi.hourly(date), staleTime: 30_000 });
  const heatmap = useQuery({
    queryKey: ['analytics', 'heatmap', range === 'today' || range === '7d' ? '30d' : range],
    queryFn: () => analyticsApi.heatmap({ range: range === 'today' || range === '7d' ? '30d' : range }),
    staleTime: 60_000,
  });
  const features = useQuery({ queryKey: ['analytics', 'features', range], queryFn: () => analyticsApi.features({ range }), staleTime: 30_000 });
  const screens = useQuery({ queryKey: ['analytics', 'screens', range], queryFn: () => analyticsApi.screens({ range }), staleTime: 30_000 });
  const clicks = useQuery({
    queryKey: ['analytics', 'clicks', range, screen],
    queryFn: () => analyticsApi.clicks({ range, screen: screen || undefined }),
    staleTime: 30_000,
  });

  const screenCols: Column<ScreenRow>[] = [
    { key: 'screen', header: 'Screen', cell: (r) => <span className="font-medium text-slate-800">{r.screen}</span> },
    { key: 'views', header: 'Views', align: 'right', cell: (r) => fmtNumber(r.views) },
    { key: 'users', header: 'Students', align: 'right', cell: (r) => fmtNumber(r.users) },
    { key: 'total', header: 'Total time', align: 'right', cell: (r) => fmtSeconds(r.totalSeconds) },
    { key: 'avg', header: 'Avg per view', align: 'right', cell: (r) => fmtSeconds(r.avgSeconds) },
  ];
  const clickCols: Column<ClickRow>[] = [
    { key: 'element', header: 'Element', cell: (r) => <span className="font-medium text-slate-800">{r.element}</span> },
    { key: 'screen', header: 'Screen', cell: (r) => <span className="text-slate-600">{r.screen}</span> },
    { key: 'clicks', header: 'Taps', align: 'right', cell: (r) => fmtNumber(r.clicks) },
    { key: 'users', header: 'Students', align: 'right', cell: (r) => fmtNumber(r.users) },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Engagement"
        description="When students are active, which sections and screens hold their attention, and what they tap."
        actions={<RangePicker value={range} onChange={setRange} />}
      />

      <Card>
        <CardHeader
          title="Active students by hour"
          description={hourly.data?.peakHour !== null && hourly.data ? `Peak hour: ${fmtHour(hourly.data.peakHour as number)} (India time)` : 'India time'}
          actions={<Input type="date" value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} className="h-8 w-[150px] text-xs" />}
        />
        <CardBody>
          {hourly.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : hourly.isError ? (
            <ErrorState error={hourly.error} onRetry={() => hourly.refetch()} />
          ) : (
            <BarsChart
              data={hourly.data?.hours || []}
              xKey="hour"
              yKey="activeUsers"
              name="Active students"
              xFormatter={fmtHour}
              highlightIndex={hourly.data?.peakHour ?? null}
              height={220}
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Weekly activity pattern" description={`Active students by day and hour, last ${range === '90d' ? '90' : '30'} days`} />
        <CardBody>
          {heatmap.isLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : heatmap.isError ? (
            <ErrorState error={heatmap.error} onRetry={() => heatmap.refetch()} />
          ) : (
            <Heatmap cells={heatmap.data?.cells || []} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="App sections" description="Time students spend in each part of the app" />
        <CardBody>
          {features.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : features.isError ? (
            <ErrorState error={features.error} onRetry={() => features.refetch()} />
          ) : (
            <BarList
              valueFormatter={fmtMinutes}
              items={(features.data?.items || []).map((f) => ({
                key: f.feature,
                label: titleCase(f.feature),
                value: f.minutes,
                sub: `${fmtNumber(f.users)} students`,
              }))}
              emptyLabel="No activity in this range"
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Screens" description="From app events: views and time on each screen" />
        <DataTable
          columns={screenCols}
          rows={screens.data?.items}
          rowKey={(r) => r.screen}
          loading={screens.isLoading}
          error={screens.isError ? screens.error : null}
          onRetry={() => screens.refetch()}
          empty={<AppEventsEmpty what="screen data" />}
        />
      </Card>

      <Card>
        <CardHeader
          title="Most tapped"
          description="Buttons and items students tap the most"
          actions={
            <Select value={screen} onChange={(e) => setScreen(e.target.value)} className="h-8 w-[180px] text-xs">
              <option value="">All screens</option>
              {(screens.data?.items || []).map((s) => (
                <option key={s.screen} value={s.screen}>
                  {s.screen}
                </option>
              ))}
            </Select>
          }
        />
        <DataTable
          columns={clickCols}
          rows={clicks.data?.items}
          rowKey={(r) => `${r.screen}-${r.element}`}
          loading={clicks.isLoading}
          error={clicks.isError ? clicks.error : null}
          onRetry={() => clicks.refetch()}
          empty={<AppEventsEmpty what="tap data" />}
        />
      </Card>
    </AppShell>
  );
}

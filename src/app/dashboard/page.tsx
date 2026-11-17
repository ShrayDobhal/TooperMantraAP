'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { AppShell } from '@/components/AppShell';
import { BarList, BarsChart, TrendChart } from '@/components/charts';
import { Card, CardBody, CardHeader, EmptyState, ErrorState, PageHeader, RangePicker, Skeleton, StatCard } from '@/components/ui';
import { useRange } from '@/hooks/useRange';
import {
  fmtCompact,
  fmtDateShort,
  fmtHour,
  fmtMinutes,
  fmtNumber,
  fmtPercent,
  fmtRupees,
  titleCase,
} from '@/lib/format';

const ANALYTICS_STALE = 30_000;

export default function DashboardPage() {
  const [range, setRange] = useRange('7d');

  const overview = useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: () => analyticsApi.overview({ range }),
    staleTime: ANALYTICS_STALE,
    refetchInterval: 60_000,
  });
  const hourly = useQuery({
    queryKey: ['analytics', 'hourly', 'today'],
    queryFn: () => analyticsApi.hourly(),
    staleTime: ANALYTICS_STALE,
    refetchInterval: 60_000,
  });
  const videos = useQuery({
    queryKey: ['analytics', 'videos', range, 5],
    queryFn: () => analyticsApi.videos({ range, limit: 5 }),
    staleTime: ANALYTICS_STALE,
  });
  const features = useQuery({
    queryKey: ['analytics', 'features', range],
    queryFn: () => analyticsApi.features({ range }),
    staleTime: ANALYTICS_STALE,
  });

  const t = overview.data?.totals;
  const loading = overview.isLoading;
  const funnel = overview.data?.funnel;
  const funnelSteps = funnel
    ? [
        { key: 'installs', label: 'App installs', value: funnel.installs },
        { key: 'signups', label: 'Signed up', value: funnel.signups },
        { key: 'onboarded', label: 'Completed profile', value: funnel.onboarded },
        { key: 'active', label: 'Used the app', value: funnel.active },
        { key: 'engaged', label: 'Active 3+ days', value: funnel.engaged },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));
  const peakIdx = hourly.data?.peakHour ?? null;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="How many students are using Topper Mantra, when, and what they engage with."
        actions={<RangePicker value={range} onChange={setRange} />}
      />

      {overview.isError ? (
        <Card>
          <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Active right now" value={fmtNumber(t?.activeNow)} hint="last 5 minutes" loading={loading} />
            <StatCard label="Active today" value={fmtNumber(t?.activeToday)} loading={loading} />
            <StatCard label="Active in range" value={fmtNumber(t?.activeUsers)} hint={`of ${fmtCompact(t?.students)} students`} loading={loading} />
            <StatCard label="New signups" value={fmtNumber(t?.newSignups)} loading={loading} />
            <StatCard label="App installs" value={fmtNumber(t?.installs)} hint="devices seen" loading={loading} />
            <StatCard label="Avg time / active user" value={fmtMinutes(t?.avgActiveMinutesPerUser)} loading={loading} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total time in app" value={`${fmtNumber(t?.totalActiveHours)} h`} loading={loading} />
            <StatCard label="Video watch time" value={`${fmtNumber(t?.videoWatchHours)} h`} loading={loading} />
            <StatCard label="Doubts asked" value={fmtNumber(t?.doubtsAsked)} loading={loading} />
            <StatCard
              label="Doubts resolved"
              value={fmtNumber(t?.doubtsResolved)}
              hint={t && t.doubtsAsked ? `${fmtPercent(t.doubtsResolved / t.doubtsAsked)} of asked` : undefined}
              loading={loading}
            />
            <StatCard label="Active subscriptions" value={fmtNumber(t?.activeSubscriptions)} loading={loading} />
            <StatCard label="Revenue" value={fmtRupees(t?.revenueInPaise)} hint="verified purchases" loading={loading} />
          </div>
        </>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Daily active students" description="Distinct students active each day, and new signups." />
          <CardBody>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : overview.isError ? (
              <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
            ) : overview.data?.daily?.length ? (
              <TrendChart
                data={overview.data.daily}
                xKey="date"
                xFormatter={fmtDateShort}
                series={[
                  { key: 'activeUsers', name: 'Active students' },
                  { key: 'newSignups', name: 'New signups' },
                ]}
              />
            ) : (
              <EmptyState title="No activity in this range" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Acquisition funnel" description="From install to engaged student, in this range." />
          <CardBody className="space-y-3">
            {overview.isError && <p className="text-xs text-slate-500">Unavailable while the overview fails to load.</p>}
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              : funnelSteps.map((s, i) => {
                  const prev = i > 0 ? funnelSteps[i - 1].value : null;
                  return (
                    <div key={s.key}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="text-slate-700">{s.label}</span>
                        <span className="font-medium text-slate-900">
                          {fmtNumber(s.value)}
                          {prev ? <span className="ml-1.5 text-xs font-normal text-slate-500">{fmtPercent(s.value / prev)}</span> : null}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(s.value / funnelMax) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
            {!loading && funnel && funnel.installs === 0 && (
              <p className="text-xs text-slate-500">Installs appear once the mobile app sends analytics events.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Active students by hour (today)"
            description={peakIdx !== null && hourly.data ? `Peak hour: ${fmtHour(peakIdx)}` : 'India time'}
            actions={
              <Link href="/analytics/engagement" className="text-xs font-medium text-brand-600 hover:underline">
                Weekly heatmap
              </Link>
            }
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
                highlightIndex={peakIdx}
                height={220}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Where students spend time"
            description="Minutes per app section"
            actions={
              <Link href="/analytics/engagement" className="text-xs font-medium text-brand-600 hover:underline">
                Details
              </Link>
            }
          />
          <CardBody>
            {features.isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : features.isError ? (
              <ErrorState error={features.error} onRetry={() => features.refetch()} />
            ) : (
              <BarList
                valueFormatter={fmtMinutes}
                items={(features.data?.items || []).slice(0, 7).map((f) => ({
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
      </div>

      <Card>
        <CardHeader
          title="Top recordings"
          description="Recordings students are most interested in"
          actions={
            <Link href="/analytics/content" className="text-xs font-medium text-brand-600 hover:underline">
              All content
            </Link>
          }
        />
        <CardBody className="p-0">
          {videos.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : videos.isError ? (
            <ErrorState error={videos.error} onRetry={() => videos.refetch()} />
          ) : videos.data?.items.length ? (
            <ul className="divide-y divide-slate-100">
              {videos.data.items.map((v, i) => (
                <li key={v.videoId} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-4 text-xs text-slate-400">{i + 1}</span>
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="h-10 w-16 rounded-md border border-slate-100 object-cover" />
                  ) : (
                    <div className="h-10 w-16 rounded-md bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{v.title}</p>
                    <p className="text-xs text-slate-500">{titleCase(v.category)}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-slate-900">{fmtNumber(v.uniqueViewers)}</p>
                    <p className="text-xs text-slate-500">viewers</p>
                  </div>
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-medium text-slate-900">{fmtMinutes(v.watchMinutes)}</p>
                    <p className="text-xs text-slate-500">watched</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{fmtPercent(v.completionRate)}</p>
                    <p className="text-xs text-slate-500">completion</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No recordings watched in this range" />
          )}
        </CardBody>
      </Card>
    </AppShell>
  );
}

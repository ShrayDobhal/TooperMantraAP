'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { analyticsApi } from '@/api/analytics';
import { AppShell } from '@/components/AppShell';
import { BarList, BarsChart, TrendChart } from '@/components/charts';
import {
  AppEventsEmpty,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  RangePicker,
  Skeleton,
  StatCard,
  statusTone,
} from '@/components/ui';
import { useRange } from '@/hooks/useRange';
import {
  fmtDate,
  fmtDateShort,
  fmtDateTime,
  fmtHour,
  fmtMinutes,
  fmtNumber,
  fmtRelative,
  fmtSeconds,
  titleCase,
} from '@/lib/format';

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [range, setRange] = useRange('30d');

  const q = useQuery({
    queryKey: ['analytics', 'student', id, range],
    queryFn: () => analyticsApi.student(id, { range }),
    enabled: !!id,
    staleTime: 30_000,
  });

  const d = q.data;
  const s = d?.student;
  const loading = q.isLoading;

  return (
    <AppShell>
      <Link href="/analytics/students" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All students
      </Link>

      <PageHeader
        title={loading ? <Skeleton className="h-6 w-48" /> : s?.name || 'Unnamed student'}
        description={
          s ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{s.phone}</span>
              {s.email && <span>{s.email}</span>}
              <span>{s.schoolName || 'Direct (B2C)'}</span>
              {s.targetExam && <span>{titleCase(s.targetExam)}</span>}
              {s.classLevel && <span>{titleCase(s.classLevel)}</span>}
              <span>Joined {fmtDate(s.createdAt)}</span>
              <span>Last seen {fmtRelative(s.lastSeenAt)}</span>
              <Badge tone={statusTone(s.status)}>{titleCase(s.status)}</Badge>
            </span>
          ) : undefined
        }
        actions={<RangePicker value={range} onChange={setRange} />}
      />

      {q.isError ? (
        <Card>
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Time in app" value={fmtMinutes(d?.totals.activeMinutes)} loading={loading} />
            <StatCard label="Days active" value={fmtNumber(d?.totals.daysActive)} loading={loading} />
            <StatCard label="Video time" value={fmtMinutes(d?.totals.videoMinutes)} loading={loading} />
            <StatCard label="Doubts asked" value={fmtNumber(d?.totals.doubtsAsked)} loading={loading} />
            <StatCard label="Taps / clicks" value={fmtNumber(d?.totals.clicks)} loading={loading} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Daily time in app" description="Minutes active per day" />
              <CardBody>
                {loading ? (
                  <Skeleton className="h-[240px] w-full" />
                ) : d?.daily.some((x) => x.activeMinutes > 0) ? (
                  <TrendChart
                    data={d.daily}
                    xKey="date"
                    xFormatter={fmtDateShort}
                    valueFormatter={(v) => fmtMinutes(v)}
                    series={[{ key: 'activeMinutes', name: 'Minutes' }]}
                    height={240}
                  />
                ) : (
                  <EmptyState title="No activity in this range" />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Where they spend time" description="Minutes per app section" />
              <CardBody>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <BarList
                    valueFormatter={fmtMinutes}
                    items={(d?.features || []).map((f) => ({ key: f.feature, label: titleCase(f.feature), value: f.minutes }))}
                    emptyLabel="No activity in this range"
                  />
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Active hours" description="Minutes active by hour of day (India time), across the range" />
            <CardBody>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <BarsChart
                  data={d?.hourly || []}
                  xKey="hour"
                  yKey="minutes"
                  name="Minutes"
                  xFormatter={fmtHour}
                  valueFormatter={(v) => fmtMinutes(v)}
                  height={200}
                />
              )}
            </CardBody>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Screens" description="Screens viewed and time spent on each" />
              <CardBody>
                {loading ? (
                  <Skeleton className="h-[160px] w-full" />
                ) : d?.screens.length ? (
                  <BarList
                    valueFormatter={fmtSeconds}
                    items={d.screens.map((sc) => ({ key: sc.screen, label: sc.screen, value: sc.totalSeconds, sub: `${fmtNumber(sc.views)} views` }))}
                  />
                ) : (
                  <AppEventsEmpty what="screen data" />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Most tapped" description="Buttons and items this student taps most" />
              <CardBody>
                {loading ? (
                  <Skeleton className="h-[160px] w-full" />
                ) : d?.topClicks.length ? (
                  <BarList
                    items={d.topClicks.map((c) => ({ key: `${c.screen}-${c.element}`, label: `${c.element} · ${c.screen}`, value: c.clicks }))}
                  />
                ) : (
                  <AppEventsEmpty what="tap data" />
                )}
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Recordings watched" />
              <CardBody className="p-0">
                {loading ? (
                  <Skeleton className="m-5 h-[160px]" />
                ) : d?.videos.length ? (
                  <ul className="divide-y divide-slate-100">
                    {d.videos.map((v) => (
                      <li key={v.videoId} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{v.title}</p>
                          <p className="text-xs text-slate-500">Last watched {fmtRelative(v.lastWatchedAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-sm text-slate-700">
                          {fmtSeconds(v.watchSeconds)}
                          {v.completed && <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Completed" />}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No recordings watched in this range" />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Recent activity" description="Latest events from the app" />
              <CardBody className="p-0">
                {loading ? (
                  <Skeleton className="m-5 h-[160px]" />
                ) : d?.recentEvents.length ? (
                  <ol className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                    {d.recentEvents.map((e, i) => (
                      <li key={i} className="flex items-start gap-3 px-5 py-2.5 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-800">
                            <span className="font-medium">{titleCase(e.type)}</span>
                            {e.element && <span className="text-slate-600"> · {e.element}</span>}
                            {e.screen && <span className="text-slate-500"> on {e.screen}</span>}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">{fmtDateTime(e.at)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <AppEventsEmpty what="app events" />
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

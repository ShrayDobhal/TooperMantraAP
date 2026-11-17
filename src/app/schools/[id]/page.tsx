'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Copy, Pencil, Search, Trash2 } from 'lucide-react';
import { analyticsApi, type SchoolBoard, type StudentRow, type StudentSort } from '@/api/analytics';
import { AppShell } from '@/components/AppShell';
import { BarList, BarsChart, TrendChart } from '@/components/charts';
import { SchoolDeleteModal } from '@/components/schools/SchoolDeleteModal';
import { SchoolEditModal } from '@/components/schools/SchoolEditModal';
import {
  Alert,
  AppEventsEmpty,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Column,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  ProgressBar,
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
  titleCase,
} from '@/lib/format';

const LIMIT = 20;

const EVENT_LABEL: Record<string, string> = {
  app_open: 'Opened the app',
  app_foreground: 'Came back to the app',
  app_background: 'Left the app',
  screen_view: 'Viewed',
  click: 'Tapped',
  search: 'Searched',
  video_start: 'Started video',
  video_progress: 'Watched',
  video_pause: 'Paused video',
  video_complete: 'Finished video',
};

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs text-slate-800 hover:bg-slate-100"
      title="Copy code"
    >
      {code}
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
    </button>
  );
}

export default function SchoolBoardPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const qc = useQueryClient();
  const [range, setRange] = useRange('30d');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<StudentSort>('activeMinutes');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const board = useQuery({
    queryKey: ['analytics', 'school', id, range],
    queryFn: () => analyticsApi.school(id, { range }),
    enabled: !!id,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  const d: SchoolBoard | undefined = board.data;
  const schoolId = d?.school.id;

  const students = useQuery({
    queryKey: ['analytics', 'students', 'school', schoolId, range, search, sort, page],
    queryFn: () => analyticsApi.students({ range, schoolId, search: search || undefined, sort, page, limit: LIMIT }),
    enabled: !!schoolId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const loading = board.isLoading;
  const s = d?.school;
  const t = d?.totals;
  const seatsPct = d && d.seats.licensedSeats ? (d.seats.redeemedSeats / d.seats.licensedSeats) * 100 : 0;
  const activePct = t && t.students ? Math.round((t.activeUsers / t.students) * 100) : 0;

  const studentColumns: Column<StudentRow>[] = [
    {
      key: 'name',
      header: 'Student',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{r.name || 'Unnamed student'}</p>
          <p className="text-xs text-slate-500">{r.phone}</p>
        </div>
      ),
    },
    { key: 'activeMinutes', header: 'Time in app', align: 'right', sortable: true, cell: (r) => fmtMinutes(r.activeMinutes) },
    { key: 'daysActive', header: 'Days active', align: 'right', sortable: true, cell: (r) => fmtNumber(r.daysActive) },
    { key: 'videoMinutes', header: 'Video time', align: 'right', cell: (r) => fmtMinutes(r.videoMinutes) },
    { key: 'topFeature', header: 'Most used', cell: (r) => <span className="text-slate-600">{r.topFeature ? titleCase(r.topFeature) : '—'}</span> },
    { key: 'lastSeen', header: 'Last seen', sortable: true, cell: (r) => <span className="text-slate-600">{fmtRelative(r.lastSeenAt)}</span> },
    { key: 'createdAt', header: 'Joined', sortable: true, cell: (r) => <span className="text-slate-600">{fmtDate(r.createdAt)}</span> },
  ];

  return (
    <AppShell>
      <Link href="/schools" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All schools
      </Link>

      <PageHeader
        title={loading ? <Skeleton className="h-6 w-64" /> : s?.name || 'School'}
        description={
          s ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <CopyCode code={s.code} />
              {(s.city || s.state) && <span>{[s.city, s.state].filter(Boolean).join(', ')}</span>}
              <span>Partner since {fmtDate(s.createdAt)}</span>
              <Badge tone={statusTone(s.status)}>{titleCase(s.status)}</Badge>
            </span>
          ) : undefined
        }
        actions={
          <>
            <RangePicker
              value={range}
              onChange={(r) => {
                setRange(r);
                setPage(1);
              }}
            />
            <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditOpen(true)} disabled={!s}>
              Edit
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleteOpen(true)} disabled={!s}>
              Delete
            </Button>
          </>
        }
      />

      {notice && (
        <Alert tone="success" className="flex items-center justify-between">
          <span>{notice}</span>
          <button className="text-xs underline" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </Alert>
      )}

      {board.isError ? (
        <Card>
          <ErrorState error={board.error} onRetry={() => board.refetch()} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Students" value={fmtNumber(t?.students)} hint={t ? `${fmtNumber(t.newStudents)} joined in range` : undefined} loading={loading} />
            <StatCard
              label="Seats used"
              value={d ? `${fmtNumber(d.seats.redeemedSeats)} / ${fmtNumber(d.seats.licensedSeats)}` : '—'}
              hint={d ? <ProgressBar value={seatsPct} className="mt-1 w-24" /> : undefined}
              loading={loading}
            />
            <StatCard label="Active now" value={fmtNumber(t?.activeNow)} hint="last 10 minutes" loading={loading} />
            <StatCard label="Active today" value={fmtNumber(t?.activeToday)} loading={loading} />
            <StatCard
              label="Active in range"
              value={fmtNumber(t?.activeUsers)}
              hint={t ? `${activePct}% of students · ${fmtNumber(t.inactiveStudents)} inactive` : undefined}
              loading={loading}
            />
            <StatCard label="Time in app" value={t ? fmtMinutes(Math.round(t.totalActiveHours * 60)) : '—'} hint={t ? `${fmtMinutes(t.avgActiveMinutesPerUser)} per active student` : undefined} loading={loading} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Video watch time" value={fmtMinutes(t?.videoWatchMinutes)} hint={t ? `${fmtNumber(t.videoOpens)} video opens` : undefined} loading={loading} />
            <StatCard label="Doubts asked" value={fmtNumber(t?.doubtsAsked)} hint={t ? `${fmtNumber(t.doubtsResolved)} resolved` : undefined} loading={loading} />
            <StatCard label="Active Pro passes" value={fmtNumber(d?.seats.activePasses)} loading={loading} />
            <StatCard label="Never opened the app" value={fmtNumber(t?.neverActive)} hint="linked but no activity yet" loading={loading} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Daily activity" description="Students active per day and new students joining" />
              <CardBody>
                {loading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : d?.daily.some((x) => x.activeUsers > 0 || x.newStudents > 0) ? (
                  <TrendChart
                    data={d.daily}
                    xKey="date"
                    xFormatter={fmtDateShort}
                    series={[
                      { key: 'activeUsers', name: 'Active students' },
                      { key: 'newStudents', name: 'New students' },
                    ]}
                    height={260}
                  />
                ) : (
                  <EmptyState title="No activity in this range" description="Students show up here once they use the app after joining with the school code." />
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
                    items={(d?.features || []).map((f) => ({ key: f.feature, label: titleCase(f.feature), value: f.minutes, sub: `${fmtNumber(f.users)} students` }))}
                    emptyLabel="No activity in this range"
                  />
                )}
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Active hours"
                description={
                  d?.peakHour !== null && d?.peakHour !== undefined
                    ? `Students active by hour of day (India time). Busiest: ${fmtHour(d.peakHour)}`
                    : 'Students active by hour of day (India time)'
                }
              />
              <CardBody>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <BarsChart
                    data={d?.hourly || []}
                    xKey="hour"
                    yKey="activeUsers"
                    name="Students"
                    xFormatter={fmtHour}
                    highlightIndex={d?.peakHour ?? null}
                    height={200}
                  />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Students by class" />
              <CardBody>
                {loading ? (
                  <Skeleton className="h-[160px] w-full" />
                ) : (
                  <BarList
                    items={(d?.classBreakdown || []).map((c) => ({ key: c.classLevel, label: titleCase(c.classLevel), value: c.students }))}
                    emptyLabel="No students yet"
                  />
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Students</h2>
                <p className="text-xs text-slate-500">Click a student for their full activity report.</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="Search name or phone" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              </div>
            </div>
            <DataTable
              columns={studentColumns}
              rows={students.data?.items}
              rowKey={(r) => r.id}
              loading={students.isLoading || loading}
              error={students.isError ? students.error : null}
              onRetry={() => students.refetch()}
              onRowClick={(r) => router.push(`/analytics/students/${r.id}`)}
              sortKey={sort}
              onSort={(k) => {
                setSort(k as StudentSort);
                setPage(1);
              }}
              empty={
                <EmptyState
                  title={search ? 'No students match your search' : 'No students linked yet'}
                  description={search ? undefined : 'Students are linked to this school when they enter one of its license codes in the app.'}
                />
              }
            />
            {students.data && students.data.total > LIMIT && (
              <Pagination page={page} limit={LIMIT} total={students.data.total} onChange={setPage} />
            )}
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Videos watched" description="What this school's students watched in the range" />
              <CardBody className="p-0">
                {loading ? (
                  <Skeleton className="m-4 h-[160px]" />
                ) : d && d.topVideos.length ? (
                  <ul className="divide-y divide-slate-100">
                    {d.topVideos.map((v) => (
                      <li key={v.videoId} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="h-9 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
                          {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-900">{v.title}</p>
                          <p className="text-xs text-slate-500">
                            {fmtNumber(v.uniqueViewers)} students · {fmtMinutes(v.watchMinutes)} watched
                            {v.completionRate ? ` · ${Math.round(v.completionRate)}% finished` : ''}
                          </p>
                        </div>
                        {v.schoolOnly && <Badge tone="brand">School only</Badge>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No videos watched in this range" />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title="School-only videos"
                description="Assigned to this school, hidden from everyone else"
                actions={
                  <Link href="/schools" className="text-xs font-medium text-brand-700 hover:underline">
                    Assign videos
                  </Link>
                }
              />
              <CardBody className="p-0">
                {loading ? (
                  <Skeleton className="m-4 h-[160px]" />
                ) : d && d.assignedVideos.length ? (
                  <ul className="divide-y divide-slate-100">
                    {d.assignedVideos.map((v) => (
                      <li key={v.videoId} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="h-9 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
                          {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-900">{v.title}</p>
                          <p className="text-xs text-slate-500">
                            {v.uniqueViewers ? `${fmtNumber(v.uniqueViewers)} students · ${fmtMinutes(v.watchMinutes)} watched` : 'Not watched in this range'}
                          </p>
                        </div>
                        {v.status !== 'READY' && <Badge tone="warning">{titleCase(v.status)}</Badge>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No school-only videos" description="Every video this school sees is also in the main app." />
                )}
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="License codes" description="Codes students type in the app to join this school and get Pro" />
              <CardBody className="p-0">
                {loading ? (
                  <Skeleton className="m-4 h-[120px]" />
                ) : d && d.licenses.length ? (
                  <ul className="divide-y divide-slate-100">
                    {d.licenses.map((l) => {
                      const expired = new Date(l.validUntil).getTime() < Date.now();
                      return (
                        <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <CopyCode code={l.licenseCode} />
                          <div className="min-w-[140px] flex-1">
                            <p className="text-xs text-slate-600">
                              {fmtNumber(l.allocatedSeats)} of {fmtNumber(l.totalSeats)} seats used · valid until {fmtDate(l.validUntil)}
                            </p>
                            <ProgressBar value={l.totalSeats ? (l.allocatedSeats / l.totalSeats) * 100 : 0} className="mt-1" />
                          </div>
                          <Badge tone={!l.isActive ? 'neutral' : expired ? 'danger' : 'success'}>
                            {!l.isActive ? 'Deactivated' : expired ? 'Expired' : 'Active'}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState title="No codes yet" description="Generate one from the Schools page." />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Recent activity" description="Latest things this school's students did in the app" />
              <CardBody className="p-0">
                {loading ? (
                  <Skeleton className="m-4 h-[160px]" />
                ) : d && d.recentEvents.length ? (
                  <ul className="divide-y divide-slate-100">
                    {d.recentEvents.map((e, i) => (
                      <li key={i} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="truncate text-slate-900">
                            {e.studentId ? (
                              <Link href={`/analytics/students/${e.studentId}`} className="font-medium hover:underline">
                                {e.studentName || 'Student'}
                              </Link>
                            ) : (
                              'Student'
                            )}{' '}
                            <span className="text-slate-600">
                              {EVENT_LABEL[e.type] || titleCase(e.type)}{' '}
                              {e.videoTitle || e.element || e.screen || ''}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">{fmtRelative(e.at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : d && d.recentlyActive.length ? (
                  <ul className="divide-y divide-slate-100">
                    {d.recentlyActive.map((u) => (
                      <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <Link href={`/analytics/students/${u.id}`} className="min-w-0 truncate font-medium text-slate-900 hover:underline">
                          {u.name || u.phone}
                        </Link>
                        <span className="shrink-0 text-xs text-slate-500" title={fmtDateTime(u.lastSeenAt)}>
                          active {fmtRelative(u.lastSeenAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <AppEventsEmpty what="activity" />
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      <SchoolEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        school={
          s
            ? {
                id: s.id,
                name: s.name,
                code: s.code,
                city: s.city || undefined,
                state: s.state || undefined,
                contactEmail: s.contactEmail,
                contactPhone: s.contactPhone,
                status: s.status,
                totalSeats: s.totalSeats,
                branding: s.branding,
              }
            : null
        }
        onSaved={(u) => {
          setNotice(`Saved changes to ${u.name}.`);
          void qc.invalidateQueries({ queryKey: ['analytics', 'school'] });
          void qc.invalidateQueries({ queryKey: ['schools'] });
        }}
      />
      <SchoolDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        school={s ? { id: s.id, name: s.name, code: s.code } : null}
        studentCount={t?.students}
        onDeleted={(r) => {
          void qc.invalidateQueries({ queryKey: ['schools'] });
          router.replace(`/schools?deleted=${encodeURIComponent(r.code)}&unlinked=${r.studentsUnlinked}`);
        }}
      />
    </AppShell>
  );
}

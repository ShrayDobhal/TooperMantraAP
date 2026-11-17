'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { analyticsApi, StudentRow, StudentSort } from '@/api/analytics';
import { AppShell } from '@/components/AppShell';
import { Card, Column, DataTable, EmptyState, Input, PageHeader, Pagination, RangePicker } from '@/components/ui';
import { useRange } from '@/hooks/useRange';
import { fmtDate, fmtMinutes, fmtNumber, fmtRelative, titleCase } from '@/lib/format';

const LIMIT = 25;

export default function StudentAnalyticsPage() {
  const router = useRouter();
  const [range, setRange] = useRange('30d');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<StudentSort>('activeMinutes');
  const [page, setPage] = useState(1);

  // Debounce search so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const q = useQuery({
    queryKey: ['analytics', 'students', range, search, sort, page],
    queryFn: () => analyticsApi.students({ range, search: search || undefined, sort, page, limit: LIMIT }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const columns: Column<StudentRow>[] = [
    {
      key: 'name',
      header: 'Student',
      cell: (s) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{s.name || 'Unnamed student'}</p>
          <p className="text-xs text-slate-500">{s.phone}</p>
        </div>
      ),
    },
    { key: 'school', header: 'School', cell: (s) => <span className="text-slate-600">{s.schoolName || 'Direct (B2C)'}</span> },
    { key: 'activeMinutes', header: 'Time in app', align: 'right', sortable: true, cell: (s) => fmtMinutes(s.activeMinutes) },
    { key: 'daysActive', header: 'Days active', align: 'right', sortable: true, cell: (s) => fmtNumber(s.daysActive) },
    { key: 'videoMinutes', header: 'Video time', align: 'right', cell: (s) => fmtMinutes(s.videoMinutes) },
    { key: 'topFeature', header: 'Most used', cell: (s) => <span className="text-slate-600">{s.topFeature ? titleCase(s.topFeature) : '—'}</span> },
    { key: 'lastSeen', header: 'Last seen', sortable: true, cell: (s) => <span className="text-slate-600">{fmtRelative(s.lastSeenAt)}</span> },
    { key: 'createdAt', header: 'Joined', sortable: true, cell: (s) => <span className="text-slate-600">{fmtDate(s.createdAt)}</span> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Student analytics"
        description="Time spent, active days and most-used sections for every student. Click a row for the full activity report."
        actions={<RangePicker value={range} onChange={(r) => { setRange(r); setPage(1); }} />}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search name or phone" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <p className="text-xs text-slate-500">{q.data ? `${fmtNumber(q.data.total)} students` : ''}</p>
        </div>
        <DataTable
          columns={columns}
          rows={q.data?.items}
          rowKey={(s) => s.id}
          loading={q.isLoading}
          error={q.isError ? q.error : null}
          onRetry={() => q.refetch()}
          onRowClick={(s) => router.push(`/analytics/students/${s.id}`)}
          sortKey={sort}
          onSort={(k) => {
            setSort(k as StudentSort);
            setPage(1);
          }}
          empty={<EmptyState title={search ? 'No students match your search' : 'No students yet'} />}
        />
        {q.data && q.data.total > LIMIT && <Pagination page={page} limit={LIMIT} total={q.data.total} onChange={setPage} />}
      </Card>
    </AppShell>
  );
}

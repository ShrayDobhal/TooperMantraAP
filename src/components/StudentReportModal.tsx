'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { studentsApi } from '@/api';
import { analyticsApi } from '@/api/analytics';
import { Badge, Button, ErrorState, Modal, Skeleton, statusTone } from '@/components/ui';
import { fmtDate, fmtMinutes, fmtNumber, fmtRelative, fmtSeconds, titleCase } from '@/lib/format';

export interface StudentReportData {
  id: string;
  phone: string;
  role?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  fullName?: string;
  targetExam?: string;
  targetExamYear?: number | string;
  educationLevel?: string;
  studyMode?: string;
  schoolName?: string;
  schoolCode?: string;
  streakDays?: number;
  xpPoints?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

interface StudentReportModalProps {
  student: StudentReportData | null;
  onClose: () => void;
  onStatusChange?: (studentId: string, nextStatus: 'ACTIVE' | 'SUSPENDED') => void;
}

/** Quick view of a student's real activity (last 30 days), with a link to the full report. */
export function StudentReportModal({ student, onClose, onStatusChange }: StudentReportModalProps) {
  const [toggling, setToggling] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED'>(student?.status || 'ACTIVE');
  const [toggleError, setToggleError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['analytics', 'student', student?.id, '30d'],
    queryFn: () => analyticsApi.student(student!.id, { range: '30d' }),
    enabled: !!student?.id,
    staleTime: 30_000,
  });

  if (!student) return null;
  const d = q.data;

  const toggle = async () => {
    const next = status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setToggling(true);
    setToggleError(null);
    try {
      await studentsApi.updateStudentStatus(student.id, next);
      setStatus(next);
      onStatusChange?.(student.id, next);
    } catch (e: any) {
      setToggleError(e?.message || 'Could not update the account status.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          {student.fullName || 'Unnamed student'}
          <Badge tone={statusTone(status)}>{titleCase(status)}</Badge>
        </span>
      }
      description={[student.phone, student.schoolName || student.schoolCode, student.targetExam].filter(Boolean).join(' · ')}
      footer={
        <>
          <Button variant={status === 'ACTIVE' ? 'danger' : 'secondary'} loading={toggling} onClick={toggle}>
            {status === 'ACTIVE' ? 'Suspend account' : 'Reactivate account'}
          </Button>
          <Link href={`/analytics/students/${student.id}`}>
            <Button variant="primary" icon={<ArrowRight className="h-4 w-4" />}>
              Full activity report
            </Button>
          </Link>
        </>
      }
    >
      {toggleError && <p className="mb-3 text-sm text-red-600">{toggleError}</p>}
      <dl className="mb-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Joined</dt>
          <dd className="text-slate-800">{fmtDate(student.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Last seen</dt>
          <dd className="text-slate-800">{fmtRelative(d?.student.lastSeenAt ?? student.lastLoginAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Class</dt>
          <dd className="text-slate-800">{titleCase(student.educationLevel)}</dd>
        </div>
      </dl>

      <p className="mb-2 text-xs font-medium text-slate-500">Last 30 days</p>
      {q.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : d ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Time in app', fmtMinutes(d.totals.activeMinutes)],
              ['Days active', fmtNumber(d.totals.daysActive)],
              ['Video time', fmtMinutes(d.totals.videoMinutes)],
              ['Doubts asked', fmtNumber(d.totals.doubtsAsked)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-5 text-xs font-medium text-slate-500">Recordings watched</p>
          {d.videos.length ? (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {d.videos.slice(0, 6).map((v) => (
                <li key={v.videoId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="truncate text-slate-800">{v.title}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-slate-600">
                    {fmtSeconds(v.watchSeconds)}
                    {v.completed && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
              No recordings watched in the last 30 days.
            </p>
          )}
        </>
      ) : null}
    </Modal>
  );
}

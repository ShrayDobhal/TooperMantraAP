'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StudentDrawer } from '@/components/StudentDrawer';
import { studentsApi, StudentUser } from '@/api';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Ban,
  Loader2,
  Download,
  Filter,
  Eye,
  GraduationCap,
  School,
  Flame,
  Award,
  ExternalLink,
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Slide-over Drawer
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await studentsApi.getStudents();
      if (res && res.success) {
        setStudents(res.data.items || []);
      } else {
        setErrorMsg('Failed to load student directory from backend API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to communicate with backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleStatus = async (e: React.MouseEvent, student: StudentUser) => {
    e.stopPropagation();
    const nextStatus = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTogglingId(student.id);
    try {
      await studentsApi.updateStudentStatus(student.id, nextStatus);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s))
      );
      setToastMsg(`Student account status changed to ${nextStatus}.`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update student account status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      alert('No students to export.');
      return;
    }
    const exportData = filtered.map((s) => ({
      StudentID: s.id,
      FullName: s.profile?.fullName || 'Student',
      Phone: s.phone,
      TargetExam: s.profile?.targetExam || 'General',
      SchoolOrCollege: s.profile?.schoolOrCollege || s.profile?.schoolName || 'Self Study',
      Status: s.status,
      JoinedDate: s.createdAt || '',
    }));
    exportToCSV(exportData, 'TopperMantra_Student_Roster');
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const name = (s.profile?.fullName || '').toLowerCase();
    const phone = s.phone || '';
    const school = (s.profile?.schoolOrCollege || s.profile?.schoolName || '').toLowerCase();
    const matchesSearch = name.includes(q) || phone.includes(q) || school.includes(q);

    const matchesExam = examFilter === 'ALL' || (s.profile?.targetExam || '').toUpperCase() === examFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.status === 'ACTIVE') ||
      (statusFilter === 'SUSPENDED' && s.status === 'SUSPENDED');

    return matchesSearch && matchesExam && matchesStatus;
  });

  const uniqueExams = Array.from(
    new Set(
      students
        .map((s) => s.profile?.targetExam?.toUpperCase())
        .filter((ex): ex is string => Boolean(ex))
    )
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Students Roster & Learning Dossiers
                </h1>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Manage all registered students, inspect 360° watch progress and doubt resolution activity, and enforce account access controls.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Students"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-zinc-400" /> Export CSV
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-700 transition-colors">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name, phone, or school..."
                className="bg-transparent text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-xs text-zinc-400 hover:text-slate-100">
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Exam Filter */}
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Exam:</span>
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="ALL">All Exams</option>
                  {uniqueExams.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-zinc-800 text-slate-100 font-semibold'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('SUSPENDED')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'SUSPENDED'
                      ? 'bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchStudents} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-500">
                Retry
              </button>
            </div>
          )}

          {toastMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Student Data Table */}
          <div className="exec-card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                <div className="h-10 skeleton"></div>
                <div className="h-10 skeleton"></div>
                <div className="h-10 skeleton"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-slate-300">No students found matching your criteria.</p>
                <p className="text-xs text-zinc-500">Try changing your search keywords or active status filter.</p>
              </div>
            ) : (
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Phone Number</th>
                    <th>Target Exam</th>
                    <th>School / Study Mode</th>
                    <th>Access Status</th>
                    <th className="text-right">Action / Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setIsDrawerOpen(true);
                      }}
                      className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    >
                      <td className="font-semibold text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold shrink-0">
                            {student.profile?.fullName ? student.profile.fullName[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-100">
                              {student.profile?.fullName || 'Registered Student'}
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: {student.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="font-mono text-zinc-300 text-xs">{student.phone}</td>

                      <td className="text-zinc-300 font-medium text-xs">
                        {student.profile?.targetExam || 'General'}
                      </td>

                      <td className="text-zinc-400 text-xs">
                        {student.profile?.schoolOrCollege || student.profile?.schoolName ? (
                          <span className="font-semibold text-orange-400">
                            {student.profile.schoolOrCollege || student.profile.schoolName}
                          </span>
                        ) : (
                          student.profile?.studyMode || 'B2C Self Study'
                        )}
                      </td>

                      <td>
                        <span
                          className={`px-2.5 py-0.5 text-xs rounded-full font-bold uppercase border ${
                            student.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          ● {student.status}
                        </span>
                      </td>

                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setIsDrawerOpen(true);
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-orange-400" /> Dossier
                          </button>

                          <button
                            onClick={(e) => toggleStatus(e, student)}
                            disabled={togglingId === student.id}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                              student.status === 'ACTIVE'
                                ? 'bg-zinc-800 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 border border-zinc-700'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {togglingId === student.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : student.status === 'ACTIVE' ? (
                              <>
                                <Ban className="w-3 h-3 text-rose-400" /> Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Reinstate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 360° Slide-Over Dossier Drawer */}
          <StudentDrawer
            studentId={selectedStudentId}
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setSelectedStudentId(null);
            }}
            onStatusChanged={(id, newStatus) => {
              setStudents((prev) =>
                prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
              );
            }}
          />
        </main>
      </div>
    </div>
  );
}

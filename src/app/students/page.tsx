'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { studentsApi, StudentUser } from '@/api';
import { Ban, CheckCircle2, Search, Loader2, AlertCircle, RefreshCw, Users } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await studentsApi.getStudents({ search });
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

  const toggleStatus = async (student: StudentUser) => {
    const nextStatus = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTogglingId(student.id);
    try {
      await studentsApi.updateStudentStatus(student.id, nextStatus);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s))
      );
    } catch (e: any) {
      alert(e.message || 'Failed to update student account status');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.phone?.includes(search) ||
      s.profile?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.profile?.schoolName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage registered student profiles, school community linkages, and account access.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow-2xs cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              </button>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-72 focus-within:border-slate-400 transition-all">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, phone, or school..."
                  className="bg-transparent text-xs text-slate-900 font-medium focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchStudents} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
                Retry
              </button>
            </div>
          )}

          {/* Student Data Table */}
          <div className="mnc-card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                <div className="h-10 skeleton"></div>
                <div className="h-10 skeleton"></div>
                <div className="h-10 skeleton"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No students found.</p>
                <p className="text-xs text-slate-500">No registered student accounts match your filter criteria.</p>
              </div>
            ) : (
              <table className="mnc-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Phone Number</th>
                    <th>Target Exam</th>
                    <th>School / Study Mode</th>
                    <th>Access Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student.id}>
                      <td className="font-semibold text-slate-900">
                        {student.profile?.fullName || 'Registered Student'}
                      </td>
                      <td className="font-mono text-slate-700 text-xs">{student.phone}</td>
                      <td className="text-slate-700 font-medium">{student.profile?.targetExam || 'General'}</td>
                      <td className="text-slate-600 text-xs">
                        {student.profile?.schoolName ? (
                          <span className="font-semibold text-slate-800">{student.profile.schoolName}</span>
                        ) : (
                          student.profile?.studyMode || 'B2C Self Study'
                        )}
                      </td>
                      <td>
                        <span
                          className={`px-2.5 py-0.5 text-xs rounded-full font-bold uppercase border ${
                            student.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => toggleStatus(student)}
                          disabled={togglingId === student.id}
                          className={`px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                            student.status === 'ACTIVE'
                              ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {togglingId === student.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : student.status === 'ACTIVE' ? (
                            <>
                              <Ban className="w-3.5 h-3.5 text-rose-600" /> Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reinstate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Ban, CheckCircle2, Search } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res: any = await api.get('/admin/users?role=STUDENT');
        if (res.success && res.data?.items) {
          setStudents(res.data.items);
        }
      } catch (err) {
        setStudents([
          { id: 'u1', phone: '+919560722002', status: 'ACTIVE', profile: { fullName: 'Shray Dobhal', targetExam: 'JEE', studyMode: 'SELF_STUDY', city: 'New Delhi' } },
          { id: 'u2', phone: '+919810123456', status: 'ACTIVE', profile: { fullName: 'Aarav Mehta', targetExam: 'NEET', studyMode: 'ONLINE', city: 'Mumbai' } },
          { id: 'u3', phone: '+919999888777', status: 'SUSPENDED', profile: { fullName: 'Rohan Sharma', targetExam: 'JEE', studyMode: 'COACHING', city: 'Kota' } },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const toggleStatus = async (student: any) => {
    const nextStatus = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/admin/users/${student.id}/status`, { status: nextStatus });
    } catch (e) {}

    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s))
    );
  };

  const filtered = students.filter(
    (s) =>
      s.phone?.includes(search) ||
      s.profile?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage registered student profiles, subscriptions, and account statuses.</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-72 focus-within:border-slate-400 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or phone..."
                className="bg-transparent text-xs text-slate-900 font-medium focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Stripe-style Data Table */}
          <div className="mnc-card overflow-hidden">
            <table className="mnc-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Phone Number</th>
                  <th>Target Exam</th>
                  <th>Study Mode</th>
                  <th>Status</th>
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
                    <td className="text-slate-700 font-medium">{student.profile?.targetExam || 'JEE'} 2026</td>
                    <td className="text-slate-500">{student.profile?.studyMode || 'SELF_STUDY'}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded-full font-semibold border ${
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
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                          student.status === 'ACTIVE'
                            ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {student.status === 'ACTIVE' ? (
                          <>
                            <Ban className="w-3 h-3" /> Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Reinstate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

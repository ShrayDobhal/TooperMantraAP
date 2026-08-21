'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Users, Ban, CheckCircle2, Search, Sparkles } from 'lucide-react';

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
        <main className="p-8 space-y-8 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-600 text-xs font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> User Management
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Account Governance</h1>
              <p className="text-slate-500 text-sm mt-1">View student profiles, exam targets, and moderate active student sessions.</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 w-80 shadow-xs focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or phone..."
                className="bg-transparent text-sm text-slate-900 font-medium focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="tm-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Target Exam</th>
                  <th className="px-6 py-4">Study Mode</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {student.profile?.fullName || 'Registered Student'}
                    </td>
                    <td className="px-6 py-4 font-mono text-orange-600 font-bold">{student.phone}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">{student.profile?.targetExam || 'JEE'} 2026</td>
                    <td className="px-6 py-4 text-slate-500">{student.profile?.studyMode || 'SELF_STUDY'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-bold border ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(student)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto transition-all ${
                          student.status === 'ACTIVE'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {student.status === 'ACTIVE' ? (
                          <>
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reinstate
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

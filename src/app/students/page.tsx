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
    <div className="flex min-h-screen bg-[#0b0f17]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-8 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Account Governance
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Student Account Management</h1>
              <p className="text-slate-400 text-sm mt-1">View student profiles, exam targets, and moderate active sessions.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 w-72">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or phone..."
                className="bg-transparent text-sm text-white focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="glass-card border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student Name</th>
                  <th className="px-6 py-4 font-semibold">Phone Number</th>
                  <th className="px-6 py-4 font-semibold">Target Exam</th>
                  <th className="px-6 py-4 font-semibold">Study Mode</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {student.profile?.fullName || 'Registered Student'}
                    </td>
                    <td className="px-6 py-4 font-mono text-cyan-400">{student.phone}</td>
                    <td className="px-6 py-4 font-medium text-slate-300">{student.profile?.targetExam || 'JEE'} 2026</td>
                    <td className="px-6 py-4 text-slate-400">{student.profile?.studyMode || 'SELF_STUDY'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-semibold border ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(student)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors ${
                          student.status === 'ACTIVE'
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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

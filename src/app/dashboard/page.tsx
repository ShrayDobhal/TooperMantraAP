'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { dashboardApi, DashboardStats } from '@/api';
import { Users, GraduationCap, MessageSquare, DollarSign, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function fetchStats() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await dashboardApi.getStats();
      if (res && res.data) {
        setStats(res.data);
      } else {
        setErrorMsg('Unable to load dashboard statistics from backend API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
              <p className="text-slate-500 text-xs mt-0.5">Real-time platform metrics, active student activity, and revenue breakdown.</p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-all"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchStats} className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700">
                Retry
              </button>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="mnc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 skeleton mt-2 w-28"></div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-2">
                  {stats?.totalStudents !== undefined ? stats.totalStudents.toLocaleString() : '0'}
                </h3>
              )}
              <div className="mt-3 flex items-center gap-1 text-emerald-600 text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +12.4% vs last month
              </div>
            </div>

            <div className="mnc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 skeleton mt-2 w-32"></div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-2">
                  ₹ {stats?.totalRevenueInPaise !== undefined ? ((stats.totalRevenueInPaise || 0) / 100).toLocaleString() : '0'}
                </h3>
              )}
              <p className="mt-3 text-slate-500 text-xs font-medium">B2C & B2B School Licenses</p>
            </div>

            <div className="mnc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Mentors</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 skeleton mt-2 w-16"></div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalMentors ?? 0}</h3>
              )}
              <p className="mt-3 text-slate-500 text-xs font-medium">Verified Subject Experts</p>
            </div>

            <div className="mnc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doubt Resolution</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 skeleton mt-2 w-20"></div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats?.doubtResolutionRatePercentage ?? 0}%</h3>
              )}
              <p className="mt-3 text-emerald-600 text-xs font-medium">{stats?.totalDoubtsResolved ?? 0} Doubts Solved</p>
            </div>
          </div>

          {/* Interactive Growth Chart */}
          <div className="mnc-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Active Users (DAU) Growth</h3>
                <p className="text-xs text-slate-500">Student activity trend across peak study hours</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.dauMauTrends || []}>
                  <defs>
                    <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="dau" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#colorDau)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

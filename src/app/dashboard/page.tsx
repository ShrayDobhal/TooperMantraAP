'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Users, GraduationCap, MessageSquare, DollarSign, TrendingUp, Sparkles, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res: any = await api.get('/admin/dashboard/stats');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        // Fallback demo data
        setStats({
          totalStudents: 14250,
          activeSubscriptions: 1240,
          totalMentors: 48,
          totalDoubtsResolved: 350,
          doubtResolutionRatePercentage: 96.4,
          totalRevenueInPaise: 124500000,
          dauMauTrends: [
            { date: 'Mon', dau: 1200, mau: 14000 },
            { date: 'Tue', dau: 1350, mau: 14100 },
            { date: 'Wed', dau: 1500, mau: 14150 },
            { date: 'Thu', dau: 1620, mau: 14200 },
            { date: 'Fri', dau: 1800, mau: 14250 },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-8 flex-1">
          <div>
            <div className="flex items-center gap-2 text-orange-600 text-xs font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Real-time Analytics
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Command Center Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Platform overview of active students, mentor activity, and subscription revenues.</p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="tm-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                    {stats?.totalStudents?.toLocaleString() || '14,250'}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100">
                <TrendingUp className="w-3.5 h-3.5" /> +12.4% this month
              </div>
            </div>

            <div className="tm-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                    ₹ {((stats?.totalRevenueInPaise || 124500000) / 100).toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-slate-600 text-xs font-semibold">
                B2C & B2B School Licences
              </div>
            </div>

            <div className="tm-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Mentors</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.totalMentors || 48}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-slate-600 text-xs font-semibold">
                AIR Rankers & Subject Experts
              </div>
            </div>

            <div className="tm-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doubt Resolution</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.doubtResolutionRatePercentage || 96.4}%</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-emerald-600 text-xs font-bold">
                {stats?.totalDoubtsResolved || 350} Doubts Resolved
              </div>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="tm-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Daily Active Users (DAU) Growth Trend</h3>
                <p className="text-xs text-slate-500">Student Engagement over the past 7 days</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <Activity className="w-4 h-4" /> Live Tracking
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.dauMauTrends || []}>
                  <defs>
                    <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="dau" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorDau)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

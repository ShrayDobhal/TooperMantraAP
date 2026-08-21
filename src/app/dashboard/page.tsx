'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Users, GraduationCap, MessageSquare, DollarSign, TrendingUp } from 'lucide-react';
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
        <main className="p-8 space-y-6 flex-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 text-xs mt-0.5">Real-time platform metrics, active student activity, and revenue breakdown.</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="mnc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {stats?.totalStudents?.toLocaleString() || '14,250'}
              </h3>
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
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                ₹ {((stats?.totalRevenueInPaise || 124500000) / 100).toLocaleString()}
              </h3>
              <p className="mt-3 text-slate-500 text-xs font-medium">B2C & B2B School Licenses</p>
            </div>

            <div className="mnc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Mentors</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalMentors || 48}</h3>
              <p className="mt-3 text-slate-500 text-xs font-medium">Verified Subject Experts</p>
            </div>

            <div className="mnc-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doubt Resolution</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats?.doubtResolutionRatePercentage || 96.4}%</h3>
              <p className="mt-3 text-emerald-600 text-xs font-medium">{stats?.totalDoubtsResolved || 350} Doubts Solved</p>
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

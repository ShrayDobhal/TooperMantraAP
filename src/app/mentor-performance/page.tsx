'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  TrendingUp,
  Users,
  HelpCircle,
  Calendar,
  Star,
  Clock,
  CheckCircle2,
  Smile,
  Award,
  Sparkles
} from 'lucide-react';

export default function MentorPerformancePage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300 max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentor Performance Analytics</h1>
              <p className="text-slate-500 text-xs mt-0.5">Track your mentorship impact, doubt resolution response times, rating trends, and student satisfaction scores.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Top Tier Mentor Badge
              </span>
            </div>
          </div>

          {/* Performance KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Students Helped */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Students Helped</span>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">128</p>
              <p className="text-xs text-emerald-600 font-semibold">+18% vs last month</p>
            </div>

            {/* Doubts Solved */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Doubts Solved</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">214</p>
              <p className="text-xs text-indigo-600 font-semibold">98.4% resolution rate</p>
            </div>

            {/* Sessions Completed */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Sessions Completed</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">46</p>
              <p className="text-xs text-blue-600 font-semibold">100% on-time attendance</p>
            </div>

            {/* Average Rating */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Average Rating</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">4.92 / 5</p>
              <p className="text-xs text-amber-600 font-semibold">From 94 student ratings</p>
            </div>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Response Time */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Average Response Time</span>
                  <p className="text-xl font-bold text-slate-900">8 mins 42 secs</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">Top 5% fastest mentor response times on platform</p>
            </div>

            {/* Resolution Rate */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Resolution Rate</span>
                  <p className="text-xl font-bold text-slate-900">98.4%</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">211 out of 214 doubts resolved on first explanation</p>
            </div>

            {/* Student Satisfaction */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Smile className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Student Satisfaction</span>
                  <p className="text-xl font-bold text-slate-900">97.2%</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">Based on post-session student feedback surveys</p>
            </div>
          </div>

          {/* Monthly Performance Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Monthly Performance Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="mnc-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Doubts Solved</th>
                    <th>Sessions Taken</th>
                    <th>Students Impacted</th>
                    <th>Avg Rating</th>
                    <th>Satisfaction Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-slate-900">August 2026</td>
                    <td>74</td>
                    <td>16</td>
                    <td>42</td>
                    <td><span className="font-bold text-amber-600">4.95 ★</span></td>
                    <td><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">98%</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">July 2026</td>
                    <td>68</td>
                    <td>15</td>
                    <td>38</td>
                    <td><span className="font-bold text-amber-600">4.91 ★</span></td>
                    <td><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">97%</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">June 2026</td>
                    <td>72</td>
                    <td>15</td>
                    <td>48</td>
                    <td><span className="font-bold text-amber-600">4.89 ★</span></td>
                    <td><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">96%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

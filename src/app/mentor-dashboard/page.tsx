'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Calendar,
  HelpCircle,
  Clock,
  Users,
  Star,
  Bell,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Video,
  BookOpen
} from 'lucide-react';

export default function MentorDashboardPage() {
  const [mentorName, setMentorName] = useState('Senior Mentor');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('tm_user');
      if (u) {
        try {
          const parsed = JSON.parse(u);
          setMentorName(parsed.name || parsed.phone || 'Senior Mentor');
        } catch (e) {}
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Mentor Workspace
                </span>
                <span className="text-xs text-slate-400">Live Active Session</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, {mentorName}!</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Here is your mentorship overview for today. You have <strong className="text-white">3 upcoming calls</strong> and <strong className="text-white">4 pending student doubt tickets</strong> waiting in queue.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/doubts"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" />
                Solve Doubts Queue
              </a>
              <a
                href="/sessions"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                View Schedule
              </a>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Today's Sessions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Today's Sessions</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">3</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">2 completed, 1 upcoming</p>
            </div>

            {/* Pending Doubts */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Pending Doubts</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">4</p>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Avg response &lt; 15 mins</p>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Upcoming Calls</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">5</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Next session in 45 mins</p>
            </div>

            {/* Students Helped */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Students Helped</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">128</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">+14 this week</p>
            </div>

            {/* Average Rating */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Average Rating</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">4.92</p>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">From 94 student reviews</p>
            </div>

            {/* Unread Notifications */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Notifications</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">2</p>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">Unread updates</p>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule & Sessions */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Today's Mentorship Calls & Sessions</h3>
                </div>
                <a href="/sessions" className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                  View Full Schedule <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3">
                {/* Session 1 */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                      10:30 AM
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">JEE Physics Concept Revision: Electromagnetism</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Student: Rohan Sharma • DPS R.K. Puram</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold">
                    Completed
                  </span>
                </div>

                {/* Session 2 */}
                <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                      02:00 PM
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">NEET Biology 1-on-1 Guidance: Human Physiology</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Student: Ananya Verma • GD Goenka Public School</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold animate-pulse">
                    Upcoming Next
                  </span>
                </div>

                {/* Session 3 */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      05:30 PM
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Boards Mathematics Problem Solving Strategy</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Student: Aarav Mehta • Modern School</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">
                    Scheduled
                  </span>
                </div>
              </div>
            </div>

            {/* Unread Notifications Preview Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Recent Notifications</h3>
                </div>
                <a href="/notifications" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
                  View All
                </a>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-orange-50/40 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-700 uppercase">New Student Request</span>
                    <span className="text-[10px] text-slate-400">10m ago</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1">Aarav Mehta requested a 1-on-1 Math doubt call.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">New Doubt Submitted</span>
                    <span className="text-[10px] text-slate-400">1h ago</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1">Physics doubt ticket #4099 assigned to queue.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Session Completed</span>
                    <span className="text-[10px] text-slate-400">3h ago</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1">5-star rating received for Electromagnetism call!</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

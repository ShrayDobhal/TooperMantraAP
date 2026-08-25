'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Calendar, Clock, Video, User, CheckCircle2, XCircle, ArrowRight, Plus } from 'lucide-react';

interface MentorshipSession {
  id: string;
  studentName: string;
  studentSchool: string;
  topic: string;
  category: string;
  time: string;
  date: string;
  status: 'UPCOMING' | 'TODAY' | 'COMPLETED' | 'CANCELLED';
  meetUrl?: string;
}

const SAMPLE_SESSIONS: MentorshipSession[] = [
  {
    id: 's1',
    studentName: 'Rohan Sharma',
    studentSchool: 'DPS R.K. Puram',
    topic: 'Electromagnetism & Faraday Laws',
    category: 'JEE Physics',
    time: '10:30 AM',
    date: 'Today',
    status: 'TODAY',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 's2',
    studentName: 'Ananya Verma',
    studentSchool: 'GD Goenka Public School',
    topic: 'Human Physiology & Neural Control',
    category: 'NEET Biology',
    time: '02:00 PM',
    date: 'Today',
    status: 'TODAY',
    meetUrl: 'https://meet.google.com/xyz-uvwx-rst',
  },
  {
    id: 's3',
    studentName: 'Aarav Mehta',
    studentSchool: 'Modern School',
    topic: 'Integration Calculus Shortcuts',
    category: 'Boards Math',
    time: '05:30 PM',
    date: 'Today',
    status: 'UPCOMING',
  },
  {
    id: 's4',
    studentName: 'Priya Singh',
    studentSchool: 'Noida Public School',
    topic: 'Organic Chemistry Reactions',
    category: 'JEE Chemistry',
    time: '11:00 AM',
    date: 'Tomorrow',
    status: 'UPCOMING',
  },
  {
    id: 's5',
    studentName: 'Kabir Patel',
    studentSchool: 'Ryan International',
    topic: 'Rotational Motion Numericals',
    category: 'JEE Physics',
    time: '04:00 PM',
    date: 'Yesterday',
    status: 'COMPLETED',
  },
  {
    id: 's6',
    studentName: 'Sneha Kapoor',
    studentSchool: 'Scottish High',
    topic: 'Genetics & Molecular Inheritance',
    category: 'NEET Biology',
    time: '03:00 PM',
    date: '3 days ago',
    status: 'CANCELLED',
  },
];

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed' | 'cancelled'>('today');

  const filteredSessions = SAMPLE_SESSIONS.filter((s) => {
    if (activeTab === 'today') return s.status === 'TODAY';
    if (activeTab === 'upcoming') return s.status === 'UPCOMING' || s.status === 'TODAY';
    if (activeTab === 'completed') return s.status === 'COMPLETED';
    if (activeTab === 'cancelled') return s.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentorship Sessions Queue</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage 1-on-1 video calls, schedule student guidance sessions, and launch live video meets.</p>
            </div>
            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-2xs flex items-center gap-2 cursor-pointer transition-all">
              <Plus className="w-4 h-4" />
              Schedule Session
            </button>
          </div>

          {/* Sub-Tabs Selector Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'today'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Today's Sessions ({SAMPLE_SESSIONS.filter(s => s.status === 'TODAY').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upcoming ({SAMPLE_SESSIONS.filter(s => s.status === 'UPCOMING' || s.status === 'TODAY').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'completed'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Completed ({SAMPLE_SESSIONS.filter(s => s.status === 'COMPLETED').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cancelled')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'cancelled'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancelled ({SAMPLE_SESSIONS.filter(s => s.status === 'CANCELLED').length})
            </button>
          </div>

          {/* Sessions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <div key={session.id} className="mnc-card p-5 space-y-4 bg-white flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full uppercase">
                      {session.category}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {session.time} ({session.date})
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-tight mt-1">{session.topic}</h3>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-900">{session.studentName}</p>
                      <p className="text-[11px] text-slate-500">{session.studentSchool}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {session.status === 'COMPLETED' ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Call Completed
                    </span>
                  ) : session.status === 'CANCELLED' ? (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Call Cancelled
                    </span>
                  ) : (
                    <a
                      href={session.meetUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Video className="w-4 h-4" />
                      Launch Video Call
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

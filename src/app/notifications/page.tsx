'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Bell, CheckCircle2, MessageSquare, Calendar, HelpCircle, Megaphone, UserPlus, Sparkles } from 'lucide-react';

interface NotificationItem {
  id: string;
  category: 'STUDENT_REQUEST' | 'NEW_DOUBT' | 'SESSION_REMINDER' | 'STUDENT_MESSAGE' | 'ADMIN_ANNOUNCEMENT';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: NotificationItem[] = [
  {
    id: 'n1',
    category: 'STUDENT_REQUEST',
    title: 'New Student Session Request',
    message: 'Aarav Mehta requested a 1-on-1 Math Doubt session for tomorrow at 4:00 PM.',
    time: '10 mins ago',
    read: true,
  },
  {
    id: 'n2',
    category: 'NEW_DOUBT',
    title: 'New Doubt Ticket Submitted',
    message: 'Physics question regarding Faraday law of induction submitted by Rohan Sharma.',
    time: '45 mins ago',
    read: true,
  },
  {
    id: 'n3',
    category: 'SESSION_REMINDER',
    title: 'Upcoming Session Reminder',
    message: 'NEET Biology 1-on-1 call with Ananya Verma starts in 30 minutes.',
    time: '1 hour ago',
    read: true,
  },
  {
    id: 'n4',
    category: 'STUDENT_MESSAGE',
    title: 'New Message from Student',
    message: 'Priya Singh sent a follow-up query regarding Organic Chemistry mechanism.',
    time: '3 hours ago',
    read: true,
  },
  {
    id: 'n5',
    category: 'ADMIN_ANNOUNCEMENT',
    title: 'Admin Platform Announcement',
    message: 'Updated school curriculum materials & practice test solutions published for August 2026.',
    time: '5 hours ago',
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFS);

  useEffect(() => {
    // Automatically mark all notifications as read upon opening
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'STUDENT_REQUEST':
        return <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full uppercase">New Student Request</span>;
      case 'NEW_DOUBT':
        return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">New Doubt</span>;
      case 'SESSION_REMINDER':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Session Reminder</span>;
      case 'STUDENT_MESSAGE':
        return <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">Student Message</span>;
      case 'ADMIN_ANNOUNCEMENT':
        return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Admin Announcement</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full uppercase">Notification</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'STUDENT_REQUEST':
        return <UserPlus className="w-4 h-4 text-orange-600" />;
      case 'NEW_DOUBT':
        return <HelpCircle className="w-4 h-4 text-blue-600" />;
      case 'SESSION_REMINDER':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'STUDENT_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'ADMIN_ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 space-y-6 flex-1 animate-in fade-in duration-300 max-w-5xl w-full mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications Feed</h1>
              <p className="text-slate-500 text-xs mt-0.5">Live announcements, student requests, doubt assignments, and session reminders.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              All notifications marked as read
            </span>
          </div>

          {/* Notifications Feed List */}
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="mnc-card p-5 bg-white space-y-2 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getCategoryIcon(n.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(n.category)}
                      <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

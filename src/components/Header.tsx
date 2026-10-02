'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  User,
  X,
  Building2,
  Video,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Sun,
  Moon,
  ShieldCheck,
  Command,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { schoolsApi, videosApi, studentsApi, School, VideoItem, StudentUser } from '@/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Access License Generated',
    message: '500 seat license coupon generated for Indirapuram Public School, Ayodhya (IPS-AYODHYA-2026)',
    time: '2m ago',
    type: 'success',
    read: false,
    link: '/schools',
  },
  {
    id: 'n2',
    title: 'Bunny Stream Online',
    message: 'Direct video file upload connected to Bunny CDN Library 735098',
    time: '15m ago',
    type: 'info',
    read: false,
    link: '/inspire',
  },
  {
    id: 'n3',
    title: 'Student Roster Synchronized',
    message: 'Active student directory synced with Hostinger VPS backend',
    time: '1h ago',
    type: 'info',
    read: false,
    link: '/students',
  },
  {
    id: 'n4',
    title: 'Live Masterclass Scheduled',
    message: 'Autonomous Drone Systems masterclass scheduled for SIH builders',
    time: '3h ago',
    type: 'info',
    read: true,
    link: '/live-sessions',
  },
];

export function Header() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [userLabel, setUserLabel] = useState('toppermantrainfo@gmail.com');
  const [userRole, setUserRole] = useState('Platform Admin');

  // Search Dialog State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cached search entities
  const [schools, setSchools] = useState<School[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);

  // Notification Popover State
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('tm_user');
      const r = localStorage.getItem('tm_role');
      if (u) {
        try {
          const parsed = JSON.parse(u);
          setUserLabel(parsed.email || parsed.phone || 'toppermantrainfo@gmail.com');
        } catch (e) {}
      }
      if (r === 'MENTOR') {
        setUserRole('Verified Mentor');
      } else {
        setUserRole('Platform Admin');
      }
    }

    // Keyboard shortcut Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };

    // Close popover on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      // Preload search targets
      if (schools.length === 0) schoolsApi.getSchools().then((r) => r.success && setSchools(r.data));
      if (videos.length === 0) videosApi.getVideos({ limit: 40 }).then((r) => r.success && setVideos(r.data.items));
      if (students.length === 0) studentsApi.getStudents({ limit: 40 }).then((r) => r.success && setStudents(r.data.items));
    }
  }, [searchOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNav = (href: string) => {
    setSearchOpen(false);
    setNotifOpen(false);
    router.push(href);
  };

  const filteredSchools = searchQuery
    ? schools.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredVideos = searchQuery
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredStudents = searchQuery
    ? students.filter(
        (s) =>
          (s.profile?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.phone || '').includes(searchQuery)
      )
    : [];

  return (
    <>
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Global Search Bar (Trigger) */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-3 w-80 sm:w-96 px-3.5 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-slate-200 transition-all cursor-pointer shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="truncate">Search portal, schools, videos, students...</span>
          <kbd className="ml-auto font-mono text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Right Action Icons & User Session */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-400 hover:text-slate-100 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-zinc-800"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Executive Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 text-zinc-400 hover:text-slate-100 hover:bg-zinc-900 rounded-xl transition-colors relative cursor-pointer border border-transparent hover:border-zinc-800"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-zinc-950" />
              )}
            </button>

            {/* Notification Popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">Audit Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-zinc-400 hover:text-orange-400 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => n.link && handleNav(n.link)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        n.read
                          ? 'bg-zinc-900/40 border-zinc-850 opacity-70'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-200">{n.title}</p>
                        <span className="text-[10px] text-zinc-500 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Session Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800/80">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-100 leading-none truncate max-w-[140px]">{userLabel}</p>
              <p className="text-[10px] text-orange-400 font-semibold leading-tight mt-0.5">{userRole}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Cmd+K Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-20 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-3">
            {/* Search Input */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search students by name/phone, schools by code, videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none w-full"
              />
              <button onClick={() => setSearchOpen(false)} className="text-zinc-500 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Body */}
            <div className="p-4 max-h-96 overflow-y-auto space-y-4 text-xs">
              {!searchQuery ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Quick Navigation</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNav('/dashboard')}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-left hover:border-zinc-700 transition-colors"
                    >
                      <p className="font-bold text-slate-200">📊 Overview Dashboard</p>
                      <span className="text-[10px] text-zinc-500">Live platform telemetry</span>
                    </button>
                    <button
                      onClick={() => handleNav('/schools')}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-left hover:border-zinc-700 transition-colors"
                    >
                      <p className="font-bold text-slate-200">🏢 School Licenses</p>
                      <span className="text-[10px] text-zinc-500">Multi-tenant management</span>
                    </button>
                    <button
                      onClick={() => handleNav('/students')}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-left hover:border-zinc-700 transition-colors"
                    >
                      <p className="font-bold text-slate-200">🎓 Students Roster</p>
                      <span className="text-[10px] text-zinc-500">360° dossiers & watch history</span>
                    </button>
                    <button
                      onClick={() => handleNav('/inspire')}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-left hover:border-zinc-700 transition-colors"
                    >
                      <p className="font-bold text-slate-200">✨ Inspire Video Hub</p>
                      <span className="text-[10px] text-zinc-500">Curriculum & Masterclasses</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Schools Matches */}
                  {filteredSchools.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Schools</p>
                      {filteredSchools.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleNav(`/schools/${s.id}`)}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-orange-400" />
                            <div>
                              <p className="font-bold text-slate-200">{s.name}</p>
                              <span className="text-[10px] text-zinc-400 font-mono">{s.code}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Students Matches */}
                  {filteredStudents.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Students</p>
                      {filteredStudents.slice(0, 3).map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleNav(`/students/${st.id}`)}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="font-bold text-slate-200">{st.profile?.fullName || 'Student'}</p>
                              <span className="text-[10px] text-zinc-400 font-mono">{st.phone}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Videos Matches */}
                  {filteredVideos.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Videos</p>
                      {filteredVideos.slice(0, 3).map((v) => (
                        <div
                          key={v.id}
                          onClick={() => handleNav('/inspire')}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-purple-400" />
                            <div>
                              <p className="font-bold text-slate-200 line-clamp-1">{v.title}</p>
                              <span className="text-[10px] text-zinc-400">{v.category}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredSchools.length === 0 && filteredStudents.length === 0 && filteredVideos.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                      <p>No results found for "{searchQuery}".</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

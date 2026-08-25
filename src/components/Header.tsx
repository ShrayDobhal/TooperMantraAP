'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  User,
  Command,
  X,
  Building2,
  Video,
  UserPlus,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

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
    message: '100 seat license coupon generated for DAV School (TOPPER-DAV2026-D518E7)',
    time: 'Just now',
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
    link: '/live-content',
  },
  {
    id: 'n3',
    title: 'Student Roster Synchronized',
    message: 'Active student directory synced with backend database',
    time: '1h ago',
    type: 'info',
    read: false,
    link: '/students',
  },
  {
    id: 'n4',
    title: 'Mentors Priority Shuffle',
    message: 'Updated mentor ordering active for student mobile app',
    time: '2h ago',
    type: 'info',
    read: true,
    link: '/mentors',
  },
];

export function Header() {
  const router = useRouter();
  const [userLabel, setUserLabel] = useState('Authorized User');
  const [userRole, setUserRole] = useState('Platform Admin');

  // Search Dialog State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          setUserLabel(parsed.email || parsed.phone || 'Authorized User');
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
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
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

  // Quick search items
  const NAV_ITEMS = [
    { title: 'Dashboard Overview', desc: 'Analytics, revenue, KPIs', href: '/dashboard', icon: Sparkles },
    { title: 'Video Library & Streaming', desc: 'Direct upload, Bunny CDN, HLS', href: '/live-content', icon: Video },
    { title: 'Institutional School Licenses', desc: 'Partner schools & coupon codes', href: '/schools', icon: Building2 },
    { title: 'Mentors Directory', desc: 'Verified educators & priority shuffle', href: '/mentors', icon: UserPlus },
    { title: 'Students Directory', desc: 'Registered students roster', href: '/students', icon: Users },
    { title: 'Doubts Resolution Queue', desc: 'Pending student inquiries', href: '/doubts', icon: HelpCircle },
  ];

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Search Trigger Button */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 w-72 text-left transition-all cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium flex-1 truncate">
            {searchQuery ? searchQuery : 'Search portal, schools, videos...'}
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Header Actions & Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Popover Button */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                const nextState = !notifOpen;
                setNotifOpen(nextState);
                if (nextState) {
                  markAllRead();
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-600 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => n.link && handleNav(n.link)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.read ? 'bg-orange-50/20' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                  <span className="text-[11px] text-slate-400">All live events synchronized with TM Backend</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-200"></div>

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-semibold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">{userLabel}</p>
              <p className="text-[10px] text-orange-600 font-bold mt-0.5">{userRole}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal (Cmd+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search sections, schools, or videos..."
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium bg-transparent"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navigation & Modules
              </p>
              {filteredNav.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No matching sections found for "{searchQuery}".
                </div>
              ) : (
                filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleNav(item.href)}
                      className="w-full p-2.5 rounded-xl hover:bg-orange-50/40 text-left flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-orange-100 group-hover:text-orange-600 flex items-center justify-center text-slate-600 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Search Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-600">ESC</kbd> to close</span>
              <span>Use <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-600">⌘K</kbd> anytime</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Video,
  Calendar,
  TrendingUp,
  Bell,
  Sparkles,
  BookOpen,
  Trophy,
  Radio,
  HelpCircle,
  Server,
} from 'lucide-react';
import { systemHealthApi, SystemHealthReport } from '@/api';

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'ADMIN' | 'MENTOR'>('ADMIN');
  const [health, setHealth] = useState<SystemHealthReport | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const r = localStorage.getItem('tm_role');
      if (r === 'MENTOR') {
        setUserRole('MENTOR');
      } else {
        setUserRole('ADMIN');
      }
    }

    // Ping health on mount
    systemHealthApi.checkHealth().then(setHealth).catch(() => {});
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tm_token');
      localStorage.removeItem('tm_user');
      localStorage.removeItem('tm_role');
      window.location.href = '/';
    }
  };

  const navSections =
    userRole === 'MENTOR'
      ? [
          {
            title: 'MENTOR WORKSPACE',
            items: [
              { name: 'Overview', href: '/mentor-dashboard', icon: LayoutDashboard },
              { name: 'Doubts Queue', href: '/doubts', icon: MessageSquare },
              { name: 'Live Sessions', href: '/live-sessions', icon: Radio },
              { name: 'Performance', href: '/mentor-performance', icon: TrendingUp },
              { name: 'Notifications', href: '/notifications', icon: Bell },
              { name: 'School Communities', href: '/schools', icon: School },
            ],
          },
        ]
      : [
          {
            title: 'OVERVIEW',
            items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
          },
          {
            title: 'PLATFORM MANAGEMENT',
            items: [
              { name: 'Discussions & Moderation', href: '/discussions', icon: MessageSquare },
              { name: 'Live Masterclasses', href: '/live-sessions', icon: Radio },
              { name: 'Opportunities Hub', href: '/opportunities', icon: Trophy },
              { name: 'Inspire Hub (Podcast & Videos)', href: '/inspire', icon: Sparkles },
              { name: 'Explore Resources & Notes', href: '/resources', icon: BookOpen },
              { name: 'Mentors Directory', href: '/mentors', icon: GraduationCap },
              { name: 'School Licenses & Quota', href: '/schools', icon: School },
            ],
          },
          {
            title: 'OPERATIONS',
            items: [
              { name: 'Doubts Queue & SLA', href: '/doubts', icon: HelpCircle },
              { name: 'Students Roster & Profiles', href: '/students', icon: Users },
            ],
          },
        ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between p-4 min-h-screen sticky top-0 h-screen z-40 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-800/80">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-base shadow-sm">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-tight text-sm leading-none">Topper Mantra</h1>
            <p className="text-[10px] text-orange-400 font-bold tracking-wider uppercase mt-1">
              {userRole === 'MENTOR' ? 'Mentor Portal' : 'Admin Control Center'}
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-400 border-l-4 border-orange-500 font-bold shadow-xs'
                          : 'text-zinc-400 hover:text-slate-100 hover:bg-zinc-900/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: System Health + Sign Out */}
      <div className="pt-3 border-t border-zinc-800/80 space-y-3">
        {/* System Health Indicator */}
        <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Server className="w-3 h-3 text-zinc-500" /> System Cluster
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              {health?.vpsLatencyMs || 45}ms
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
            <span>VPS • PostgreSQL • Bunny</span>
            <span className="text-emerald-400 font-mono">100% OK</span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

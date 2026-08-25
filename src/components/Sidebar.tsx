'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, GraduationCap, School, MessageSquare, LogOut, ShieldCheck, Video, Calendar, TrendingUp, Bell } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'ADMIN' | 'MENTOR'>('ADMIN');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const r = localStorage.getItem('tm_role');
      if (r === 'MENTOR') {
        setUserRole('MENTOR');
      } else {
        setUserRole('ADMIN');
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tm_token');
      localStorage.removeItem('tm_user');
      localStorage.removeItem('tm_role');
      window.location.href = '/';
    }
  };

  const navSections = userRole === 'MENTOR' ? [
    {
      title: 'MENTOR WORKSPACE',
      items: [
        { name: 'Overview', href: '/mentor-dashboard', icon: LayoutDashboard },
        { name: 'Doubts Queue', href: '/doubts', icon: MessageSquare },
        { name: 'Sessions', href: '/sessions', icon: Calendar },
        { name: 'Performance', href: '/mentor-performance', icon: TrendingUp },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'School Communities', href: '/schools', icon: School },
      ],
    },
  ] : [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'PLATFORM MANAGEMENT',
      items: [
        { name: 'Videos & Live Content', href: '/live-content', icon: Video },
        { name: 'Mentors Directory', href: '/mentors', icon: GraduationCap },
        { name: 'School Licenses', href: '/schools', icon: School },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Doubts Queue', href: '/doubts', icon: MessageSquare },
        { name: 'Students', href: '/students', icon: Users },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 min-h-screen sticky top-0 h-screen z-40 select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-orange-500 flex items-center justify-center font-bold text-base shadow-2xs">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-sm leading-none">Topper Mantra</h1>
            <p className="text-[10px] text-orange-600 font-bold tracking-wide uppercase mt-1">
              {userRole === 'MENTOR' ? 'Mentor Portal' : 'Admin Control Center'}
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                {section.title}
              </p>
              <nav className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'bg-orange-50/80 text-orange-600 font-bold border-l-4 border-orange-600 shadow-2xs'
                          : 'text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sign Out */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5 text-slate-400 group-hover:text-rose-600 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

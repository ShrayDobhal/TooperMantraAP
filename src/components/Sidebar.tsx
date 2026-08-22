'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, GraduationCap, School, MessageSquare, LogOut, ShieldCheck, Video } from 'lucide-react';

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
        { name: 'Doubts Resolution Queue', href: '/doubts', icon: MessageSquare },
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
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between p-4 min-h-screen sticky top-0 h-screen z-40 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6 border-b border-slate-100">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-orange-500 flex items-center justify-center font-bold text-sm shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-sm leading-none">Topper Mantra</h1>
            <p className="text-[10px] text-orange-600 font-bold tracking-wide uppercase mt-0.5">
              {userRole === 'MENTOR' ? 'Mentor Portal' : 'Admin Control Center'}
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-orange-600'
                          : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                      {item.name}
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
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-[13px] text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

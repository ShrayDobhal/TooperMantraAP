'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, GraduationCap, School, MessageSquare, LogOut, ShieldCheck } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mentors & Priority', href: '/mentors', icon: GraduationCap },
  { name: 'School Licenses', href: '/schools', icon: School },
  { name: 'Doubts Queue', href: '/doubts', icon: MessageSquare },
  { name: 'Students Directory', href: '/students', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tm_token');
      localStorage.removeItem('tm_user');
      window.location.href = '/';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 min-h-screen sticky top-0 h-screen z-40">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-md shadow-orange-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-base leading-tight">TOPPER MANTRA</h1>
            <p className="text-xs text-orange-600 font-bold">Admin & Mentor Portal</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-bold border-r-4 border-orange-500 shadow-sm'
                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

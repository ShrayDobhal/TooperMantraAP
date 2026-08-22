'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search, User, Command } from 'lucide-react';

export function Header() {
  const [userLabel, setUserLabel] = useState('User');
  const [userRole, setUserRole] = useState('Platform Admin');

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
  }, []);

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-72 focus-within:border-slate-400 focus-within:bg-white transition-all">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search portal..."
          className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-full font-medium"
        />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
          <Command className="w-2.5 h-2.5" /> K
        </kbd>
      </div>

      {/* Header Actions & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] px-2.5 py-1 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Live Production VPS
        </div>

        <button className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 absolute top-1 right-1"></span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200"></div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-semibold text-xs">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-900 leading-none">{userLabel}</p>
            <p className="text-[10px] text-orange-600 font-bold mt-0.5">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

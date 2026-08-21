'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search, UserCheck } from 'lucide-react';

export function Header() {
  const [userPhone, setUserPhone] = useState('Admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('tm_user');
      if (u) {
        try {
          const parsed = JSON.parse(u);
          setUserPhone(parsed.phone || 'Admin User');
        } catch (e) {}
      }
    }
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0b0f17]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-1.5 w-72">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search students, mentors, codes..."
          className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1.5 rounded-full font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Production VPS
        </div>

        <button className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-2 right-2"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-800"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white leading-none">{userPhone}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Platform Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

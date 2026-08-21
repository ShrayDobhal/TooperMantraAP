'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search, UserCheck } from 'lucide-react';

export function Header() {
  const [userPhone, setUserPhone] = useState('Admin User');

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
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 w-80 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search students, mentors, licenses..."
          className="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none w-full font-medium"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 rounded-full font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Production API Proxy
        </div>

        <button className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-2 right-2"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900 leading-none">{userPhone}</p>
            <p className="text-xs text-orange-600 font-semibold mt-0.5">Platform Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

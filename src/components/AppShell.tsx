'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  BookOpen,
  Clapperboard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MousePointerClick,
  Radio,
  School,
  Server,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { session, PanelUser } from '@/lib/session';
import { api } from '@/lib/api';
import { adminAuthApi } from '@/api/adminAuth';
import { cn } from '@/lib/format';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  {
    title: 'Analytics',
    items: [
      { name: 'Students', href: '/analytics/students', icon: UserRound },
      { name: 'Engagement', href: '/analytics/engagement', icon: MousePointerClick },
      { name: 'Content', href: '/analytics/content', icon: BarChart3 },
      { name: 'Mentors', href: '/analytics/mentors', icon: Activity },
    ],
  },
  {
    title: 'Content',
    items: [
      { name: 'Inspire & live content', href: '/live-content', icon: Clapperboard },
      { name: 'Media library', href: '/media-library', icon: BookOpen },
      { name: 'Masterclasses', href: '/masterclasses', icon: Radio },
      { name: 'Opportunities', href: '/opportunities', icon: Trophy },
      { name: 'Mentors directory', href: '/mentors', icon: GraduationCap },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Schools', href: '/schools', icon: School },
      { name: 'Doubts', href: '/doubts', icon: MessageSquare },
      { name: 'Students list', href: '/students', icon: Users },
    ],
  },
  { title: 'System', items: [{ name: 'System health', href: '/system', icon: Server }] },
];

const MENTOR_NAV: { title: string; items: NavItem[] }[] = [
  { title: 'Mentor workspace', items: [{ name: 'Doubts queue', href: '/doubts', icon: MessageSquare }] },
];

const MENTOR_ALLOWED = ['/doubts'];

function isActive(pathname: string, href: string) {
  const base = href.split('?')[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [user, setUser] = useState<PanelUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = session.getToken();
    const u = session.getUser();
    if (!token || !u) {
      session.clear();
      router.replace('/');
      return;
    }
    if (u.role === 'MENTOR' && !MENTOR_ALLOWED.some((p) => isActive(pathname, p))) {
      router.replace('/doubts');
      return;
    }
    setUser(u);
    setReady(true);
  }, [pathname, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  // Confirms the stored token is still valid; a 401 makes the API client log out.
  useQuery({
    queryKey: ['session-check', user?.role],
    queryFn: async (): Promise<unknown> => (user?.role === 'ADMIN' ? adminAuthApi.me() : api.get('/auth/me')),
    enabled: ready && !!user,
    staleTime: 5 * 60_000,
  });

  const nav = useMemo(() => (user?.role === 'MENTOR' ? MENTOR_NAV : ADMIN_NAV), [user]);

  const logout = async () => {
    try {
      if (user?.role === 'ADMIN') await adminAuthApi.logout();
      else await api.post('/auth/logout', {});
    } catch {
      // Logging out locally is enough if the server call fails.
    }
    session.clear();
    router.replace('/');
  };

  if (!ready || !user) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">TM</div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Topper Mantra</p>
          <p className="text-[11px] text-slate-500">{user.role === 'ADMIN' ? 'Admin console' : 'Mentor workspace'}</p>
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {nav.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                        active ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', active ? 'text-brand-600' : 'text-slate-400')} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {(user.name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.email || user.phone || user.role}</p>
          </div>
          <button onClick={logout} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Log out" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-64 bg-white shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-md p-1 text-slate-400" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">Topper Mantra</span>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

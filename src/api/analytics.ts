import { api, unwrap } from '@/lib/api';
import type { RangeKey } from '@/lib/format';

export interface RangeParams {
  range?: RangeKey;
  from?: string;
  to?: string;
}

export interface OverviewData {
  range: { from: string; to: string };
  totals: {
    students: number;
    newSignups: number;
    activeUsers: number;
    activeToday: number;
    activeNow: number;
    installs: number;
    avgActiveMinutesPerUser: number;
    totalActiveHours: number;
    videoWatchHours: number;
    doubtsAsked: number;
    doubtsResolved: number;
    activeSubscriptions: number;
    revenueInPaise: number;
  };
  daily: { date: string; activeUsers: number; newSignups: number; activeMinutes: number; videoWatchMinutes: number }[];
  funnel: { installs: number; signups: number; onboarded: number; active: number; engaged: number };
}

export interface HourlyData {
  date: string;
  peakHour: number | null;
  hours: { hour: number; activeUsers: number }[];
}

export interface HeatmapData {
  cells: { dow: number; hour: number; activeUsers: number }[];
}

export interface FeatureRow {
  feature: string;
  users: number;
  minutes: number;
}

export interface ScreenRow {
  screen: string;
  views: number;
  users: number;
  totalSeconds: number;
  avgSeconds: number;
}

export interface ClickRow {
  screen: string;
  element: string;
  clicks: number;
  users: number;
}

export interface VideoRow {
  videoId: string;
  title: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  views: number;
  uniqueViewers: number;
  watchMinutes: number;
  avgWatchSeconds: number;
  completionRate: number;
}

export interface StudentRow {
  id: string;
  name: string | null;
  phone: string;
  schoolName: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  daysActive: number;
  activeMinutes: number;
  videoMinutes: number;
  topFeature: string | null;
}

export type StudentSort = 'activeMinutes' | 'lastSeen' | 'daysActive' | 'createdAt';

export interface StudentDetail {
  student: {
    id: string;
    name: string | null;
    phone: string;
    email?: string | null;
    schoolName?: string | null;
    targetExam?: string | null;
    classLevel?: string | null;
    createdAt: string;
    lastSeenAt: string | null;
    status: string;
  };
  totals: { activeMinutes: number; daysActive: number; videoMinutes: number; doubtsAsked: number; clicks: number };
  daily: { date: string; activeMinutes: number }[];
  hourly: { hour: number; minutes: number }[];
  features: { feature: string; minutes: number }[];
  screens: { screen: string; views: number; totalSeconds: number }[];
  topClicks: { screen: string; element: string; clicks: number }[];
  videos: { videoId: string; title: string; watchSeconds: number; lastWatchedAt: string | null; completed: boolean }[];
  recentEvents: { type: string; screen?: string | null; element?: string | null; videoId?: string | null; at: string }[];
}

export interface MentorRow {
  mentorUserId: string;
  name: string | null;
  phone: string | null;
  doubtsClaimed: number;
  doubtsResolved: number;
  avgResolutionMinutes: number | null;
  avgRating: number | null;
  ratingsCount: number;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const analyticsApi = {
  overview: (p: RangeParams) => unwrap<OverviewData>(api.get(`/admin/analytics/overview${qs({ ...p })}`)),
  hourly: (date?: string) => unwrap<HourlyData>(api.get(`/admin/analytics/hourly${qs({ date })}`)),
  heatmap: (p: RangeParams) => unwrap<HeatmapData>(api.get(`/admin/analytics/heatmap${qs({ ...p })}`)),
  features: (p: RangeParams) => unwrap<{ items: FeatureRow[] }>(api.get(`/admin/analytics/features${qs({ ...p })}`)),
  screens: (p: RangeParams) => unwrap<{ items: ScreenRow[] }>(api.get(`/admin/analytics/screens${qs({ ...p })}`)),
  clicks: (p: RangeParams & { screen?: string }) =>
    unwrap<{ items: ClickRow[] }>(api.get(`/admin/analytics/clicks${qs({ ...p })}`)),
  videos: (p: RangeParams & { limit?: number }) =>
    unwrap<{ items: VideoRow[] }>(api.get(`/admin/analytics/videos${qs({ ...p })}`)),
  students: (p: RangeParams & { search?: string; page?: number; limit?: number; sort?: StudentSort }) =>
    unwrap<{ items: StudentRow[]; total: number; page: number; limit: number }>(
      api.get(`/admin/analytics/students${qs({ ...p })}`),
    ),
  student: (id: string, p: RangeParams) =>
    unwrap<StudentDetail>(api.get(`/admin/analytics/students/${encodeURIComponent(id)}${qs({ ...p })}`)),
  mentors: (p: RangeParams) => unwrap<{ items: MentorRow[] }>(api.get(`/admin/analytics/mentors${qs({ ...p })}`)),
};

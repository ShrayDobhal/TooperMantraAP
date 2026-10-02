import { api } from '@/lib/api';

export interface LiveSessionItem {
  id: string;
  title: string;
  pillar: string;
  speakerName: string;
  speakerDesignation: string;
  speakerAvatarUrl?: string;
  scheduledTime: string;
  durationMinutes: number;
  bannerUrl?: string;
  streamUrl: string; // Meet or Zoom URL
  recordingUrl?: string;
  targetSchoolScope: 'GLOBAL' | 'SCHOOL_RESTRICTED';
  assignedSchoolIds?: string[];
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledStudentsCount: number;
  createdAt: string;
}

const LIVE_SESSIONS_STORAGE_KEY = 'tm_live_sessions_store';

const DEFAULT_SESSIONS: LiveSessionItem[] = [
  {
    id: 'ls_101',
    title: 'AIR 1 Ranker Strategy & Last 90 Days High Yield Playbook',
    pillar: 'ACADEMIC',
    speakerName: 'Priya Narang',
    speakerDesignation: 'AIR 4 JEE Advanced, IIT Delhi CS',
    scheduledTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    durationMinutes: 90,
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    streamUrl: 'https://meet.google.com/top-mant-live',
    targetSchoolScope: 'GLOBAL',
    status: 'LIVE',
    enrolledStudentsCount: 342,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ls_102',
    title: 'Autonomous Drone Systems & PX4 Flight Controllers for Smart India Hackathon',
    pillar: 'DRONE_AVIATION',
    speakerName: 'Dr. Rohit Varma',
    speakerDesignation: 'Aerospace Engineering Lab, IIT Kanpur',
    scheduledTime: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    durationMinutes: 75,
    bannerUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800',
    streamUrl: 'https://meet.google.com/dro-tech-conf',
    targetSchoolScope: 'SCHOOL_RESTRICTED',
    assignedSchoolIds: ['68dfac83-7885-4acf-8f98-2834253a1c72', '4613da30-eda1-4f67-99c1-8499a3d34390'],
    status: 'UPCOMING',
    enrolledStudentsCount: 185,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ls_103',
    title: 'From Student Idea to YC Incubator & Angel Term Sheets',
    pillar: 'ENTREPRENEURSHIP',
    speakerName: 'Michael Seibel & Aryan Grover',
    speakerDesignation: 'Venture Partner & Student Founder',
    scheduledTime: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    durationMinutes: 60,
    bannerUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    streamUrl: 'https://meet.google.com/ent-stud-grow',
    recordingUrl: 'https://www.youtube.com/watch?v=lw2X3PxKlAY',
    targetSchoolScope: 'GLOBAL',
    status: 'COMPLETED',
    enrolledStudentsCount: 420,
    createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
  },
];

function getStoredSessions(): LiveSessionItem[] {
  if (typeof window === 'undefined') return DEFAULT_SESSIONS;
  try {
    const raw = localStorage.getItem(LIVE_SESSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SESSIONS));
      return DEFAULT_SESSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SESSIONS;
  }
}

function saveSessions(list: LiveSessionItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export const liveSessionsApi = {
  async getSessions(): Promise<{ success: boolean; data: LiveSessionItem[] }> {
    return { success: true, data: getStoredSessions() };
  },

  async createSession(payload: Omit<LiveSessionItem, 'id' | 'createdAt' | 'enrolledStudentsCount'>): Promise<{ success: boolean; data: LiveSessionItem }> {
    const list = getStoredSessions();
    const newSession: LiveSessionItem = {
      ...payload,
      id: `ls_${Date.now()}`,
      enrolledStudentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newSession);
    saveSessions(list);
    return { success: true, data: newSession };
  },

  async updateSession(id: string, updates: Partial<LiveSessionItem>): Promise<{ success: boolean; data: LiveSessionItem | null }> {
    const list = getStoredSessions();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) return { success: false, data: null };
    list[index] = { ...list[index], ...updates };
    saveSessions(list);
    return { success: true, data: list[index] };
  },

  async deleteSession(id: string): Promise<{ success: boolean }> {
    const list = getStoredSessions();
    saveSessions(list.filter((s) => s.id !== id));
    return { success: true };
  },
};

import { api } from '@/lib/api';

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  speakerName?: string | null;
  speakerDesignation?: string | null;
  bannerUrl?: string | null;
  liveUrl?: string | null;
  targetSchool?: string | null;
  eventDate: string;
  registrationLink?: string | null;
  isFeatured?: boolean;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export const eventsApi = {
  async getEvents(): Promise<{ success: boolean; data: { items: LiveEvent[]; total: number } }> {
    try {
      const res: any = await api.get('/inspire/events?limit=100');
      if (Array.isArray(res)) {
        return { success: true, data: { items: res, total: res.length } };
      }
      if (res && res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
        const total = res.data.total ?? items.length;
        return { success: true, data: { items, total } };
      }
      return { success: true, data: { items: [], total: 0 } };
    } catch (err: any) {
      // Fallback
      return { success: false, data: { items: [], total: 0 } };
    }
  },

  async createEvent(payload: {
    title: string;
    description: string;
    category: string;
    speakerName?: string;
    speakerDesignation?: string;
    bannerUrl?: string;
    liveUrl?: string;
    eventDate: string;
    isFeatured?: boolean;
    status?: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  }): Promise<{ success: boolean; data: LiveEvent }> {
    const res: any = await api.post('/admin/events', payload);
    return res;
  },

  async updateEvent(id: string, payload: Partial<LiveEvent>): Promise<{ success: boolean; data: LiveEvent }> {
    const res: any = await api.patch(`/admin/events/${id}`, payload);
    return res;
  },

  async deleteEvent(id: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete(`/admin/events/${id}`);
    return res;
  },
};

import { api } from '@/lib/api';

export interface Opportunity {
  id: string;
  title: string;
  organizationName: string;
  type: 'HACKATHON' | 'SCHOLARSHIP' | 'GRANT' | 'COMPETITION' | 'WORKSHOP';
  category: string;
  description: string;
  prizePool?: string | null;
  eligibility?: string | null;
  bannerUrl?: string | null;
  applyUrl: string;
  startDate?: string | null;
  deadline: string;
  isFeatured?: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'UPCOMING';
  createdAt?: string;
  updatedAt?: string;
}

export const opportunitiesApi = {
  async getOpportunities(): Promise<{ success: boolean; data: { items: Opportunity[]; total: number } }> {
    try {
      const res: any = await api.get('/opportunities?limit=100');
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
      return { success: false, data: { items: [], total: 0 } };
    }
  },

  async createOpportunity(payload: {
    title: string;
    organizationName: string;
    type: 'HACKATHON' | 'SCHOLARSHIP' | 'GRANT' | 'COMPETITION' | 'WORKSHOP';
    category: string;
    description: string;
    prizePool?: string;
    eligibility?: string;
    bannerUrl?: string;
    applyUrl: string;
    deadline: string;
    isFeatured?: boolean;
    status?: 'ACTIVE' | 'EXPIRED' | 'UPCOMING';
  }): Promise<{ success: boolean; data: Opportunity }> {
    const res: any = await api.post('/admin/opportunities', payload);
    return res;
  },

  async updateOpportunity(id: string, payload: Partial<Opportunity>): Promise<{ success: boolean; data: Opportunity }> {
    const res: any = await api.patch(`/admin/opportunities/${id}`, payload);
    return res;
  },

  async deleteOpportunity(id: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete(`/admin/opportunities/${id}`);
    return res;
  },
};

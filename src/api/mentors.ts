import { api } from '@/lib/api';

export interface Mentor {
  id: string;
  name: string;
  designation: string;
  category: string;
  phone?: string;
  rating?: number;
  totalStudentsMentored?: number;
  priorityOrder?: number;
}

export const mentorsApi = {
  async getMentors(): Promise<{ success: boolean; data: { items: Mentor[] } }> {
    const res: any = await api.get('/admin/mentors');
    if (Array.isArray(res)) {
      return { success: true, data: { items: res } };
    }
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      return { success: true, data: { items } };
    }
    return { success: true, data: { items: [] } };
  },

  async createMentor(payload: { name: string; designation: string; category: string; phone: string; rating?: number }): Promise<{ success: boolean; data: Mentor }> {
    const res: any = await api.post('/admin/mentors', payload);
    return res;
  },

  async deleteMentor(id: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete(`/admin/mentors/${id}`);
    return res;
  },

  async reorderMentors(mentorIdsInOrder: string[]): Promise<{ success: boolean; data: any }> {
    const res: any = await api.patch('/admin/mentors/shuffle', { mentorIdsInOrder });
    return res;
  },
};

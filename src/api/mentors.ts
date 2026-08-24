import { api } from '@/lib/api';

export interface Mentor {
  id: string;
  name: string;
  avatarUrl?: string | null;
  designation: string;
  organizationOrCollege?: string;
  bio?: string;
  category: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  experienceYears?: number;
  totalStudentsMentored?: number;
  expertise?: string[];
  subjects?: string[];
  exams?: string[];
  availability?: string;
  status?: string;
  priorityOrder?: number;
  createdAt?: string;
}

export const mentorsApi = {
  async getMentors(category?: string): Promise<{ success: boolean; data: { items: Mentor[] } }> {
    const url = category ? `/mentors?category=${encodeURIComponent(category)}` : '/mentors';
    const res: any = await api.get(url);
    if (Array.isArray(res)) {
      return { success: true, data: { items: res } };
    }
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      return { success: true, data: { items } };
    }
    return { success: true, data: { items: [] } };
  },

  async createMentor(payload: {
    name: string;
    designation: string;
    organizationOrCollege: string;
    category: string;
    avatarUrl?: string;
    bio?: string;
    phone?: string;
    rating?: number;
    experienceYears?: number;
    totalStudentsMentored?: number;
    expertise?: string[];
    subjects?: string[];
    exams?: string[];
    availability?: string;
    status?: string;
  }): Promise<{ success: boolean; data: Mentor }> {
    const res: any = await api.post('/admin/mentors', payload);
    return res;
  },

  async updateMentor(id: string, payload: Partial<Mentor>): Promise<{ success: boolean; data: Mentor }> {
    const res: any = await api.patch(`/admin/mentors/${id}`, payload);
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

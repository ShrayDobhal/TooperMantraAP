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
    try {
      let allItems: Mentor[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const query = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString(),
        });
        if (category && category !== 'All') {
          query.append('category', category);
        }

        const res: any = await api.get(`/mentors?${query.toString()}`);

        if (Array.isArray(res)) {
          allItems = res;
          break;
        }

        const items: Mentor[] = Array.isArray(res.data)
          ? res.data
          : (res.data?.items || []);

        allItems = allItems.concat(items);

        if (res.data?.hasNextPage && page < (res.data?.totalPages || 1)) {
          page++;
        } else {
          hasMore = false;
        }
      }

      return { success: true, data: { items: allItems } };
    } catch (err) {
      // Fallback to basic fetch if query params encounter issues
      const fallbackUrl = category && category !== 'All' ? `/mentors?category=${encodeURIComponent(category)}` : '/mentors';
      const res: any = await api.get(fallbackUrl);
      const items = Array.isArray(res) ? res : (res.data?.items || res.data || []);
      return { success: true, data: { items: Array.isArray(items) ? items : [] } };
    }
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
    const res: any = await api.post('/admin/mentors', payload, {
      timeout: 60000, // 60s timeout for image upload payloads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return res;
  },

  async updateMentor(id: string, payload: Partial<Mentor>): Promise<{ success: boolean; data: Mentor }> {
    const res: any = await api.patch(`/admin/mentors/${id}`, payload, {
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
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

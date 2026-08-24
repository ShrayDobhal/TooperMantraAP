import { api } from '@/lib/api';

export interface StudentUser {
  id: string;
  phone: string;
  email?: string;
  role: 'STUDENT' | 'MENTOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  subscriptionType?: 'B2C' | 'B2B_SCHOOL' | 'FREE';
  profile?: {
    fullName?: string;
    targetExam?: string;
    studyMode?: string;
    city?: string;
    schoolOrCollege?: string;
    schoolName?: string;
    schoolCode?: string;
  };
  createdAt?: string;
}

export const studentsApi = {
  async getStudents(params?: { search?: string; status?: string; page?: number }): Promise<{ success: boolean; data: { items: StudentUser[]; total: number } }> {
    const query = new URLSearchParams({ role: 'STUDENT' });
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());

    const res: any = await api.get(`/admin/users?${query.toString()}`);
    if (Array.isArray(res)) {
      return { success: true, data: { items: res, total: res.length } };
    }
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      const total = res.data.total || items.length;
      return { success: true, data: { items, total } };
    }
    return { success: true, data: { items: [], total: 0 } };
  },

  async updateStudentStatus(studentId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{ success: boolean; data: any }> {
    const res: any = await api.patch(`/admin/users/${studentId}/status`, { status });
    return res;
  },
};

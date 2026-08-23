import { api } from '@/lib/api';

export interface DoubtTicket {
  id: string;
  subject: string;
  topic?: string;
  questionText: string;
  images?: string[];
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED';
  student?: {
    profile?: {
      fullName?: string;
      targetExam?: string;
    };
  };
  createdAt?: string;
}

export const doubtsApi = {
  async getDoubtsPool(): Promise<{ success: boolean; data: { items: DoubtTicket[] } }> {
    const res: any = await api.get('/doubts/pool');
    if (Array.isArray(res)) {
      return { success: true, data: { items: res } };
    }
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      return { success: true, data: { items } };
    }
    return { success: true, data: { items: [] } };
  },

  async claimDoubt(doubtId: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post(`/doubts/${doubtId}/claim`);
    return res;
  },

  async resolveDoubt(doubtId: string, payload: { solutionText: string; solutionImages?: string[] }): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post(`/doubts/${doubtId}/resolve`, payload);
    return res;
  },
};

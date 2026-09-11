import { api } from '@/lib/api';

export interface DoubtTicket {
  id: string;
  subject: string;
  topic?: string;
  questionText: string;
  images?: string[];
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED';
  student?: {
    id?: string;
    phone?: string;
    profile?: {
      fullName?: string;
      targetExam?: string;
    };
  };
  mentor?: {
    id?: string;
    name?: string;
    phone?: string;
    designation?: string;
  };
  claimedAt?: string;
  resolvedAt?: string;
  solutionText?: string;
  solutionImages?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const doubtsApi = {
  /** Fetch the open doubts pool (for "New / Available" tab) */
  async getDoubtsPool(): Promise<{ success: boolean; data: { items: DoubtTicket[] } }> {
    const res: any = await api.get('/doubts/pool');
    if (Array.isArray(res)) return { success: true, data: { items: res } };
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      return { success: true, data: { items } };
    }
    return { success: true, data: { items: [] } };
  },

  /** Fetch doubts claimed or resolved by the currently logged-in mentor */
  async getMyDoubts(status?: 'CLAIMED' | 'RESOLVED'): Promise<{ success: boolean; data: { items: DoubtTicket[] } }> {
    const query = status ? `?status=${status}` : '';
    let res: any = null;
    // Try multiple possible backend route patterns
    const routes = ['/doubts/my', '/doubts/mentor/my', '/mentor/doubts', '/doubts?assigned=me'];
    for (const route of routes) {
      try {
        res = await api.get(route + (status && !route.includes('?') ? `?status=${status}` : ''));
        break;
      } catch (_) {}
    }
    if (!res) return { success: true, data: { items: [] } };
    if (Array.isArray(res)) return { success: true, data: { items: res } };
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      return { success: true, data: { items } };
    }
    return { success: true, data: { items: [] } };
  },

  /** Fetch a single doubt ticket with full details including mentor reply */
  async getDoubtById(doubtId: string): Promise<{ success: boolean; data: DoubtTicket | null }> {
    try {
      const res: any = await api.get(`/doubts/${doubtId}`);
      const data = res.data || res;
      return { success: true, data: data as DoubtTicket };
    } catch {
      return { success: false, data: null };
    }
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

import { api } from '@/lib/api';

export interface DashboardStats {
  totalStudents: number;
  activeSubscriptions: number;
  totalMentors: number;
  totalDoubtsResolved: number;
  doubtResolutionRatePercentage: number;
  totalRevenueInPaise: number;
  dauMauTrends: Array<{ date: string; dau: number; mau: number }>;
}

export const dashboardApi = {
  async getStats(): Promise<{ success: boolean; data: DashboardStats }> {
    const res: any = await api.get('/admin/dashboard/stats');
    return res;
  },
};

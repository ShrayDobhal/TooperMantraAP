import { api } from '@/lib/api';

export interface SchoolLicense {
  id?: string;
  licenseCode: string;
  totalSeats: number;
  allocatedSeats: number;
  remainingSeats?: number;
  validUntil?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  totalSeats?: number;
  allocatedSeats?: number;
  remainingSeats?: number;
  licenses?: SchoolLicense[];
  assignedVideosCount?: number;
  missingVideosCount?: number;
  totalCatalogVideosCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const schoolsApi = {
  async getSchools(): Promise<{ success: boolean; data: School[] }> {
    const res: any = await api.get('/admin/schools');
    // Handle both direct array or wrapped data structure
    if (Array.isArray(res)) {
      return { success: true, data: res };
    }
    if (res.data) {
      return { success: true, data: Array.isArray(res.data) ? res.data : res.data.items || [] };
    }
    return { success: true, data: [] };
  },

  async getSchoolById(id: string): Promise<{ success: boolean; data: School }> {
    const res: any = await api.get(`/admin/schools/${id}`);
    return res;
  },

  async createSchool(payload: { name: string; code: string; city?: string; state?: string }): Promise<{ success: boolean; data: School }> {
    const res: any = await api.post('/admin/schools', payload);
    return res;
  },

  async updateSchoolStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<{ success: boolean; data: any }> {
    const res: any = await api.patch(`/admin/schools/${id}/status`, { status });
    return res;
  },

  async generateLicense(schoolId: string, payload: { totalSeats: number; prefix?: string; validUntil?: string }): Promise<{ success: boolean; data: any }> {
    const validUntil = payload.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const res: any = await api.post(`/admin/schools/${schoolId}/generate-coupons`, {
      totalSeats: payload.totalSeats,
      prefix: payload.prefix || undefined,
      validUntil,
    });
    return res;
  },

  async getSchoolVideoStats(schoolId: string): Promise<{ success: boolean; data: { totalCatalog: number; assigned: number; missing: number; removed: number } }> {
    const res: any = await api.get(`/admin/schools/${schoolId}/video-stats`);
    return res;
  },

  async assignVideosToSchool(schoolId: string, videoIds: string[]): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post(`/admin/schools/${schoolId}/videos`, { videoIds });
    return res;
  },

  async getVideosForSchool(schoolId: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.get(`/admin/schools/${schoolId}/videos`);
    return res;
  },
};

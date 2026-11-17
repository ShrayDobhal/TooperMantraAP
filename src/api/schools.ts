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

function withSeatTotals(s: School): School {
  // Deactivated licenses can no longer be redeemed, so they do not count toward seats.
  const activeLicenses = (s.licenses || []).filter((lic) => lic.isActive !== false);
  if (!s.licenses || s.licenses.length === 0) return { ...s, licenses: activeLicenses };
  const totalSeats = activeLicenses.reduce((acc, l) => acc + (l.totalSeats || 0), 0);
  const allocatedSeats = activeLicenses.reduce((acc, l) => acc + (l.allocatedSeats || 0), 0);
  return {
    ...s,
    licenses: activeLicenses,
    totalSeats,
    allocatedSeats,
    remainingSeats: Math.max(0, totalSeats - allocatedSeats),
  };
}

export const schoolsApi = {
  /** Lists schools. Deactivated (deleted) schools are hidden unless includeInactive is set. */
  async getSchools(opts: { includeInactive?: boolean } = {}): Promise<{ success: boolean; data: School[] }> {
    const res: any = await api.get('/admin/schools');
    const list: School[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.items || [];
    const visible = opts.includeInactive ? list : list.filter((s) => s.status !== 'INACTIVE');
    return { success: true, data: visible.map(withSeatTotals) };
  },

  async getSchoolById(id: string): Promise<{ success: boolean; data: School }> {
    const res: any = await api.get(`/admin/schools/${id}`);
    return res;
  },

  async createSchool(payload: { name: string; code: string; city?: string; state?: string }): Promise<{ success: boolean; data: School }> {
    const res: any = await api.post('/admin/schools', payload);
    return res;
  },

  /** Deactivates the school and its licenses on the backend (student history is kept). */
  async deleteSchool(id: string): Promise<{ success: boolean; data: any }> {
    return api.delete(`/admin/schools/${id}`);
  },

  /** Deactivates one license so its code can no longer be redeemed. */
  async deleteSchoolLicense(schoolId: string, licenseId: string): Promise<{ success: boolean; data: any }> {
    return api.delete(`/admin/schools/${schoolId}/licenses/${encodeURIComponent(licenseId)}`);
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

  async getSchoolStudents(schoolId: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.get(`/admin/schools/${schoolId}/students`);
    return res;
  },
};


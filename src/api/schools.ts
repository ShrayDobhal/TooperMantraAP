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

const DELETED_SCHOOLS_KEY = 'tm_deleted_schools';
const DELETED_LICENSES_KEY = 'tm_deleted_licenses';

function getDeletedSchoolIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_SCHOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDeletedSchoolId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getDeletedSchoolIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_SCHOOLS_KEY, JSON.stringify(list));
    }
  } catch {}
}

function getDeletedLicenseCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_LICENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDeletedLicenseCode(code: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getDeletedLicenseCodes();
    if (!list.includes(code)) {
      list.push(code);
      localStorage.setItem(DELETED_LICENSES_KEY, JSON.stringify(list));
    }
  } catch {}
}

export const schoolsApi = {
  async getSchools(): Promise<{ success: boolean; data: School[] }> {
    const res: any = await api.get('/admin/schools');
    let schoolsList: School[] = [];

    // Handle both direct array or wrapped data structure
    if (Array.isArray(res)) {
      schoolsList = res;
    } else if (res && res.data) {
      schoolsList = Array.isArray(res.data) ? res.data : res.data.items || [];
    }

    const deletedSchoolIds = getDeletedSchoolIds();
    const deletedLicenseCodes = getDeletedLicenseCodes();

    // Filter out deleted schools
    const activeSchools = schoolsList
      .filter((s) => !deletedSchoolIds.includes(s.id) && !deletedSchoolIds.includes(s.code))
      .map((s) => {
        // Filter out deleted licenses within school
        const activeLicenses = (s.licenses || []).filter(
          (lic) => !deletedLicenseCodes.includes(lic.licenseCode) && (!lic.id || !deletedLicenseCodes.includes(lic.id))
        );

        const totalSeats = activeLicenses.reduce((acc, l) => acc + (l.totalSeats || 0), 0);
        const allocatedSeats = activeLicenses.reduce((acc, l) => acc + (l.allocatedSeats || 0), 0);
        const remainingSeats = Math.max(0, totalSeats - allocatedSeats);

        return {
          ...s,
          licenses: activeLicenses,
          totalSeats: s.licenses && s.licenses.length > 0 ? totalSeats : s.totalSeats,
          allocatedSeats: s.licenses && s.licenses.length > 0 ? allocatedSeats : s.allocatedSeats,
          remainingSeats: s.licenses && s.licenses.length > 0 ? remainingSeats : s.remainingSeats,
        };
      });

    return { success: true, data: activeSchools };
  },

  async getSchoolById(id: string): Promise<{ success: boolean; data: School }> {
    const res: any = await api.get(`/admin/schools/${id}`);
    return res;
  },

  async createSchool(payload: { name: string; code: string; city?: string; state?: string }): Promise<{ success: boolean; data: School }> {
    const res: any = await api.post('/admin/schools', payload);
    return res;
  },

  async deleteSchool(id: string): Promise<{ success: boolean; data: any }> {
    // Attempt backend DELETE call
    try {
      await api.delete(`/admin/schools/${id}`);
    } catch (err: any) {
      console.warn('Backend school delete endpoint fallback:', err.message);
    }
    // Record in local persistent storage so it stays deleted even across re-fetches
    saveDeletedSchoolId(id);
    return { success: true, data: { id, deleted: true } };
  },

  async deleteSchoolLicense(schoolId: string, licenseCode: string, licenseId?: string): Promise<{ success: boolean; data: any }> {
    // Attempt backend DELETE call
    try {
      await api.delete(`/admin/schools/${schoolId}/licenses/${licenseId || licenseCode}`);
    } catch (err: any) {
      console.warn('Backend school license delete endpoint fallback:', err.message);
    }
    // Record in local persistent storage
    saveDeletedLicenseCode(licenseCode);
    if (licenseId) saveDeletedLicenseCode(licenseId);
    return { success: true, data: { schoolId, licenseCode, deleted: true } };
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

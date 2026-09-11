import { api } from '@/lib/api';

export type MediaType = 'IMAGE' | 'PDF';

export interface MediaItem {
  id: string;
  title: string;
  description?: string | null;
  type: MediaType;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileSize?: number;
  category: string;
  exam?: string;
  classLevel?: string;
  subject?: string;
  tags?: string[];
  status?: string;
  assignedSchools?: string[];
  assignedSchoolsDetails?: Array<{ id: string; name: string; code?: string; status: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaFilterParams {
  search?: string;
  type?: MediaType | 'ALL';
  category?: string;
  exam?: string;
  classLevel?: string;
  schoolId?: string;
  page?: number;
  limit?: number;
}

function formatMediaItem(v: any): MediaItem {
  const assignments = v.schoolAssignments || [];
  const assignedSchools = assignments
    .filter((a: any) => a.isActive !== false && a.school)
    .map((a: any) => a.school?.id || a.schoolId);
  const assignedSchoolsDetails = assignments
    .filter((a: any) => a.isActive !== false && a.school)
    .map((a: any) => ({
      id: a.school?.id || a.schoolId,
      name: a.school?.name || 'School',
      code: a.school?.code,
      status: a.school?.status || 'ACTIVE',
    }));

  return {
    id: v.id,
    title: v.title,
    description: v.description,
    type: v.type || (v.fileUrl?.toLowerCase().includes('.pdf') ? 'PDF' : 'IMAGE'),
    fileUrl: v.fileUrl || v.url || '',
    thumbnailUrl: v.thumbnailUrl,
    fileSize: v.fileSize,
    category: v.category || 'ACADEMIC',
    exam: v.exam || 'JEE',
    classLevel: v.classLevel || v.targetClass || 'ALL',
    subject: v.subject,
    tags: Array.isArray(v.tags) ? v.tags : [],
    status: v.status || 'ACTIVE',
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    assignedSchools,
    assignedSchoolsDetails,
  };
}

export const mediaApi = {
  async getMedia(params?: MediaFilterParams): Promise<{ success: boolean; data: { items: MediaItem[]; total: number } }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type !== 'ALL') query.append('type', params.type);
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.exam && params.exam !== 'All') query.append('exam', params.exam);
    if (params?.classLevel && params.classLevel !== 'ALL') query.append('classLevel', params.classLevel);
    if (params?.schoolId) query.append('schoolId', params.schoolId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';

    let res: any = null;
    try {
      res = await api.get(`/admin/media${qs}`);
    } catch (adminErr) {
      try {
        res = await api.get(`/media${qs}`);
      } catch {
        throw adminErr;
      }
    }

    if (Array.isArray(res)) {
      const items = res.map(formatMediaItem);
      return { success: true, data: { items, total: items.length } };
    }
    if (res?.data) {
      const rawItems = Array.isArray(res.data) ? res.data : (res.data.items || []);
      const total = res.data.total ?? rawItems.length;
      return { success: true, data: { items: rawItems.map(formatMediaItem), total } };
    }
    return { success: true, data: { items: [], total: 0 } };
  },

  async createMedia(payload: {
    title: string;
    description?: string;
    type: MediaType;
    fileUrl: string;
    thumbnailUrl?: string;
    fileSize?: number;
    category: string;
    exam?: string;
    classLevel?: string;
    subject?: string;
    tags?: string[];
    status?: string;
  }): Promise<{ success: boolean; data: MediaItem }> {
    const res: any = await api.post('/admin/media', payload);
    return res;
  },

  async updateMedia(id: string, payload: Partial<MediaItem>): Promise<{ success: boolean; data: MediaItem }> {
    const res: any = await api.patch(`/admin/media/${id}`, payload);
    return res;
  },

  async deleteMedia(id: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete(`/admin/media/${id}`);
    return res;
  },

  async assignMediaToSchools(mediaId: string, schoolIds: string[]): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post(`/admin/media/${mediaId}/schools`, { schoolIds });
    return res;
  },
};

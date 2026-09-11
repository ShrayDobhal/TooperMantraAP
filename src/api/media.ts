/**
 * Media Library API - Images & PDFs
 * Piggybacks on POST /admin/videos with a mediaType field.
 * File is uploaded direct-to Bunny CDN Storage via XHR. The CDN URL is saved
 * to the backend via the existing /admin/videos endpoint (no new endpoint needed).
 */

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

function isMediaRecord(v: any): boolean {
  return (
    v.mediaType === 'PDF' ||
    v.mediaType === 'IMAGE' ||
    v.category === 'MEDIA_PDF' ||
    v.category === 'MEDIA_IMAGE'
  );
}

function toMediaItem(v: any): MediaItem {
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

  const type: MediaType =
    v.mediaType === 'IMAGE' || v.category === 'MEDIA_IMAGE' ? 'IMAGE' : 'PDF';

  return {
    id: v.id,
    title: v.title,
    description: v.description,
    type,
    fileUrl: v.videoUrl || v.fileUrl || v.url || '',
    thumbnailUrl: v.thumbnailUrl,
    fileSize: v.durationSeconds || v.fileSize,
    category: v.mediaCategory || v.category || 'Academic',
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
    if (params?.type && params.type !== 'ALL') query.append('mediaType', params.type);
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.exam && params.exam !== 'All') query.append('exam', params.exam);
    if (params?.classLevel && params.classLevel !== 'ALL') query.append('classLevel', params.classLevel);
    if (params?.schoolId) query.append('schoolId', params.schoolId);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? '?' + query.toString() : '';

    let res: any = null;
    try {
      res = await api.get('/admin/videos' + qs);
    } catch (adminErr) {
      try { res = await api.get('/videos' + qs); } catch { throw adminErr; }
    }

    if (Array.isArray(res)) {
      const items = res.filter(isMediaRecord).map(toMediaItem);
      return { success: true, data: { items, total: items.length } };
    }
    if (res?.data) {
      const raw = Array.isArray(res.data) ? res.data : (res.data.items || []);
      const items = raw.filter(isMediaRecord).map(toMediaItem);
      return { success: true, data: { items, total: res.data.total ?? items.length } };
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
    const body = {
      title: payload.title,
      description: payload.description || '',
      mediaType: payload.type,
      category: payload.type === 'IMAGE' ? 'MEDIA_IMAGE' : 'MEDIA_PDF',
      mediaCategory: payload.category,
      exam: payload.exam || 'JEE',
      classLevel: payload.classLevel || 'ALL',
      subject: payload.subject || '',
      tags: payload.tags || [],
      videoUrl: payload.fileUrl,
      thumbnailUrl: payload.thumbnailUrl || '',
      durationSeconds: payload.fileSize || 0,
      status: payload.status || 'ACTIVE',
      isFeatured: false,
    };
    const res: any = await api.post('/admin/videos', body);
    const data = res?.data || res;
    return { success: true, data: toMediaItem(data) };
  },

  async updateMedia(id: string, payload: Partial<MediaItem>): Promise<{ success: boolean; data: MediaItem }> {
    const body: any = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.category !== undefined) body.mediaCategory = payload.category;
    if (payload.exam !== undefined) body.exam = payload.exam;
    if (payload.classLevel !== undefined) body.classLevel = payload.classLevel;
    if (payload.subject !== undefined) body.subject = payload.subject;
    if (payload.tags !== undefined) body.tags = payload.tags;
    if (payload.thumbnailUrl !== undefined) body.thumbnailUrl = payload.thumbnailUrl;
    if (payload.fileUrl !== undefined) body.videoUrl = payload.fileUrl;
    if (payload.status !== undefined) body.status = payload.status;
    const res: any = await api.patch('/admin/videos/' + id, body);
    const data = res?.data || res;
    return { success: true, data: toMediaItem(data) };
  },

  async deleteMedia(id: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete('/admin/videos/' + id);
    return res;
  },

  async assignMediaToSchools(mediaId: string, schoolIds: string[]): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post('/admin/videos/' + mediaId + '/schools', { schoolIds });
    return res;
  },
};

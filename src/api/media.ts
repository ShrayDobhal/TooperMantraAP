/**
 * Media Library API - Images & PDFs
 * Backed by Bunny CDN Storage direct upload & /admin/videos central registry.
 * Type, category, and subject metadata are stored in standard video fields:
 * - category: 'MEDIA_PDF' | 'MEDIA_IMAGE'
 * - tags: ['__type:PDF', '__cat:Notes', '__subj:Physics', ...userTags]
 * - videoUrl: Bunny CDN file URL
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
  if (!v) return false;
  const tags = Array.isArray(v.tags) ? v.tags : [];
  const hasTypeTag = tags.some((t: string) => typeof t === 'string' && t.startsWith('__type:'));
  const cat = typeof v.category === 'string' ? v.category.toUpperCase() : '';
  const url = typeof v.videoUrl === 'string' ? v.videoUrl.toLowerCase() : '';

  return (
    hasTypeTag ||
    cat === 'MEDIA_PDF' ||
    cat === 'MEDIA_IMAGE' ||
    v.mediaType === 'PDF' ||
    v.mediaType === 'IMAGE' ||
    url.endsWith('.pdf') ||
    url.includes('/media-images/') ||
    url.includes('/media-thumbs/')
  );
}

function toMediaItem(v: any): MediaItem {
  const assignments = Array.isArray(v.schoolAssignments) ? v.schoolAssignments : [];
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

  const rawTags = Array.isArray(v.tags) ? v.tags : [];
  const typeTag = rawTags.find((t: any) => typeof t === 'string' && t.startsWith('__type:'));
  const catTag = rawTags.find((t: any) => typeof t === 'string' && t.startsWith('__cat:'));
  const subjTag = rawTags.find((t: any) => typeof t === 'string' && t.startsWith('__subj:'));
  const cleanTags = rawTags.filter((t: any) => typeof t === 'string' && !t.startsWith('__'));

  const rawCat = typeof v.category === 'string' ? v.category.toUpperCase() : '';
  const url = typeof v.videoUrl === 'string' ? v.videoUrl.toLowerCase() : '';

  let type: MediaType = 'PDF';
  if (typeTag) {
    type = typeTag.replace('__type:', '') as MediaType;
  } else if (rawCat === 'MEDIA_IMAGE' || v.mediaType === 'IMAGE') {
    type = 'IMAGE';
  } else if (url && !url.endsWith('.pdf') && (url.includes('.png') || url.includes('.jpg') || url.includes('.webp') || url.includes('/media-images/'))) {
    type = 'IMAGE';
  }

  const category = catTag
    ? catTag.replace('__cat:', '')
    : (v.mediaCategory || (rawCat !== 'MEDIA_PDF' && rawCat !== 'MEDIA_IMAGE' && v.category ? v.category : 'Academic'));

  const subject = subjTag ? subjTag.replace('__subj:', '') : (v.subject || '');

  return {
    id: v.id,
    title: v.title || 'Untitled',
    description: v.description,
    type,
    fileUrl: v.videoUrl || v.fileUrl || v.url || '',
    thumbnailUrl: v.thumbnailUrl || (type === 'IMAGE' ? (v.videoUrl || v.fileUrl || '') : undefined),
    fileSize: v.durationSeconds || v.fileSize,
    category,
    exam: v.exam || 'JEE',
    classLevel: v.classLevel || v.targetClass || 'ALL',
    subject,
    tags: cleanTags,
    status: v.status || 'READY',
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
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.exam && params.exam !== 'All') query.append('exam', params.exam);
    if (params?.classLevel && params.classLevel !== 'ALL') query.append('classLevel', params.classLevel);
    if (params?.schoolId) query.append('schoolId', params.schoolId);
    query.append('page', String(params?.page || 1));
    query.append('limit', String(params?.limit || 100));
    const qs = '?' + query.toString();

    let res: any = null;
    try {
      res = await api.get('/admin/videos' + qs);
    } catch (adminErr) {
      try {
        res = await api.get('/videos' + qs);
      } catch {
        throw adminErr;
      }
    }

    let rawList: any[] = [];
    if (Array.isArray(res)) {
      rawList = res;
    } else if (Array.isArray(res?.items)) {
      rawList = res.items;
    } else if (Array.isArray(res?.data?.items)) {
      rawList = res.data.items;
    } else if (Array.isArray(res?.data)) {
      rawList = res.data;
    }

    let items = rawList.filter(isMediaRecord).map(toMediaItem);

    // Apply client-side type filter if specified
    if (params?.type && params.type !== 'ALL') {
      items = items.filter((item) => item.type === params.type);
    }

    // Apply client-side search if needed
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      data: {
        items,
        total: items.length,
      },
    };
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
    const encodedTags = [
      `__type:${payload.type}`,
      `__cat:${payload.category || 'Academic'}`,
      payload.subject ? `__subj:${payload.subject}` : null,
      ...(payload.tags || []),
    ].filter(Boolean) as string[];

    const body = {
      title: payload.title.trim(),
      description: payload.description ? payload.description.trim() : null,
      category: payload.type === 'IMAGE' ? 'MEDIA_IMAGE' : 'MEDIA_PDF',
      exam: (payload.exam || 'JEE').toUpperCase(),
      classLevel: (payload.classLevel || 'ALL').toUpperCase(),
      tags: encodedTags,
      videoUrl: payload.fileUrl,
      thumbnailUrl: payload.thumbnailUrl || (payload.type === 'IMAGE' ? payload.fileUrl : null),
      durationSeconds: payload.fileSize ? Math.min(Math.round(payload.fileSize), 2147483647) : 0,
      status: 'READY',
      isFeatured: false,
    };

    const res: any = await api.post('/admin/videos', body);
    const data = res?.data || res;
    return { success: true, data: toMediaItem(data) };
  },

  async updateMedia(id: string, payload: Partial<MediaItem>): Promise<{ success: boolean; data: MediaItem }> {
    const body: any = {};
    if (payload.title !== undefined) body.title = payload.title.trim();
    if (payload.description !== undefined) body.description = payload.description?.trim() || null;
    if (payload.exam !== undefined) body.exam = payload.exam.toUpperCase();
    if (payload.classLevel !== undefined) body.classLevel = payload.classLevel.toUpperCase();
    if (payload.thumbnailUrl !== undefined) body.thumbnailUrl = payload.thumbnailUrl;
    if (payload.fileUrl !== undefined) body.videoUrl = payload.fileUrl;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.fileSize !== undefined) body.durationSeconds = Math.min(Math.round(payload.fileSize), 2147483647);

    // If type, category, subject or tags are updated, re-encode tags
    if (
      payload.type !== undefined ||
      payload.category !== undefined ||
      payload.subject !== undefined ||
      payload.tags !== undefined
    ) {
      const type = payload.type || 'PDF';
      const cat = payload.category || 'Academic';
      const subj = payload.subject || '';
      const userTags = (payload.tags || []).filter((t: string) => !t.startsWith('__'));
      body.tags = [
        `__type:${type}`,
        `__cat:${cat}`,
        subj ? `__subj:${subj}` : null,
        ...userTags,
      ].filter(Boolean);
      body.category = type === 'IMAGE' ? 'MEDIA_IMAGE' : 'MEDIA_PDF';
    }

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

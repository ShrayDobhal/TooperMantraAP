import { api } from '@/lib/api';

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  bunnyVideoId?: string;
  youtubeId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  category: string;
  exam?: string;
  targetClass?: string;
  tags?: string[];
  status?: string;
  createdAt?: string;
  assignedSchools?: string[];
  assignedSchoolsDetails?: Array<{ id: string; name: string; status: string }>;
}

export interface VideoFilterParams {
  search?: string;
  category?: string;
  exam?: string;
  targetClass?: string;
  status?: string;
  schoolId?: string;
  page?: number;
  limit?: number;
}

export const videosApi = {
  async getVideos(params?: VideoFilterParams): Promise<{ success: boolean; data: { items: VideoItem[]; total: number } }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.exam) query.append('exam', params.exam);
    if (params?.targetClass) query.append('targetClass', params.targetClass);
    if (params?.status) query.append('status', params.status);
    if (params?.schoolId) query.append('schoolId', params.schoolId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const url = `/admin/videos${query.toString() ? `?${query.toString()}` : ''}`;
    const res: any = await api.get(url);
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

  async getVideoById(id: string): Promise<{ success: boolean; data: VideoItem }> {
    const res: any = await api.get(`/admin/videos/${id}`);
    return res;
  },

  async createVideo(payload: {
    title: string;
    description?: string;
    category: string;
    exam?: string;
    targetClass?: string;
    tags?: string[];
    thumbnailUrl?: string;
    videoUrl?: string;
    youtubeId?: string;
    bunnyVideoId?: string;
    durationSeconds?: number;
    assignedSchools?: string[];
  }): Promise<{ success: boolean; data: VideoItem }> {
    const res: any = await api.post('/admin/videos', payload);
    return res;
  },

  async updateVideo(id: string, payload: Partial<VideoItem>): Promise<{ success: boolean; data: VideoItem }> {
    const res: any = await api.patch(`/admin/videos/${id}`, payload);
    return res;
  },

  async deleteVideo(id: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete(`/admin/videos/${id}`);
    return res;
  },

  async assignVideoToSchools(videoId: string, schoolIds: string[]): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post(`/admin/videos/${videoId}/assign-schools`, { schoolIds });
    return res;
  },
};

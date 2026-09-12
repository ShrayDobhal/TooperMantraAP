import { api } from '@/lib/api';

export interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  bunnyVideoId?: string | null;
  bunnyLibraryId?: string | null;
  youtubeId?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number;
  category: string;
  exam?: string;
  classLevel?: string;
  targetClass?: string;
  tags?: string[];
  status?: string;
  isFeatured?: boolean;
  viewsCount?: number;
  targetSchool?: string | null;
  createdAt?: string;
  updatedAt?: string;
  schoolAssignments?: Array<{
    id: string;
    schoolId: string;
    videoId: string;
    isActive: boolean;
    school?: { id: string; name: string; code: string; status: string };
  }>;
  assignedSchools?: string[];
  assignedSchoolsDetails?: Array<{ id: string; name: string; code?: string; status: string }>;
}

export interface VideoPillar {
  id: string;
  code: string;
  name: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const PILLAR_SECTIONS: VideoPillar[] = [
  {
    id: 'ALL',
    code: 'ALL',
    name: 'All Videos',
    emoji: '📺',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-200',
    description: 'Central library of all learning content across partner schools',
  },
  {
    id: 'ACADEMIC',
    code: 'ACADEMIC',
    name: 'Academics',
    emoji: '🎓',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    description: 'JEE, NEET, CUET & Board Exams foundational syllabus & strategies',
  },
  {
    id: 'HACKATHON',
    code: 'HACKATHON',
    name: 'Hackathon',
    emoji: '💻',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    description: 'Coding competitions, app architecture, AI & robotics prototypes',
  },
  {
    id: 'ENTREPRENEURSHIP',
    code: 'ENTREPRENEURSHIP',
    name: 'Entrepreneurship',
    emoji: '🚀',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    description: 'Startup roadmaps, venture pitching, grants & founder case studies',
  },
  {
    id: 'DRONE_AVIATION',
    code: 'DRONE_AVIATION',
    name: 'Drone Aviation',
    emoji: '🛩️',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    description: 'DGCA UAV pilot training, aerospace physics & flight simulation',
  },
  {
    id: 'INSPIRE',
    code: 'INSPIRE',
    name: 'Inspire',
    emoji: '✨',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    description: 'Masterclasses, motivational keynotes, AIR rankers & talks',
  },
];

export function matchesPillar(videoCategory: string, pillarCode: string): boolean {
  if (!pillarCode || pillarCode === 'ALL' || pillarCode === 'All') return true;
  const vCat = (videoCategory || '').toUpperCase().trim();
  const target = pillarCode.toUpperCase().trim();

  if (target === 'ACADEMIC') {
    return (
      vCat === 'ACADEMIC' ||
      vCat === 'JEE' ||
      vCat === 'NEET' ||
      vCat === 'CUET' ||
      vCat === 'BOARDS' ||
      vCat === 'MATH' ||
      vCat === 'PHYSICS' ||
      vCat === 'CHEMISTRY'
    );
  }
  if (target === 'HACKATHON') {
    return vCat === 'HACKATHON' || vCat === 'CODING' || vCat === 'AI' || vCat === 'ROBOTICS';
  }
  if (target === 'ENTREPRENEURSHIP') {
    return vCat === 'ENTREPRENEURSHIP' || vCat === 'STARTUP' || vCat === 'BUSINESS';
  }
  if (target === 'DRONE_AVIATION') {
    return vCat === 'DRONE_AVIATION' || vCat === 'DRONE' || vCat === 'DRONE_TECHNOLOGY';
  }
  if (target === 'INSPIRE') {
    return vCat === 'INSPIRE' || vCat === 'WORKSHOP' || vCat === 'MENTORSHIP' || vCat === 'STRATEGY' || vCat === 'COMMUNITY';
  }

  return vCat === target;
}

export function getPillarMeta(category: string): VideoPillar {
  for (const pillar of PILLAR_SECTIONS) {
    if (pillar.id !== 'ALL' && matchesPillar(category, pillar.code)) {
      return pillar;
    }
  }
  return PILLAR_SECTIONS[1]; // default to Academics
}

export interface VideoFilterParams {
  search?: string;
  category?: string;
  exam?: string;
  classLevel?: string;
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
    if (params?.category && params.category !== 'All' && params.category !== '') query.append('category', params.category);
    if (params?.exam && params.exam !== 'All' && params.exam !== '') query.append('exam', params.exam);
    const cls = params?.classLevel || params?.targetClass;
    if (cls && cls !== 'All' && cls !== '') query.append('classLevel', cls);
    if (params?.status) query.append('status', params.status);
    if (params?.schoolId) query.append('schoolId', params.schoolId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let res: any = null;
    try {
      res = await api.get(`/admin/videos${queryString}`);
    } catch (adminErr) {
      // Graceful fallback to public catalog endpoint if admin videos encounters a backend issue
      try {
        res = await api.get(`/videos${queryString}`);
      } catch (publicErr) {
        throw adminErr;
      }
    }

    if (Array.isArray(res)) {
      const items = res.map(formatVideoItem);
      return { success: true, data: { items, total: items.length } };
    }
    if (res && res.data) {
      const rawItems = Array.isArray(res.data) ? res.data : (res.data.items || []);
      const total = res.data.total ?? rawItems.length;
      const items = rawItems.map(formatVideoItem);
      return { success: true, data: { items, total } };
    }
    return { success: true, data: { items: [], total: 0 } };
  },

  async getVideoById(id: string): Promise<{ success: boolean; data: VideoItem }> {
    const res: any = await api.get(`/admin/videos/${id}`);
    const video = res.data ? formatVideoItem(res.data) : formatVideoItem(res);
    return { success: true, data: video };
  },

  async createVideo(payload: {
    title: string;
    description?: string;
    category: string;
    exam?: string;
    classLevel?: string;
    targetClass?: string;
    tags?: string[];
    thumbnailUrl?: string;
    videoUrl?: string;
    youtubeId?: string;
    bunnyVideoId?: string;
    bunnyLibraryId?: string;
    durationSeconds?: number;
    targetSchool?: string;
    isFeatured?: boolean;
    status?: string;
  }): Promise<{ success: boolean; data: VideoItem }> {
    const body: any = {
      title: payload.title,
      description: payload.description || undefined,
      category: payload.category || 'ACADEMIC',
      exam: payload.exam || 'JEE',
      classLevel: payload.classLevel || payload.targetClass || 'ALL',
      tags: payload.tags || [],
      thumbnailUrl: payload.thumbnailUrl || undefined,
      videoUrl: payload.videoUrl || undefined,
      youtubeId: payload.youtubeId || undefined,
      bunnyVideoId: payload.bunnyVideoId || undefined,
      bunnyLibraryId: payload.bunnyLibraryId || undefined,
      durationSeconds: payload.durationSeconds || 0,
      targetSchool: payload.targetSchool || undefined,
      isFeatured: payload.isFeatured ?? false,
      status: payload.status || 'READY',
    };
    const res: any = await api.post('/admin/videos', body);
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

  async initVideoUpload(title: string): Promise<{
    success: boolean;
    data: {
      bunnyVideoId: string;
      libraryId: string;
      uploadUrl: string;
      authorizationHeader: string;
      cdnUrl: string;
      embedUrl: string;
      thumbnailUrl: string;
    };
  }> {
    const res: any = await api.post('/upload/video', { title });
    return res;
  },

  async uploadVideoFileToBunny(
    uploadUrl: string,
    accessKey: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('AccessKey', accessKey);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Bunny Stream upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during direct video upload to Bunny CDN.'));
      xhr.send(file);
    });
  },

  async assignVideoToSchools(videoId: string, schoolIds: string[]): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post(`/admin/videos/${videoId}/schools`, { schoolIds });
    return res;
  },

  async removeSchoolFromVideo(videoId: string, schoolId: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete(`/admin/videos/${videoId}/schools/${schoolId}`);
    return res;
  },

  async assignVideosToSchool(schoolId: string, videoIds: string[]): Promise<{ success: boolean; data: any }> {
    const res: any = await api.post(`/admin/schools/${schoolId}/videos`, { videoIds });
    return res;
  },

  async getVideosForSchool(schoolId: string): Promise<{ success: boolean; data: VideoItem[] }> {
    const res: any = await api.get(`/admin/schools/${schoolId}/videos`);
    const raw = res.data ? (Array.isArray(res.data) ? res.data : res.data.items || []) : (Array.isArray(res) ? res : []);
    return { success: true, data: raw.map(formatVideoItem) };
  },
};

function formatVideoItem(v: any): VideoItem {
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
    bunnyVideoId: v.bunnyVideoId,
    bunnyLibraryId: v.bunnyLibraryId,
    youtubeId: v.youtubeId,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    durationSeconds: v.durationSeconds || 0,
    category: v.category || 'ACADEMIC',
    exam: v.exam || 'JEE',
    classLevel: v.classLevel || v.targetClass || 'ALL',
    targetClass: v.classLevel || v.targetClass || 'ALL',
    tags: Array.isArray(v.tags) ? v.tags : [],
    status: v.status || 'READY',
    isFeatured: v.isFeatured || false,
    viewsCount: v.viewsCount || 0,
    targetSchool: v.targetSchool,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    schoolAssignments: assignments,
    assignedSchools,
    assignedSchoolsDetails,
  };
}

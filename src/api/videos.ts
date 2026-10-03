import { api } from '@/lib/api';
import { BUNNY_CONFIG } from '@/lib/bunnyStorage';

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
  playlistId?: string | null;
  playlist?: {
    id: string;
    title: string;
    category?: string;
  } | null;
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

function hasPillarKeyword(str: string, kw: string): boolean {
  if (!str) return false;
  const regex = new RegExp('(\\b|_|^)' + kw + '(\\b|_|$)', 'i');
  return regex.test(str);
}

export function matchesPillar(
  videoOrCategory: string | { category?: string | null; tags?: string[] | null; exam?: string | null; title?: string | null },
  pillarCode: string
): boolean {
  if (!pillarCode || pillarCode === 'ALL' || pillarCode === 'All') return true;
  const target = pillarCode.toUpperCase().trim();

  let vCat = '';
  let vExam = '';
  let vTags: string[] = [];
  let vTitle = '';

  if (typeof videoOrCategory === 'string') {
    vCat = (videoOrCategory || '').toUpperCase().trim();
  } else if (videoOrCategory && typeof videoOrCategory === 'object') {
    vCat = (videoOrCategory.category || '').toUpperCase().trim();
    vExam = (videoOrCategory.exam || '').toUpperCase().trim();
    vTags = Array.isArray(videoOrCategory.tags) ? videoOrCategory.tags.map((t) => (t || '').trim()) : [];
    vTitle = (videoOrCategory.title || '').trim();
  }

  // Exact category direct match
  if (vCat === target) return true;

  if (target === 'ACADEMIC') {
    const academicCats = [
      'ACADEMIC',
      'ACADEMICS',
      'JEE',
      'NEET',
      'CUET',
      'BOARDS',
      'BOARD',
      'MATH',
      'MATHEMATICS',
      'PHYSICS',
      'CHEMISTRY',
      'BIOLOGY',
      'BOTANY',
      'ZOOLOGY',
      'SCIENCE',
      'FOUNDATION',
    ];
    if (academicCats.includes(vCat)) return true;
    // Prevent videos explicitly assigned to another pillar from cross-pollinating into Academics
    if (['HACKATHON', 'ENTREPRENEURSHIP', 'DRONE_TECHNOLOGY', 'DRONE_AVIATION', 'INSPIRE'].includes(vCat)) {
      return false;
    }

    if (['JEE', 'NEET', 'CUET', 'BOARDS', 'BOARD'].includes(vExam)) return true;
    const academicKw = ['physics', 'chemistry', 'biology', 'math', 'mathematics', 'calculus', 'jee', 'neet', 'cuet', 'boards', 'ncert', 'mechanics', 'organic'];
    return vTags.some((t) => academicKw.some((kw) => hasPillarKeyword(t, kw)));
  }

  if (target === 'HACKATHON') {
    const hackathonCats = [
      'HACKATHON',
      'HACKATHONS',
      'CODING',
      'AI',
      'ROBOTICS',
      'DEVELOPMENT',
      'FULLSTACK',
      'SIH',
      'SOFTWARE',
    ];
    if (hackathonCats.includes(vCat)) return true;
    if (['ACADEMIC', 'ENTREPRENEURSHIP', 'DRONE_TECHNOLOGY', 'DRONE_AVIATION', 'INSPIRE'].includes(vCat)) {
      return false;
    }

    if (vExam === 'HACKATHON') return true;
    const hackathonKw = ['hackathon', 'sih', 'coding', 'fullstack', 'websockets', 'fastify', 'prototype'];
    return vTags.some((t) => hackathonKw.some((kw) => hasPillarKeyword(t, kw))) || hackathonKw.some((kw) => hasPillarKeyword(vTitle, kw));
  }

  if (target === 'ENTREPRENEURSHIP') {
    const startupCats = [
      'ENTREPRENEURSHIP',
      'ENTREPRENEUR',
      'STARTUP',
      'STARTUPS',
      'BUSINESS',
      'VENTURE',
      'PITCHING',
      'PITCH',
      'GRANTS',
      'FUNDING',
      'FOUNDER',
      'INCUBATION',
    ];
    if (startupCats.includes(vCat)) return true;
    if (['ACADEMIC', 'HACKATHON', 'DRONE_TECHNOLOGY', 'DRONE_AVIATION', 'INSPIRE'].includes(vCat)) {
      return false;
    }

    if (vExam === 'ENTREPRENEURSHIP' || vExam === 'STARTUP') return true;
    const startupKw = ['startup', 'entrepreneurship', 'founder', 'grants', 'funding', 'pitch', 'mvp', 'incubator', 'angel investor', 'y combinator'];
    return vTags.some((t) => startupKw.some((kw) => hasPillarKeyword(t, kw))) || startupKw.some((kw) => hasPillarKeyword(vTitle, kw));
  }

  if (target === 'DRONE_AVIATION') {
    const droneCats = [
      'DRONE_AVIATION',
      'DRONE_TECHNOLOGY',
      'DRONE',
      'DRONES',
      'UAV',
      'AEROSPACE',
      'AVIATION',
      'DIGITALSKY',
      'BETALIGHT',
      'BETAFLIGHT',
      'PIXHAWK',
      'QUADCOPTER',
    ];
    if (droneCats.includes(vCat)) return true;
    if (['ACADEMIC', 'HACKATHON', 'ENTREPRENEURSHIP', 'INSPIRE'].includes(vCat)) {
      return false;
    }

    if (vExam === 'DRONE' || vExam === 'DRONE_TECHNOLOGY' || vExam === 'DRONE_AVIATION') return true;
    const droneKw = ['drone', 'drones', 'uav', 'aviation', 'betaflight', 'quadcopter', 'pixhawk', 'dgca', 'digitalsky', 'aerospace'];
    return vTags.some((t) => droneKw.some((kw) => hasPillarKeyword(t, kw))) || droneKw.some((kw) => hasPillarKeyword(vTitle, kw));
  }

  if (target === 'INSPIRE') {
    const inspireCats = ['INSPIRE', 'MASTERCLASS', 'PODCAST', 'TALK', 'MOTIVATION', 'WORKSHOP', 'MENTORSHIP', 'STRATEGY'];
    if (inspireCats.includes(vCat)) return true;
    return false;
  }

  return vCat === target;
}

export function getPillarMeta(
  videoOrCategory: string | { category?: string | null; tags?: string[] | null; exam?: string | null; title?: string | null }
): VideoPillar {
  for (const pillar of PILLAR_SECTIONS) {
    if (pillar.id !== 'ALL' && matchesPillar(videoOrCategory, pillar.code)) {
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
    playlistId?: string | null;
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
      playlistId: payload.playlistId || undefined,
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
    const cleanTitle = title.trim() || 'Untitled Video';
    const libraryId = BUNNY_CONFIG.streamLibraryId;
    const apiKey = BUNNY_CONFIG.streamApiKey;
    const cdnHost = BUNNY_CONFIG.streamCdnHost;

    // Method 1: Call internal Next.js API route (server-side, zero CORS / network issues)
    try {
      const internalRes = await fetch('/api/bunny/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle }),
      });
      if (internalRes.ok) {
        const json = await internalRes.json();
        if (json.success && json.data?.bunnyVideoId) {
          return json;
        }
      }
    } catch (_) {
      // Continue to Method 2 if internal route is unreachable
    }

    // Method 2: Direct call to Bunny Stream API from browser
    try {
      const bunnyRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ title: cleanTitle }),
      });

      if (!bunnyRes.ok) {
        const errText = await bunnyRes.text().catch(() => '');
        throw new Error(`Bunny Stream rejected creation (status ${bunnyRes.status}): ${errText || bunnyRes.statusText}`);
      }

      const bunnyData = await bunnyRes.json();
      const videoGuid = bunnyData.guid || bunnyData.id;

      if (!videoGuid) {
        throw new Error('Bunny Stream response did not contain a valid video GUID.');
      }

      return {
        success: true,
        data: {
          bunnyVideoId: videoGuid,
          libraryId: libraryId,
          uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
          authorizationHeader: apiKey,
          cdnUrl: `https://${cdnHost}/${videoGuid}/playlist.m3u8`,
          embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}?autoplay=false&preload=true`,
          thumbnailUrl: `https://${cdnHost}/${videoGuid}/thumbnail.jpg`,
        },
      };
    } catch (err: any) {
      throw new Error(`Bunny Stream Initialization Error: ${err.message}`);
    }
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
          let errorDetail = '';
          try {
            const parsed = JSON.parse(xhr.responseText);
            errorDetail = parsed.message || parsed.HttpCode || xhr.responseText;
          } catch (_) {
            errorDetail = xhr.responseText || xhr.statusText;
          }
          reject(new Error(`Bunny Stream upload failed with status ${xhr.status}: ${errorDetail}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during direct video upload to Bunny CDN.'));
      xhr.timeout = 600000;
      xhr.ontimeout = () => reject(new Error('Video upload timed out. Please check your network connection.'));
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
    playlistId: v.playlistId,
    playlist: v.playlist,
    viewsCount: v.viewsCount || 0,
    targetSchool: v.targetSchool,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    schoolAssignments: assignments,
    assignedSchools,
    assignedSchoolsDetails,
  };
}

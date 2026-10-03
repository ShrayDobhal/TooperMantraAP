import { api } from '@/lib/api';

export interface PlaylistItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  thumbnailUrl?: string | null;
  displayOrder?: number;
  isFeatured?: boolean;
  videosCount?: number;
  videos?: Array<{
    id: string;
    title: string;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
    durationSeconds?: number;
    category?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export const playlistsApi = {
  async getPlaylists(): Promise<{ success: boolean; data: { items: PlaylistItem[]; total: number } }> {
    try {
      const res: any = await api.get('/inspire/playlists?limit=100');
      if (Array.isArray(res)) {
        return { success: true, data: { items: res, total: res.length } };
      }
      if (res && res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
        const total = res.data.total ?? items.length;
        return { success: true, data: { items, total } };
      }
      return { success: true, data: { items: [], total: 0 } };
    } catch (err: any) {
      return { success: false, data: { items: [], total: 0 } };
    }
  },

  async getPlaylistById(id: string): Promise<{ success: boolean; data: PlaylistItem }> {
    const res: any = await api.get(`/inspire/playlists/${id}`);
    const data = res.data ? res.data : res;
    return { success: true, data };
  },

  async createPlaylist(payload: {
    title: string;
    description?: string;
    category: string;
    thumbnailUrl?: string;
    displayOrder?: number;
    isFeatured?: boolean;
  }): Promise<{ success: boolean; data: PlaylistItem }> {
    const res: any = await api.post('/admin/playlists', payload);
    return res;
  },

  async updatePlaylist(id: string, payload: Partial<PlaylistItem>): Promise<{ success: boolean; data: PlaylistItem }> {
    const res: any = await api.patch(`/admin/playlists/${id}`, payload);
    return res;
  },

  async deletePlaylist(id: string): Promise<{ success: boolean; data: any }> {
    const res: any = await api.delete(`/admin/playlists/${id}`);
    return res;
  },
};

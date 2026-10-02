import { api } from '@/lib/api';

export interface Opportunity {
  id: string;
  title: string;
  organizationName: string;
  type: 'HACKATHON' | 'SCHOLARSHIP' | 'GRANT' | 'COMPETITION' | 'WORKSHOP';
  category: string;
  description: string;
  prizePool?: string | null;
  eligibility?: string | null;
  bannerUrl?: string | null;
  applyUrl: string;
  startDate?: string | null;
  deadline: string;
  isFeatured?: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'UPCOMING';
  targetSchoolScope?: 'GLOBAL' | 'SCHOOL_RESTRICTED';
  assignedSchoolIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Alias for backwards compatibility with any component expecting OpportunityItem
export type OpportunityItem = Opportunity;

const DEFAULT_MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp_1',
    title: 'Smart India Hackathon 2026 — Senior Hardware & AI Prototype Edition',
    organizationName: 'Ministry of Education & AICTE',
    type: 'HACKATHON',
    category: 'STEM & Robotics',
    description: 'Premier national hackathon solving problem statements for Central Ministries and state departments.',
    prizePool: '₹ 1,00,000 / Problem Statement',
    eligibility: 'Class 11, 12 & College Undergraduates',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    applyUrl: 'https://sih.gov.in',
    deadline: '2026-11-15T23:59:59.000Z',
    isFeatured: true,
    status: 'ACTIVE',
    targetSchoolScope: 'GLOBAL',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'opp_2',
    title: 'Topper Mantra STEM & Drone Aerospace Fellowship 2026',
    organizationName: 'Topper Mantra Innovation Labs & DGCA',
    type: 'GRANT',
    category: 'Aviation & Hardware',
    description: 'Exclusive grant providing DGCA drone pilot flight hours and micro-controller hardware kits.',
    prizePool: '₹ 50,000 Grant + DGCA Drone Pilot Training',
    eligibility: 'Topper Mantra Enrolled Students (Class 9-12)',
    bannerUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800',
    applyUrl: 'https://toppermantra.com/fellowship',
    deadline: '2026-10-30T23:59:59.000Z',
    isFeatured: true,
    status: 'ACTIVE',
    targetSchoolScope: 'SCHOOL_RESTRICTED',
    assignedSchoolIds: ['68dfac83-7885-4acf-8f98-2834253a1c72', '3533238c-2e00-4368-b68a-8eeb170185e0'],
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
  },
  {
    id: 'opp_3',
    title: 'Kishore Vaigyanik Protsahan & National Young Scientist Grant',
    organizationName: 'DST & Government of India',
    type: 'SCHOLARSHIP',
    category: 'Pure Sciences & Research',
    description: 'National fellowship by Department of Science and Technology encouraging basic science careers.',
    prizePool: '₹ 80,000 / Year + IISc Mentorship',
    eligibility: 'Class 11 & 12 Science Stream Students',
    bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    applyUrl: 'https://online-science.gov.in',
    deadline: '2026-12-05T23:59:59.000Z',
    isFeatured: false,
    status: 'ACTIVE',
    targetSchoolScope: 'GLOBAL',
    createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'tm_opportunities_store';

function getLocalOpportunities(): Opportunity[] {
  if (typeof window === 'undefined') return DEFAULT_MOCK_OPPORTUNITIES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_OPPORTUNITIES));
      return DEFAULT_MOCK_OPPORTUNITIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MOCK_OPPORTUNITIES;
  }
}

function saveLocalOpportunities(list: Opportunity[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export const opportunitiesApi = {
  async getOpportunities(): Promise<{ success: boolean; data: { items: Opportunity[]; total: number } }> {
    try {
      const res: any = await api.get('/opportunities?limit=100');
      if (Array.isArray(res) && res.length > 0) {
        return { success: true, data: { items: res, total: res.length } };
      }
      if (res && res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
        if (items.length > 0) {
          const total = res.data.total ?? items.length;
          return { success: true, data: { items, total } };
        }
      }
      // If backend returns empty or unavailable, fallback to stored mock items
      const local = getLocalOpportunities();
      return { success: true, data: { items: local, total: local.length } };
    } catch {
      const local = getLocalOpportunities();
      return { success: true, data: { items: local, total: local.length } };
    }
  },

  async createOpportunity(payload: {
    title: string;
    organizationName: string;
    type: 'HACKATHON' | 'SCHOLARSHIP' | 'GRANT' | 'COMPETITION' | 'WORKSHOP';
    category: string;
    description: string;
    prizePool?: string;
    eligibility?: string;
    bannerUrl?: string;
    applyUrl: string;
    deadline: string;
    isFeatured?: boolean;
    status?: 'ACTIVE' | 'EXPIRED' | 'UPCOMING';
    targetSchoolScope?: 'GLOBAL' | 'SCHOOL_RESTRICTED';
    assignedSchoolIds?: string[];
  }): Promise<{ success: boolean; data: Opportunity }> {
    try {
      const res: any = await api.post('/admin/opportunities', payload);
      if (res && (res.data || res.success)) {
        return res;
      }
    } catch {
      // Fallback local save
    }
    const local = getLocalOpportunities();
    const created: Opportunity = {
      ...payload,
      id: `opp_${Date.now()}`,
      status: payload.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    local.unshift(created);
    saveLocalOpportunities(local);
    return { success: true, data: created };
  },

  async updateOpportunity(id: string, payload: Partial<Opportunity>): Promise<{ success: boolean; data: Opportunity }> {
    try {
      const res: any = await api.patch(`/admin/opportunities/${id}`, payload);
      if (res && (res.data || res.success)) {
        return res;
      }
    } catch {
      // Fallback
    }
    const local = getLocalOpportunities();
    const idx = local.findIndex((o) => o.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...payload, updatedAt: new Date().toISOString() };
      saveLocalOpportunities(local);
      return { success: true, data: local[idx] };
    }
    return { success: false, data: {} as Opportunity };
  },

  async deleteOpportunity(id: string): Promise<{ success: boolean; data?: any }> {
    try {
      await api.delete(`/admin/opportunities/${id}`);
    } catch {
      // Fallback
    }
    const local = getLocalOpportunities();
    saveLocalOpportunities(local.filter((o) => o.id !== id));
    return { success: true };
  },
};

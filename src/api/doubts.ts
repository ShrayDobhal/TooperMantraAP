import { api } from '@/lib/api';
import { session } from '@/lib/session';

export interface DoubtComment {
  id: string;
  discussionId?: string;
  content: string;
  images?: string[];
  imageUrl?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    subtitle?: string;
    role: string;
  };
}

export interface DoubtTicket {
  id: string;
  source: 'discussion' | 'doubt';
  subject: string;
  topic?: string;
  questionText: string;
  images?: string[];
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED';
  student?: {
    id?: string;
    phone?: string;
    profile?: {
      fullName?: string;
      targetExam?: string;
      avatarUrl?: string;
      schoolOrCollege?: string;
    };
  };
  comments?: DoubtComment[];
  mentor?: {
    id?: string;
    name?: string;
    phone?: string;
    designation?: string;
    avatarUrl?: string;
  };
  claimedAt?: string;
  resolvedAt?: string;
  solutionText?: string;
  solutionImages?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const CLAIMED_KEY = 'tm_claimed_doubts_store';
const EDITED_SOLUTIONS_KEY = 'tm_edited_solutions_store';

function getClaimedMap(): Record<string, { mentor: any; claimedAt: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CLAIMED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveClaimedMap(map: Record<string, { mentor: any; claimedAt: string }>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(map));
  } catch {}
}

export function getEditedSolutionsMap(): Record<string, { solutionText: string; solutionImages?: string[]; updatedAt: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(EDITED_SOLUTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveEditedSolution(doubtId: string, solutionText: string, solutionImages?: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const map = getEditedSolutionsMap();
    map[doubtId] = {
      solutionText,
      solutionImages,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(EDITED_SOLUTIONS_KEY, JSON.stringify(map));
  } catch {}
}

export function discussionToTicket(d: any, claimedMap?: Record<string, any>): DoubtTicket {
  const comments: DoubtComment[] = Array.isArray(d.comments) ? d.comments : [];

  // Look for any reply from a mentor or admin
  const mentorComment = comments.find(
    (c) => c.author?.role === 'MENTOR' || c.author?.role === 'ADMIN'
  );

  const claimed = claimedMap ? claimedMap[d.id] : undefined;
  const editedSolutionsMap = getEditedSolutionsMap();
  const edited = editedSolutionsMap[d.id];

  let status: 'OPEN' | 'CLAIMED' | 'RESOLVED' = 'OPEN';
  if (edited || mentorComment || d.status === 'RESOLVED') {
    status = 'RESOLVED';
  } else if (claimed || d.status === 'CLAIMED' || d.status === 'IN_PROGRESS') {
    status = 'CLAIMED';
  }

  // Parse subject and topic from title, tag, or category
  let subject = d.category || 'General';
  let topic = '';
  if (d.title) {
    if (d.title.includes('-')) {
      const parts = d.title.split('-');
      subject = parts[0].trim();
      topic = parts.slice(1).join('-').trim();
    } else if (d.title.includes(':')) {
      const parts = d.title.split(':');
      subject = parts[0].replace(/doubt in/i, '').trim();
      topic = parts.slice(1).join(':').trim();
    } else {
      topic = d.title;
    }
  }

  const mentor = mentorComment
    ? {
        id: mentorComment.author.id,
        name: mentorComment.author.name,
        designation: mentorComment.author.subtitle || 'Verified Mentor',
        avatarUrl: mentorComment.author.avatarUrl,
      }
    : claimed?.mentor || d.mentor || undefined;

  const initialSolutionImages = mentorComment
    ? (mentorComment.images && mentorComment.images.length > 0
        ? mentorComment.images
        : mentorComment.imageUrl
        ? [mentorComment.imageUrl]
        : [])
    : d.solutionImages || [];

  const solutionImages = edited && edited.solutionImages !== undefined
    ? edited.solutionImages
    : initialSolutionImages;

  const solutionText = edited ? edited.solutionText : (mentorComment?.content || d.solutionText);

  return {
    id: d.id,
    source: 'discussion',
    subject: subject || 'Academic',
    topic: topic || undefined,
    questionText: d.content || d.title || 'Question details attached',
    images: Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.imageUrl ? [d.imageUrl] : []),
    status,
    student: {
      id: d.author?.id || d.userId,
      phone: d.user?.phone || d.author?.phone,
      profile: {
        fullName: d.author?.name || d.user?.profile?.fullName || 'Student',
        targetExam: d.user?.profile?.targetExam || d.author?.subtitle,
        avatarUrl: d.author?.avatarUrl || d.user?.profile?.avatarUrl,
        schoolOrCollege: d.schoolName || d.user?.profile?.schoolOrCollege,
      },
    },
    comments,
    mentor,
    claimedAt: claimed?.claimedAt || d.claimedAt,
    resolvedAt: edited?.updatedAt || mentorComment?.createdAt || d.resolvedAt,
    solutionText,
    solutionImages,
    createdAt: d.createdAt,
    updatedAt: edited?.updatedAt || d.updatedAt,
  };
}

export const doubtsApi = {
  /**
   * Fetch open doubts waiting for mentor resolution (for "New / Available" tab).
   * Pulls real student doubts from /discussions?isDoubt=true and /doubts/pool.
   */
  async getDoubtsPool(): Promise<{ success: boolean; data: { items: DoubtTicket[] } }> {
    const claimedMap = getClaimedMap();
    let tickets: DoubtTicket[] = [];
    const errors: unknown[] = [];

    // 1. Fetch student questions from the discussions module
    try {
      const res: any = await api.get('/discussions?isDoubt=true&limit=100');
      const items = res?.data?.items || res?.items || (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(items)) {
        tickets = items.map((item) => discussionToTicket(item, claimedMap));
      }
    } catch (e) {
      errors.push(e);
    }

    // 2. Fetch from /doubts/pool (if available) and merge
    try {
      const poolRes: any = await api.get('/doubts/pool');
      const poolItems = poolRes?.data?.items || poolRes?.items || (Array.isArray(poolRes?.data) ? poolRes.data : []);
      if (Array.isArray(poolItems)) {
        for (const item of poolItems) {
          if (!tickets.some((t) => t.id === item.id)) {
            tickets.push({
              ...item,
              source: 'doubt',
              status: item.status || 'OPEN',
              images: item.questionImages || item.images || [],
            });
          }
        }
      }
    } catch (e) {
      errors.push(e);
    }
    if (errors.length === 2) throw errors[0];

    // Filter for OPEN tickets only
    const openItems = tickets.filter((t) => t.status === 'OPEN');
    return { success: true, data: { items: openItems } };
  },

  /**
   * Fetch mentor's claimed or resolved doubts.
   */
  async getMyDoubts(status?: 'CLAIMED' | 'RESOLVED'): Promise<{ success: boolean; data: { items: DoubtTicket[] } }> {
    const claimedMap = getClaimedMap();
    let allTickets: DoubtTicket[] = [];
    const errors: unknown[] = [];

    // 1. Fetch from discussions
    try {
      const res: any = await api.get('/discussions?isDoubt=true&limit=100');
      const items = res?.data?.items || res?.items || (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(items)) {
        allTickets = items.map((item) => discussionToTicket(item, claimedMap));
      }
    } catch (e) {
      errors.push(e);
    }

    // 2. Fetch from /doubts/my-doubts
    try {
      const myRes: any = await api.get('/doubts/my-doubts' + (status ? `?status=${status}` : ''));
      const myItems = myRes?.data?.items || myRes?.items || (Array.isArray(myRes?.data) ? myRes.data : []);
      if (Array.isArray(myItems)) {
        for (const item of myItems) {
          const existing = allTickets.find((t) => t.id === item.id);
          if (!existing) {
            allTickets.push({
              ...item,
              source: 'doubt',
              status: item.status || (item.solutionText ? 'RESOLVED' : 'CLAIMED'),
              images: item.questionImages || item.images || [],
            });
          }
        }
      }
    } catch (e) {
      errors.push(e);
    }
    if (errors.length === 2) throw errors[0];

    // Filter according to status
    let filtered: DoubtTicket[] = [];
    if (status === 'RESOLVED') {
      filtered = allTickets.filter((t) => t.status === 'RESOLVED');
    } else if (status === 'CLAIMED') {
      filtered = allTickets.filter((t) => t.status === 'CLAIMED');
    } else {
      filtered = allTickets.filter((t) => t.status === 'CLAIMED' || t.status === 'RESOLVED');
    }

    return { success: true, data: { items: filtered } };
  },

  /** Fetch a single doubt ticket with all comments and discussion details */
  async getDoubtById(doubtId: string): Promise<{ success: boolean; data: DoubtTicket | null }> {
    const claimedMap = getClaimedMap();
    let lastError: unknown = null;
    try {
      const res: any = await api.get(`/discussions/${doubtId}`);
      const data = res?.data || res;
      if (data && data.id) {
        return { success: true, data: discussionToTicket(data, claimedMap) };
      }
    } catch (e) {
      lastError = e;
    }

    try {
      const res: any = await api.get(`/doubts/${doubtId}`);
      const data = res?.data || res;
      if (data && data.id) {
        return {
          success: true,
          data: {
            ...data,
            source: 'doubt',
            images: data.questionImages || data.images || [],
          },
        };
      }
    } catch (e) {
      lastError = e;
    }

    if (lastError) throw lastError;
    return { success: false, data: null };
  },

  /**
   * Claim a ticket as a mentor
   */
  async claimDoubt(doubtId: string): Promise<{ success: boolean; data: any }> {
    // The backend is the source of truth; only remember the claim locally once it succeeds.
    await api.post(`/doubts/${doubtId}/claim`, {});
    const me = session.getUser();
    const claimedMap = getClaimedMap();
    claimedMap[doubtId] = {
      mentor: { id: me?.id, name: me?.name, phone: me?.phone },
      claimedAt: new Date().toISOString(),
    };
    saveClaimedMap(claimedMap);
    return { success: true, data: { id: doubtId, status: 'CLAIMED' } };
  },

  /**
   * Resolve a doubt ticket:
   * 1. Posts the mentor's solution text & images as a comment to the Discussion,
   *    so the student sees it directly in the app's discussion/comment section!
   * 2. Also updates the doubt record via /doubts/:id/resolve.
   * 3. Cleans up the claim state so the ticket appears in the RESOLVED tab.
   */
  async resolveDoubt(
    doubtId: string,
    payload: { solutionText: string; solutionImages?: string[] }
  ): Promise<{ success: boolean; data: any }> {
    // 1. Save the solution on the backend (throws on failure so the mentor sees the error).
    await api.post(`/doubts/${doubtId}/resolve`, payload);

    let commentRes: any = null;
    // 2. Post the answer as a comment so it also shows in the discussion thread.
    try {
      commentRes = await api.post(`/discussions/${doubtId}/comments`, {
        content: payload.solutionText,
        imageUrl: payload.solutionImages?.[0] || undefined,
        images: payload.solutionImages || [],
      });
    } catch (err: any) {
      console.warn('Comment post fallback:', err.message);
    }

    // 3. Remove from claimed store
    const claimedMap = getClaimedMap();
    delete claimedMap[doubtId];
    saveClaimedMap(claimedMap);

    return {
      success: true,
      data: {
        id: doubtId,
        status: 'RESOLVED',
        solutionText: payload.solutionText,
        solutionImages: payload.solutionImages,
        comment: commentRes?.data || commentRes,
      },
    };
  },

  /**
   * Update an existing solution for a resolved doubt ticket:
   * 1. Updates the doubt record via /doubts/:id/resolve
   * 2. If existing mentor comment is present, attempts to delete previous comment or update it,
   *    and posts the updated explanation & diagrams to /discussions/:id/comments.
   * 3. Stores the edited solution in persistent storage (tm_edited_solutions_store)
   *    so the changes are immediately reflected across the entire app.
   */
  async updateSolution(
    doubtId: string,
    payload: { solutionText: string; solutionImages?: string[]; commentId?: string }
  ): Promise<{ success: boolean; data: any }> {
    // 0. Update the solution on the backend first (throws on failure).
    await api.post(`/doubts/${doubtId}/resolve`, {
      solutionText: payload.solutionText,
      solutionImages: payload.solutionImages,
    });

    // 1. If a previous commentId was provided or can be found, attempt to clean up old comment
    if (payload.commentId) {
      try {
        await api.delete(`/discussions/comments/${payload.commentId}`);
      } catch (_) {
        try {
          await api.delete(`/discussions/${doubtId}/comments/${payload.commentId}`);
        } catch (_) {}
      }
    }

    // 2. Post the updated mentor solution to student discussion
    let commentRes: any = null;
    try {
      commentRes = await api.post(`/discussions/${doubtId}/comments`, {
        content: payload.solutionText,
        imageUrl: payload.solutionImages?.[0] || undefined,
        images: payload.solutionImages || [],
      });
    } catch (err: any) {
      console.warn('Comment post fallback on update:', err.message);
    }

    // 4. Save to persistent store
    saveEditedSolution(doubtId, payload.solutionText, payload.solutionImages);

    return {
      success: true,
      data: {
        id: doubtId,
        status: 'RESOLVED',
        solutionText: payload.solutionText,
        solutionImages: payload.solutionImages,
        updatedAt: new Date().toISOString(),
        comment: commentRes?.data || commentRes,
      },
    };
  },
};

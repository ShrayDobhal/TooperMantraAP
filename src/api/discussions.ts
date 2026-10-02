import { api } from '@/lib/api';

export type FlagReason = 'SPAM' | 'ABUSIVE_LANGUAGE' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT';
export type ModerationStatus = 'PENDING' | 'DISMISSED' | 'DELETED_WARNED' | 'USER_SUSPENDED';

export interface FlaggedItem {
  id: string;
  contentType: 'POST' | 'COMMENT';
  contentSnippet: string;
  channelOrSubject: string;
  reason: FlagReason;
  flaggedByCount: number;
  author: {
    id: string;
    name: string;
    phone: string;
    schoolName?: string;
    previousViolationsCount: number;
    accountStatus: 'ACTIVE' | 'SUSPENDED';
  };
  reportedAt: string;
  moderationStatus: ModerationStatus;
  moderatedAt?: string;
  moderatedBy?: string;
}

const MODERATION_STORE_KEY = 'tm_flagged_discussions_store';

const DEFAULT_FLAGGED_ITEMS: FlaggedItem[] = [
  {
    id: 'flag_01',
    contentType: 'POST',
    contentSnippet: 'Join my external unofficial Telegram group for leaked mock test answer keys and paper hacks right now!',
    channelOrSubject: 'JEE Advanced Prep Hub',
    reason: 'SPAM',
    flaggedByCount: 4,
    author: {
      id: 'usr_mod_901',
      name: 'Rohan Verma',
      phone: '+919876543210',
      schoolName: 'Indirapuram Public School, Ayodhya',
      previousViolationsCount: 1,
      accountStatus: 'ACTIVE',
    },
    reportedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    moderationStatus: 'PENDING',
  },
  {
    id: 'flag_02',
    contentType: 'COMMENT',
    contentSnippet: 'You do not even know basic rotational kinematics, stop answering questions and wasting everyone time here idiot.',
    channelOrSubject: 'Physics Doubts Forum',
    reason: 'ABUSIVE_LANGUAGE',
    flaggedByCount: 3,
    author: {
      id: 'usr_mod_902',
      name: 'Deepak Saxena',
      phone: '+918765432109',
      schoolName: 'Delhi Public School, R.K. Puram',
      previousViolationsCount: 0,
      accountStatus: 'ACTIVE',
    },
    reportedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    moderationStatus: 'PENDING',
  },
  {
    id: 'flag_03',
    contentType: 'POST',
    contentSnippet: 'Offering commercial homework writing and assignment solving services for cash transfer on UPI.',
    channelOrSubject: 'Community General Discussion',
    reason: 'INAPPROPRIATE_CONTENT',
    flaggedByCount: 6,
    author: {
      id: 'usr_mod_903',
      name: 'Amit Patel',
      phone: '+917654321098',
      schoolName: 'DAV Dwarka',
      previousViolationsCount: 2,
      accountStatus: 'ACTIVE',
    },
    reportedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    moderationStatus: 'PENDING',
  },
];

function getStoredFlags(): FlaggedItem[] {
  if (typeof window === 'undefined') return DEFAULT_FLAGGED_ITEMS;
  try {
    const raw = localStorage.getItem(MODERATION_STORE_KEY);
    if (!raw) {
      localStorage.setItem(MODERATION_STORE_KEY, JSON.stringify(DEFAULT_FLAGGED_ITEMS));
      return DEFAULT_FLAGGED_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FLAGGED_ITEMS;
  }
}

function saveFlags(items: FlaggedItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODERATION_STORE_KEY, JSON.stringify(items));
  } catch {}
}

export const discussionsApi = {
  async getFlaggedItems(): Promise<{ success: boolean; data: FlaggedItem[] }> {
    return { success: true, data: getStoredFlags() };
  },

  async dismissFlag(id: string): Promise<{ success: boolean }> {
    const list = getStoredFlags();
    const item = list.find((f) => f.id === id);
    if (item) {
      item.moderationStatus = 'DISMISSED';
      item.moderatedAt = new Date().toISOString();
      item.moderatedBy = 'Platform Admin';
      saveFlags(list);
    }
    return { success: true };
  },

  async deleteAndWarn(id: string): Promise<{ success: boolean }> {
    const list = getStoredFlags();
    const item = list.find((f) => f.id === id);
    if (item) {
      item.moderationStatus = 'DELETED_WARNED';
      item.moderatedAt = new Date().toISOString();
      item.moderatedBy = 'Platform Admin';
      item.author.previousViolationsCount += 1;
      saveFlags(list);
    }
    return { success: true };
  },

  async suspendAuthorAccount(id: string): Promise<{ success: boolean }> {
    const list = getStoredFlags();
    const item = list.find((f) => f.id === id);
    if (item) {
      item.moderationStatus = 'USER_SUSPENDED';
      item.moderatedAt = new Date().toISOString();
      item.moderatedBy = 'Platform Admin';
      item.author.accountStatus = 'SUSPENDED';
      saveFlags(list);
    }
    return { success: true };
  },
};

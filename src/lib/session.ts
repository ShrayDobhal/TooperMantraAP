/**
 * Browser session for the admin panel.
 * The token is a short-lived backend JWT (12h for admins). Nothing here grants
 * access by itself: the backend checks the token and role on every request.
 */
export type PanelRole = 'ADMIN' | 'MENTOR';

export interface PanelUser {
  id: string;
  name: string;
  role: PanelRole;
  email?: string;
  phone?: string;
}

const TOKEN_KEY = 'tm_token';
const USER_KEY = 'tm_user';

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const session = {
  getToken(): string | null {
    return storage()?.getItem(TOKEN_KEY) ?? null;
  },
  getUser(): PanelUser | null {
    const raw = storage()?.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw) as PanelUser;
      return u.role === 'ADMIN' || u.role === 'MENTOR' ? u : null;
    } catch {
      return null;
    }
  },
  set(token: string, user: PanelUser) {
    const s = storage();
    s?.setItem(TOKEN_KEY, token);
    s?.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    const s = storage();
    s?.removeItem(TOKEN_KEY);
    s?.removeItem(USER_KEY);
    // Remove keys left behind by the old panel.
    ['tm_role', 'tm_auth_mode', 'tm_deleted_schools', 'tm_deleted_licenses'].forEach((k) => s?.removeItem(k));
  },
};

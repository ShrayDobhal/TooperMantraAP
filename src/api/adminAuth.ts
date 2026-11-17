import { api, unwrap } from '@/lib/api';
import type { PanelUser } from '@/lib/session';

export interface AdminLoginResult {
  accessToken: string;
  expiresIn: number;
  admin: { id: string; email: string; name: string; role: 'ADMIN' | 'MENTOR' };
}

export const adminAuthApi = {
  login(email: string, password: string) {
    return unwrap<AdminLoginResult>(api.post('/admin/auth/login', { email, password }));
  },
  me() {
    return unwrap<{ id: string; email: string; name: string; role: string }>(api.get('/admin/auth/me'));
  },
  logout() {
    return unwrap<{ loggedOut: boolean }>(api.post('/admin/auth/logout', {}));
  },
};

/** Mentor login uses the app's normal phone OTP flow. */
export const mentorAuthApi = {
  sendOtp(phone: string) {
    return unwrap<{ phone: string; resendCooldown?: number; message?: string }>(api.post('/auth/send-otp', { phone }));
  },
  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: PanelUser; role: string }> {
    const data = await unwrap<any>(api.post('/auth/verify-otp', { phone, otp }));
    const token: string | undefined = data?.tokens?.accessToken || data?.accessToken;
    const u = data?.user || {};
    if (!token) throw new Error('Login failed: no access token returned.');
    return {
      token,
      role: u.role,
      user: {
        id: u.id,
        role: u.role === 'ADMIN' ? 'ADMIN' : 'MENTOR',
        name: u.profile?.fullName || u.fullName || u.name || 'Mentor',
        phone: u.phone,
      },
    };
  },
};

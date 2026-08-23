import { api } from '@/lib/api';

export const authApi = {
  async login(payload: { email?: string; password?: string; phone?: string; otp?: string; role?: string }) {
    const res: any = await api.post('/auth/login', payload);
    return res;
  },
  async sendOtp(phone: string) {
    const res: any = await api.post('/auth/send-otp', { phone });
    return res;
  },
  async verifyOtp(phone: string, otp: string) {
    const res: any = await api.post('/auth/verify-otp', { phone, otp });
    return res;
  },
  async getMe() {
    const res: any = await api.get('/auth/me');
    return res;
  },
};

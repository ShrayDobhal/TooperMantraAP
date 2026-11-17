import axios, { AxiosError } from 'axios';
import { session } from './session';

/**
 * In the browser every call goes to same-origin `/api/v1`, which next.config.js
 * rewrites to the backend. Responses are unwrapped to the backend envelope
 * `{ success, data, meta }`.
 */
const BASE_URL =
  typeof window !== 'undefined'
    ? '/api/v1'
    : `${(process.env.BACKEND_API_URL || 'http://187.127.111.105').replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/v1`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export class ApiError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

api.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const body = error.response?.data;
    const message =
      body?.error?.message || body?.message || (status ? `Request failed (${status})` : error.message || 'Network error');

    // Expired or invalid session: drop it and go back to login (but not for the login call itself).
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/verify-otp') || url.includes('/auth/send-otp');
    if (status === 401 && !isAuthCall && typeof window !== 'undefined') {
      session.clear();
      if (window.location.pathname !== '/') window.location.href = '/';
    }
    return Promise.reject(new ApiError(Array.isArray(message) ? message[0] : message, status, body?.error?.code));
  },
);

/** Unwraps `{ success, data }` to `data`. */
export async function unwrap<T>(p: Promise<any>): Promise<T> {
  const res = await p;
  return (res && typeof res === 'object' && 'data' in res ? res.data : res) as T;
}

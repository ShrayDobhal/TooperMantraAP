import axios from 'axios';

const BASE_URL = typeof window !== 'undefined'
  ? '/api/v1'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://187.127.111.105/api/v1');

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('tm_token');
      localStorage.removeItem('tm_user');
      localStorage.removeItem('tm_role');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    const message = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

import { api, unwrap } from '@/lib/api';

export interface SystemHealth {
  db: { ok: boolean; latencyMs: number | null };
  redis: { ok: boolean; latencyMs: number | null; mode: 'redis' | 'memory' };
  api: {
    uptimeSeconds: number;
    totalRequests: number;
    routes: { route: string; count: number; p50: number; p95: number; p99: number; errors: number }[];
  };
  server: { memoryMb: number; nodeVersion: string; env: string };
}

export const systemApi = {
  health: () => unwrap<SystemHealth>(api.get('/admin/system/health')),
};

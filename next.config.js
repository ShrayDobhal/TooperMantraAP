/** @type {import('next').NextConfig} */

// All browser calls go to same-origin /api/v1 and are proxied to the backend here,
// so the backend URL and any credentials never ship in the client bundle.
// Accepts either the origin or the origin with /api/v1 appended.
const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://187.127.111.105').replace(/\/+$/, '').replace(/\/api\/v1$/, '');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_API_URL}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;

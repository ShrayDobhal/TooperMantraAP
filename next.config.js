/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rewrites proxy API requests directly to the backend server.
  // This avoids Next.js body parsing entirely, so there is no body size limit —
  // large payloads (mentor images, video thumbnails, etc.) pass through without 413 errors.
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://187.127.111.105/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

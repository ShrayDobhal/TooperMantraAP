/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

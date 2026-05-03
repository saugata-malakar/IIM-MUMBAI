/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8003/api/:path*', // Proxy to FastAPI Backend
      },
    ]
  },
};
module.exports = nextConfig;

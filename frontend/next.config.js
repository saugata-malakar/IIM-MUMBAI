/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com'],
  },
  async rewrites() {
    // Uses the Render backend URL in production, or localhost in development
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8003';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`, 
      },
    ]
  },
};
module.exports = nextConfig;

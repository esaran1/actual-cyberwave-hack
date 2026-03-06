/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy /api to backend when REPLIT=1 (backend + frontend on same host)
  async rewrites() {
    if (process.env.REPLIT) {
      return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }];
    }
    return [];
  }
};

export default nextConfig;

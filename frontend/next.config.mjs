/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yourdomain.com',
        pathname: '/api/uploads/**', // Production domain
      },
      {
        protocol: 'https',
        hostname: 'yourdomain.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '147.93.121.45',
        pathname: '/api/uploads/**', // Production IP
      },
      {
        protocol: 'http',
        hostname: '147.93.121.45',
        pathname: '/uploads/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

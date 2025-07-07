/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**', // legacy path
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/api/uploads/**', // Allow images served via API
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5002',
        pathname: '/api/uploads/**', // Development server
      },
      {
        protocol: 'https',
        hostname: 'eduskillbridge.net',
        pathname: '/api/uploads/**', // Production domain
      },
      {
        protocol: 'https',
        hostname: 'eduskillbridge.net',
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

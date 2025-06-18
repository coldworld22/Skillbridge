/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**', // legacy path
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/api/uploads/**', // Allow images served via API
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

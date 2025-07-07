/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [

      {
        protocol: 'http',
        hostname: '147.93.121.45',
        port: '5002', // Add port explicitly
        pathname: '/**',
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

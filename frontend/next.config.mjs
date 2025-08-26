import nextI18NextConfig from './next-i18next.config.js';

/** @type {import('next').NextConfig} */
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5002/api';
const { protocol, hostname, port } = new URL(apiBase);
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: protocol.replace(':', ''),
        hostname,
        port,
        pathname: '/**',
      },
      {
        protocol: protocol.replace(':', ''),
        hostname,
        port,
        pathname: '/api/uploads/**',
      },
      {
        protocol: protocol.replace(':', ''),
        hostname,
        port,
        pathname: '/uploads/**',
      },
      // Legacy patterns kept for backward compatibility
      {
        protocol: 'https',
        hostname: 'eduskillbridge.net',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'eduskillbridge.net',
        pathname: '/uploads/**',
      },
    ],
  },
  i18n: nextI18NextConfig.i18n,
  // Increase the page data size limit to suppress build warnings for
  // larger translation bundles.
  experimental: {
    largePageDataBytes: 256 * 1024,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
};

export default nextConfig;

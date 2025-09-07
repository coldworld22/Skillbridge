import nextI18NextConfig from './next-i18next.config.js';

/** @type {import('next').NextConfig} */
const defaultApiBase = 'http://localhost:5002/api';
const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
let apiBase = apiBaseEnv || defaultApiBase;
const pgAdminBase = process.env.NEXT_PUBLIC_PGADMIN_URL || 'http://localhost:5050';

let protocol, hostname, port;
try {
  if (!/^https?:\/\//i.test(apiBase)) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must be an absolute URL. Received: ${apiBase}`,
    );
  }
  ({ protocol, hostname, port } = new URL(apiBase));
} catch (error) {
  console.warn(
    `Invalid NEXT_PUBLIC_API_BASE_URL ("${apiBase}"): ${error.message}. Falling back to ${defaultApiBase}.`,
  );
  apiBase = defaultApiBase;
  ({ protocol, hostname, port } = new URL(defaultApiBase));
}
const appDomain = process.env.APP_DOMAIN;
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
      ...(appDomain
        ? [
            { protocol: 'https', hostname: appDomain, pathname: '/api/uploads/**' },
            { protocol: 'https', hostname: appDomain, pathname: '/uploads/**' },
          ]
        : []),
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
  async rewrites() {
    return [
      {
        source: '/api/pgadmin/:path*',
        destination: `${pgAdminBase}/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;

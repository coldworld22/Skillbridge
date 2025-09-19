import nextI18NextConfig from './next-i18next.config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenvExpand.expand(
  dotenv.config({
    path: path.join(
      __dirname,
      `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`,
    ),
  }),
);

/** @type {import('next').NextConfig} */
const defaultApiBase = 'http://localhost:5002/api';
const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
let apiBase = apiBaseEnv || defaultApiBase;
const defaultPgAdminBase = 'http://localhost:5050';
const pgAdminEnv = process.env.NEXT_PUBLIC_PGADMIN_URL;
let pgAdminBase = pgAdminEnv || defaultPgAdminBase;

try {
  if (!/^https?:\/\//i.test(pgAdminBase)) {
    throw new Error(
      `NEXT_PUBLIC_PGADMIN_URL must be an absolute URL. Received: ${pgAdminBase}`,
    );
  }

  // Ensure URL is well-formed
  new URL(pgAdminBase);
} catch (error) {
  console.warn(
    `Invalid NEXT_PUBLIC_PGADMIN_URL ("${pgAdminBase}"): ${error.message}. Falling back to ${defaultPgAdminBase}.`,
  );
  pgAdminBase = defaultPgAdminBase;
}

let protocol, hostname, port;
try {
  if (!/^https?:\/\//i.test(apiBase)) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must be an absolute URL. Received: ${apiBase}`,
    );
  }

  // Prevent shipping a build that points at an internal HTTP host which would
  // cause browsers to block requests with mixed-content errors.
  const enforcePublicAPI = process.env.STRICT_PUBLIC_API === 'true';
  const isStrictProduction = enforcePublicAPI && process.env.NODE_ENV === 'production';
  if (isStrictProduction) {
    const localHostPattern =
      /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|backend)(:\\d+)?/i;
    if (localHostPattern.test(apiBase)) {
      throw new Error(
        `NEXT_PUBLIC_API_BASE_URL (${apiBase}) points to a non-public host. Set this to your public HTTPS domain in frontend/.env.production.`,
      );
    }
    if (!/^https:\/\//i.test(apiBase)) {
      throw new Error(
        `NEXT_PUBLIC_API_BASE_URL (${apiBase}) must use HTTPS when building production images.`,
      );
    }
  }

  ({ protocol, hostname, port } = new URL(apiBase));
} catch (error) {
  if (process.env.STRICT_PUBLIC_API === 'true' && process.env.NODE_ENV === 'production') {
    throw error;
  }
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
    externalDir: true,
  },
  webpack(config) {
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../shared');
    return config;
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
        source: '/api/:path((?!health$).*)',
        destination: `${apiBase}/:path`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

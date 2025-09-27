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
const internalApiBaseEnv = process.env.INTERNAL_API_BASE_URL;
const enforcePublicAPI = process.env.STRICT_PUBLIC_API === 'true';
const isStrictProduction = enforcePublicAPI && process.env.NODE_ENV === 'production';
const appDomain = process.env.APP_DOMAIN;

const normalizeBase = (value) => value.replace(/\/+$/, '');

const resolveApiBase = (candidate) => {
  if (!candidate) {
    return defaultApiBase;
  }

  if (/^https?:\/\//i.test(candidate)) {
    return normalizeBase(candidate);
  }

  if (candidate.startsWith('/')) {
    if (!appDomain) {
      throw new Error(
        `NEXT_PUBLIC_API_BASE_URL (${candidate}) is a relative path, but APP_DOMAIN is not set.`,
      );
    }

    const hasProtocol = /^https?:\/\//i.test(appDomain);
    const normalizedDomain = appDomain.replace(/\/+$/, '');
    const normalizedPath = `/${candidate.replace(/^\/+/, '')}`;
    const domainWithProtocol = hasProtocol
      ? normalizedDomain
      : `https://${normalizedDomain}`;
    return normalizeBase(`${domainWithProtocol}${normalizedPath}`);
  }

  throw new Error(
    `NEXT_PUBLIC_API_BASE_URL must be an absolute URL or start with "/". Received: ${candidate}`,
  );
};

let apiBase;
if (isStrictProduction) {
  if (!apiBaseEnv) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL must be defined when STRICT_PUBLIC_API is enabled for production builds.',
    );
  }
  apiBase = resolveApiBase(apiBaseEnv);
} else {
  try {
    apiBase = resolveApiBase(apiBaseEnv);
  } catch (error) {
    console.warn(
      `Invalid NEXT_PUBLIC_API_BASE_URL ("${apiBaseEnv}"): ${error.message}. Falling back to ${defaultApiBase}.`,
    );
    apiBase = defaultApiBase;
  }
}
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
pgAdminBase = normalizeBase(pgAdminBase);

let protocol, hostname, port;
try {
  if (!/^https?:\/\//i.test(apiBase)) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must be an absolute URL. Received: ${apiBase}`,
    );
  }

  // Prevent shipping a build that points at an internal HTTP host which would
  // cause browsers to block requests with mixed-content errors.
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
  if (isStrictProduction) {
    throw error;
  }
  console.warn(
    `Invalid NEXT_PUBLIC_API_BASE_URL ("${apiBase}"): ${error.message}. Falling back to ${defaultApiBase}.`,
  );
  apiBase = defaultApiBase;
  ({ protocol, hostname, port } = new URL(defaultApiBase));
}
let internalApiBase = apiBase;
let internalProtocol = protocol;
let internalHostname = hostname;
let internalPort = port;

if (internalApiBaseEnv) {
  try {
    if (!/^https?:\/\//i.test(internalApiBaseEnv)) {
      throw new Error(
        `INTERNAL_API_BASE_URL must be an absolute URL. Received: ${internalApiBaseEnv}`,
      );
    }

    const normalizedInternal = normalizeBase(internalApiBaseEnv);
    const parsedInternal = new URL(normalizedInternal);
    internalApiBase = normalizedInternal;
    internalProtocol = parsedInternal.protocol;
    internalHostname = parsedInternal.hostname;
    internalPort = parsedInternal.port;
  } catch (error) {
    console.warn(
      `Invalid INTERNAL_API_BASE_URL ("${internalApiBaseEnv}"): ${error.message}. Falling back to ${apiBase}.`,
    );
  }
}
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
      ...((internalHostname !== hostname || internalPort !== port || internalProtocol !== protocol)
        ? [
            {
              protocol: internalProtocol.replace(':', ''),
              hostname: internalHostname,
              port: internalPort,
              pathname: '/**',
            },
            {
              protocol: internalProtocol.replace(':', ''),
              hostname: internalHostname,
              port: internalPort,
              pathname: '/api/uploads/**',
            },
            {
              protocol: internalProtocol.replace(':', ''),
              hostname: internalHostname,
              port: internalPort,
              pathname: '/uploads/**',
            },
          ]
        : []),
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
    outputFileTracingIncludes: {
      '/docs': ['../docs/**/*'],
      '/docs/[slug]': ['../docs/**/*'],
    },
    turbo: {
      resolveAlias: {
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
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
    return {
      beforeFiles: [
        {
          source: '/api/health',
          destination: '/api/health',
        },
      ],
      afterFiles: [
        {
          source: '/api/pgadmin/:path*',
          destination: `${pgAdminBase}/:path*`,
        },
        {
          source: '/api/:path((?!health(?:/|$)).*)',
          destination: `${internalApiBase}/:path`,
        },
        {
          source: '/uploads/:path*',
          destination: `${internalApiBase}/uploads/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;

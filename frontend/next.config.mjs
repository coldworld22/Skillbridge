import path from 'path';
import { fileURLToPath } from 'url';
import nextI18NextConfig from './next-i18next.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const resolveDefaultApiBase = () => {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.APP_DOMAIN) {
      return `https://${process.env.APP_DOMAIN}/api`;
    }
    console.warn(
      'APP_DOMAIN is not set. Defaulting API base URL to http://localhost:8000/api. '
        + 'Set NEXT_PUBLIC_API_BASE_URL in your environment to point to your backend.'
    );
  }
  return 'http://localhost:8000/api';
};

const defaultApiBase = resolveDefaultApiBase();
const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
let apiBase = apiBaseEnv || defaultApiBase;
const pgAdminBase = process.env.NEXT_PUBLIC_PGADMIN_URL || 'http://localhost:5050';
const isProduction = process.env.NODE_ENV === 'production';
const internalApiBase =
  process.env.INTERNAL_API_BASE_URL || 'http://backend:5002/api';

let protocol, hostname, port;
try {
  if (!/^https?:\/\//i.test(apiBase)) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must be an absolute URL. Received: ${apiBase}`,
    );
  }

  // Prevent shipping a build that points at an internal HTTP host which would
  // cause browsers to block requests with mixed-content errors.
  if (
    process.env.NODE_ENV === 'production' &&
    /^https?:\/\/(localhost|backend)(:\\d+)?/i.test(apiBase)
  ) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL (${apiBase}) points to a non-public host. Set this to your public HTTPS domain in frontend/.env.production.`,
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
const formActionHosts = new Set();
if (appDomain) {
  formActionHosts.add(`https://${appDomain}`);
  formActionHosts.add(`https://www.${appDomain}`);
  formActionHosts.add(`https://api.${appDomain}`);
}
const formActionList = ["'self'", ...Array.from(formActionHosts)];
const cspRules = [
  `form-action ${formActionList.join(" ")}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");
const securityHeaders = isProduction
  ? [
      { key: 'Content-Security-Policy', value: cspRules },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      {
        key: 'Permissions-Policy',
        value: 'microphone=(self), camera=(), geolocation=()',
      },
    ]
  : [];
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
  outputFileTracingRoot: path.join(__dirname),
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
    const rules = [];
    if (!isProduction) {
      rules.push({
        source: '/api/pgadmin/:path*',
        destination: `${pgAdminBase}/:path*`,
      });
    }
    // In production, prefer the publicly reachable API base when provided,
    // otherwise fall back to the internal Docker host.
    const rewriteBase = isProduction && apiBaseEnv ? apiBase : (isProduction ? internalApiBase : apiBase);
    rules.push({
      source: '/api/:path*',
      destination: `${rewriteBase}/:path*`,
    });
    return rules;
  },
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/docs/index.html',
        permanent: false,
      },
      {
        source: '/install',
        destination: '/install/index.html',
        permanent: false,
      },
    ];
  },
  async headers() {
    if (!securityHeaders.length) {
      return [];
    }
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

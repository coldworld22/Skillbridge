import path from 'path';
import { fileURLToPath } from 'url';
import nextI18NextConfig from './next-i18next.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveBuildWorkerCount = () => {
  const workerEnv =
    process.env.FRONTEND_BUILD_WORKERS ||
    process.env.NEXT_BUILD_WORKERS ||
    process.env.NEXT_BUILD_WORKER_COUNT;
  const parsed = Number.parseInt(workerEnv ?? '', 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return 1;
};
const buildWorkerCount = resolveBuildWorkerCount();

/** ---------------------------
 * SOLUTION 1 → PUBLIC API URL
 * --------------------------*/

const resolveDefaultApiBase = () => {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.APP_DOMAIN) {
      return `https://${process.env.APP_DOMAIN}/api`;
    }
    console.warn(
      'APP_DOMAIN is not set. Defaulting API base URL to https://eduskillbridge.net/api.'
    );
    return `https://eduskillbridge.net/api`;
  }
  return 'http://localhost:8000/api';
};

const defaultApiBase = resolveDefaultApiBase();
const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
let apiBase = apiBaseEnv || defaultApiBase;

const pgAdminBase = process.env.NEXT_PUBLIC_PGADMIN_URL || 'http://localhost:5050';

const isProduction = process.env.NODE_ENV === 'production';

/** Never use Docker internal URL in production */
const internalApiBase = 'http://backend:5002/api';

let protocol, hostname, port;

try {
  if (!/^https?:\/\//i.test(apiBase)) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must be absolute. Received: ${apiBase}`
    );
  }

  // Prevent backend:5002 or localhost in production builds
  if (
    isProduction &&
    /^https?:\/\/(localhost|backend)(:\d+)?/i.test(apiBase)
  ) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL (${apiBase}) must be a PUBLIC URL in production.`
    );
  }

  ({ protocol, hostname, port } = new URL(apiBase));
} catch (error) {
  console.warn(
    `Invalid NEXT_PUBLIC_API_BASE_URL ("${apiBase}"): ${error.message}. Falling back to ${defaultApiBase}.`
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
        value: 'microphone=(self), camera=(self), geolocation=()',
      },
    ]
  : [];

const disableMinification =
  process.env.FRONTEND_DISABLE_MINIFY === '1' ||
  process.env.NEXT_DISABLE_MINIFY === '1';

let minifyWarningEmitted = false;

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**', pathname: '/**' },
      { protocol: 'http', hostname: '**', pathname: '/**' },
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

  experimental: {
    largePageDataBytes: 256 * 1024,
    cpus: buildWorkerCount,
  },

  outputFileTracingRoot: path.join(__dirname),

  eslint: { ignoreDuringBuilds: true },

  compiler: {
    removeConsole:
      isProduction
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  /** ---------------------------
   * FIXED Rewrites (Solution 1)
   * --------------------------*/
  async rewrites() {
    const rules = [];

    if (!isProduction) {
      rules.push({
        source: '/api/pgadmin/:path*',
        destination: `${pgAdminBase}/:path*`,
      });
    }

    // Production always uses PUBLIC API domain
    const rewriteBase = isProduction
      ? apiBase
      : apiBase;

    rules.push({
      source: '/api/:path*',
      destination: `${rewriteBase}/:path*`,
    });

    return rules;
  },

  async redirects() {
    return [
      { source: '/docs', destination: '/docs/index.html', permanent: false },
      { source: '/install', destination: '/install/index.html', permanent: false },
    ];
  },

  async headers() {
    if (!securityHeaders.length) return [];
    return [
      { source: '/(.*)', headers: securityHeaders },
    ];
  },

  webpack(config, { dev, isServer }) {
    if (isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'socket.io-client': path.join(__dirname, 'src/utils/mockSocketClient.js'),
        'simple-peer': path.join(__dirname, 'src/utils/mockSimplePeer.js'),
      };
    }

    if (!dev && disableMinification) {
      if (!minifyWarningEmitted) {
        console.warn(
          'FRONTEND_DISABLE_MINIFY=1 detected; skipping Next.js minification.'
        );
        minifyWarningEmitted = true;
      }
      config.optimization.minimize = false;
    }

    return config;
  },
};

export default nextConfig;

const { z } = require('zod');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const TRUTHY_ENV_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSY_ENV_VALUES = new Set(['false', '0', 'no', 'off']);

const parseBooleanFlag = (value, { varName, defaultValue = false } = {}) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return defaultValue;
    }
    return value !== 0;
  }

  if (value == null) {
    return defaultValue;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return defaultValue;
    }
    if (TRUTHY_ENV_VALUES.has(normalized)) {
      return true;
    }
    if (
      FALSY_ENV_VALUES.has(normalized) ||
      normalized === 'undefined' ||
      normalized === 'null' ||
      normalized === 'none'
    ) {
      return false;
    }
  }

  const label = varName || 'value';
  throw new Error(`${label} must be one of: true, false, 1, 0, yes, no, on, off.`);
};

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BACKEND_PORT: z.coerce.number().default(5002),
  RATE_LIMIT_WINDOW_MS: z
    .coerce.number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
  JWT_SECRET: z
    .string()
    .trim()
    .min(1, 'JWT_SECRET must not be empty'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .trim()
    .min(1, 'REFRESH_TOKEN_SECRET must not be empty'),
  SESSION_SECRET: z
    .string()
    .trim()
    .min(1, 'SESSION_SECRET must not be empty'),
  DATABASE_URL: z.string().url().optional(),
  PRODUCTION_DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  DATABASE_HOST: z.string().optional(),
  DATABASE_PORT: z.coerce.number().optional(),
  DATABASE_USER: z.string().optional(),
  DATABASE_PASSWORD: z.string().optional(),
  DATABASE_NAME: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.coerce.number().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  APP_DOMAIN: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  ENABLE_INSTALL: z.boolean().default(false),
  INSTALL_API_ENABLED: z.boolean().default(false),
  RATE_LIMIT_MAX_REQUESTS: z
    .coerce.number()
    .int()
    .positive()
    .default(1000),
  RATE_LIMIT_WINDOW_MINUTES: z
    .coerce.number()
    .int()
    .positive()
    .default(15),
});

const OPTIONAL_URL_ENV_VARS = [
  'DATABASE_URL',
  'PRODUCTION_DATABASE_URL',
  'TEST_DATABASE_URL',
  'REDIS_URL',
];

const normalizeOptionalUrl = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
};

const createValidatedEnv = () => {
  const modifiedEnv = { ...process.env };

  modifiedEnv.ENABLE_INSTALL = parseBooleanFlag(modifiedEnv.ENABLE_INSTALL, {
    varName: 'ENABLE_INSTALL',
    defaultValue: false,
  });
  modifiedEnv.INSTALL_API_ENABLED = parseBooleanFlag(modifiedEnv.INSTALL_API_ENABLED, {
    varName: 'INSTALL_API_ENABLED',
    defaultValue: false,
  });

  OPTIONAL_URL_ENV_VARS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(modifiedEnv, key)) {
      modifiedEnv[key] = normalizeOptionalUrl(modifiedEnv[key]);
    }
  });

  const sanitizedEnv = EnvSchema.parse(modifiedEnv);

  // Re-run validation after sanitizing optional URLs to ensure the final
  // environment object still satisfies the schema.
  return EnvSchema.parse(sanitizedEnv);
};

const env = createValidatedEnv();

let FRONTEND_URL = env.FRONTEND_URL;
if (FRONTEND_URL.startsWith('FRONTEND_URL=')) {
  FRONTEND_URL = FRONTEND_URL.replace(/^FRONTEND_URL=/, '');
}

let FRONTEND_ORIGINS;
try {
  FRONTEND_ORIGINS = FRONTEND_URL.split(',').map((url) => new URL(url.trim()).origin);
} catch {
  throw new Error(`Invalid FRONTEND_URL: ${FRONTEND_URL}`);
}
const DEFAULT_HOSTS = {
  development: 'db',
  production: 'db',
  test: '127.0.0.1',
};

const DEFAULT_PORT = 5432;

const safeParseUrl = (value) => {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
};

const buildUrlFromParts = (targetEnv) => {
  const host =
    env.DATABASE_HOST || env.POSTGRES_HOST || DEFAULT_HOSTS[targetEnv];
  const port =
    env.DATABASE_PORT ?? env.POSTGRES_PORT ?? DEFAULT_PORT;
  const user = env.DATABASE_USER || env.POSTGRES_USER;
  const password = env.DATABASE_PASSWORD ?? env.POSTGRES_PASSWORD;
  const database = env.DATABASE_NAME || env.POSTGRES_DB;

  if (!host || !user || !database) {
    return null;
  }

  const url = new URL('postgres://localhost');
  url.hostname = host;
  if (port) {
    url.port = String(port);
  } else {
    url.port = '';
  }
  url.username = user;
  if (password !== undefined) {
    url.password = password;
  } else {
    url.password = '';
  }
  url.pathname = `/${database}`;
  return url.toString();
};

const preferConsistentUrl = (directUrl, derivedUrl) => {
  if (!derivedUrl) {
    return directUrl;
  }
  if (!directUrl) {
    return derivedUrl;
  }

  const parsed = safeParseUrl(directUrl);
  if (!parsed) {
    return derivedUrl;
  }

  const expected = {
    username: env.DATABASE_USER || env.POSTGRES_USER,
    password: env.DATABASE_PASSWORD ?? env.POSTGRES_PASSWORD,
    host: env.DATABASE_HOST || env.POSTGRES_HOST,
    port: env.DATABASE_PORT ?? env.POSTGRES_PORT,
    database: env.DATABASE_NAME || env.POSTGRES_DB,
  };

  const actual = {
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : undefined,
    database: parsed.pathname ? decodeURIComponent(parsed.pathname.replace(/^\//, '')) : undefined,
  };

  const mismatchedKeys = [];

  if (expected.username && actual.username && expected.username !== actual.username) {
    mismatchedKeys.push('username');
  }

  if (expected.password !== undefined) {
    const actualPassword = actual.password ?? '';
    if (actualPassword !== expected.password) {
      mismatchedKeys.push('password');
    }
  }

  if (expected.host && actual.host && expected.host !== actual.host) {
    mismatchedKeys.push('host');
  }

  if (expected.port && actual.port && Number(expected.port) !== actual.port) {
    mismatchedKeys.push('port');
  }

  if (expected.database && actual.database && expected.database !== actual.database) {
    mismatchedKeys.push('database');
  }

  if (mismatchedKeys.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[config] DATABASE_URL conflicts with ${mismatchedKeys.join(
        ', '
      )} environment variable(s); using derived credentials instead.`
    );
    return derivedUrl;
  }

  return directUrl;
};

const resolveDatabaseUrl = (targetEnv) => {
  if (targetEnv === 'test') {
    const derived = buildUrlFromParts(targetEnv);
    return preferConsistentUrl(env.TEST_DATABASE_URL, derived);
  }

  if (targetEnv === 'production') {
    const direct = env.PRODUCTION_DATABASE_URL || env.DATABASE_URL;
    const derived = buildUrlFromParts(targetEnv);
    return preferConsistentUrl(direct, derived);
  }

  const derived = buildUrlFromParts(targetEnv);
  return preferConsistentUrl(env.DATABASE_URL || env.PRODUCTION_DATABASE_URL, derived);
};

const DATABASE_URLS = {
  development: resolveDatabaseUrl('development'),
  production: resolveDatabaseUrl('production'),
  test: resolveDatabaseUrl('test'),
};

const DATABASE_URL = DATABASE_URLS[env.NODE_ENV];
if (!DATABASE_URL) {
  const requirement =
    env.NODE_ENV === 'test'
      ? 'TEST_DATABASE_URL or matching POSTGRES_/DATABASE_ variables'
      : 'DATABASE_URL/PRODUCTION_DATABASE_URL or matching POSTGRES_/DATABASE_ variables';
  throw new Error(`Unable to determine database connection string. Provide ${requirement}.`);
}

const getDatabaseUrl = (targetEnv = env.NODE_ENV) => DATABASE_URLS[targetEnv];

module.exports = {
  NODE_ENV: env.NODE_ENV,
  BACKEND_PORT: env.BACKEND_PORT,
  RATE_LIMIT_WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: env.RATE_LIMIT_MAX,
  JWT_SECRET: env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET,
  SESSION_SECRET: env.SESSION_SECRET,
  DATABASE_URL,
  getDatabaseUrl,
  REDIS_URL: env.REDIS_URL,
  FRONTEND_URL,
  FRONTEND_ORIGINS,
  APP_DOMAIN: env.APP_DOMAIN,
  COOKIE_DOMAIN: env.COOKIE_DOMAIN,
  ENABLE_INSTALL: env.ENABLE_INSTALL,
  INSTALL_API_ENABLED: env.INSTALL_API_ENABLED,
  RATE_LIMIT_MAX_REQUESTS: env.RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MINUTES: env.RATE_LIMIT_WINDOW_MINUTES,
};

const { z } = require('zod');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5002),
  JWT_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  SESSION_SECRET: z.string(),
  DATABASE_URL: z.string().url().optional(),
  PRODUCTION_DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  APP_DOMAIN: z.string().optional(),
  ENABLE_INSTALL: z.coerce.boolean().default(false),
});

const env = EnvSchema.parse(process.env);

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

const DATABASE_URL =
  env.NODE_ENV === 'test'
    ? env.TEST_DATABASE_URL
    : env.DATABASE_URL || env.PRODUCTION_DATABASE_URL;
if (!DATABASE_URL) {
  const key =
    env.NODE_ENV === 'test'
      ? 'TEST_DATABASE_URL'
      : 'DATABASE_URL or PRODUCTION_DATABASE_URL';
  throw new Error(`${key} is required`);
}

module.exports = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  JWT_SECRET: env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET,
  SESSION_SECRET: env.SESSION_SECRET,
  DATABASE_URL,
  REDIS_URL: env.REDIS_URL,
  FRONTEND_URL,
  FRONTEND_ORIGINS,
  APP_DOMAIN: env.APP_DOMAIN,
  ENABLE_INSTALL: env.ENABLE_INSTALL,
};

const ORIGINAL_ENV = process.env;

describe('env config optional URL handling', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('allows optional database URLs to be empty strings', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'refresh-secret';
    process.env.SESSION_SECRET = 'session-secret';
    process.env.POSTGRES_HOST = 'localhost';
    process.env.POSTGRES_USER = 'postgres';
    process.env.POSTGRES_PASSWORD = 'password';
    process.env.POSTGRES_DB = 'skillbridge';
    process.env.PRODUCTION_DATABASE_URL = '';
    process.env.DATABASE_URL = '';
    process.env.TEST_DATABASE_URL = '';
    process.env.REDIS_URL = '';

    const loadConfig = () => require('../src/config/env');

    expect(loadConfig).not.toThrow();

    const config = loadConfig();

    expect(config.getDatabaseUrl('production')).toEqual(
      'postgres://postgres:password@localhost:5432/skillbridge'
    );
  });
});

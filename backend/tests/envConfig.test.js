describe('environment configuration optional URLs', () => {
  const envKeys = [
    'NODE_ENV',
    'DATABASE_URL',
    'PRODUCTION_DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'SESSION_SECRET',
  ];

  let originalValues;

  beforeEach(() => {
    jest.resetModules();
    originalValues = {};
    envKeys.forEach((key) => {
      originalValues[key] = process.env[key];
    });
  });

  afterEach(() => {
    envKeys.forEach((key) => {
      if (originalValues[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValues[key];
      }
    });
    jest.resetModules();
  });

  it('treats empty optional database URLs as absent', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.PRODUCTION_DATABASE_URL = '';
    process.env.JWT_SECRET = 'jwt';
    process.env.REFRESH_TOKEN_SECRET = 'refresh';
    process.env.SESSION_SECRET = 'session';

    let envConfig;
    expect(() => {
      envConfig = require('../src/config/env');
    }).not.toThrow();

    expect(envConfig.getDatabaseUrl('production')).toBe(
      'postgres://user:pass@localhost:5432/db'
    );
  });
});


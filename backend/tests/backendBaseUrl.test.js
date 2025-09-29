const envKeys = [
  'NODE_ENV',
  'BACKEND_URL',
  'APP_DOMAIN',
  'BACKEND_PORT',
  'DATABASE_URL',
  'PRODUCTION_DATABASE_URL',
  'TEST_DATABASE_URL',
];

describe('backend base url helper', () => {
  let originalValues;

  beforeEach(() => {
    jest.resetModules();
    originalValues = {};
    envKeys.forEach((key) => {
      originalValues[key] = process.env[key];
      delete process.env[key];
    });
    process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/test_db';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/dev_db';
    process.env.PRODUCTION_DATABASE_URL = 'postgres://user:pass@localhost:5432/prod_db';
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

  it('prefers explicit BACKEND_URL when provided', () => {
    let loggerMock;
    jest.doMock('../src/utils/logger', () => {
      loggerMock = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        debug: jest.fn(),
      };
      return loggerMock;
    });

    process.env.NODE_ENV = 'production';
    process.env.BACKEND_URL = 'https://api.example.com/base/';
    process.env.APP_DOMAIN = 'fallback.example.com';

    const config = require('../src/config/env');

    expect(config.BACKEND_BASE_URL).toBe('https://api.example.com/base');
    expect(config.buildBackendUrl('/api/payments/crypto/ipn')).toBe(
      'https://api.example.com/base/api/payments/crypto/ipn'
    );
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  it('falls back to APP_DOMAIN when BACKEND_URL is missing', () => {
    let loggerMock;
    jest.doMock('../src/utils/logger', () => {
      loggerMock = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        debug: jest.fn(),
      };
      return loggerMock;
    });

    process.env.NODE_ENV = 'production';
    process.env.APP_DOMAIN = 'app.example.com';

    const config = require('../src/config/env');

    expect(config.BACKEND_BASE_URL).toBe('https://app.example.com');
    expect(config.buildBackendUrl('api/payments/paypal/callback')).toBe(
      'https://app.example.com/api/payments/paypal/callback'
    );
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  it('uses localhost fallback outside production', () => {
    let loggerMock;
    jest.doMock('../src/utils/logger', () => {
      loggerMock = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        debug: jest.fn(),
      };
      return loggerMock;
    });

    process.env.NODE_ENV = 'development';
    process.env.APP_DOMAIN = ' ';
    process.env.BACKEND_URL = ' ';
    process.env.BACKEND_PORT = '7001';

    const config = require('../src/config/env');

    expect(config.BACKEND_BASE_URL).toBe('http://localhost:7001');
    expect(config.buildBackendUrl('/api/status')).toBe('http://localhost:7001/api/status');
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  it('logs and throws when the backend base URL cannot be resolved in production', () => {
    let loggerMock;
    jest.doMock('../src/utils/logger', () => {
      loggerMock = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        debug: jest.fn(),
      };
      return loggerMock;
    });

    process.env.NODE_ENV = 'production';
    process.env.APP_DOMAIN = ' ';
    process.env.BACKEND_URL = ' ';

    expect(() => require('../src/config/env')).toThrow(
      'Unable to resolve backend base URL. Set BACKEND_URL or APP_DOMAIN to a fully-qualified domain.'
    );
    expect(loggerMock.error).toHaveBeenCalledWith(
      '[config] Unable to resolve backend base URL. Set BACKEND_URL or APP_DOMAIN to a fully-qualified domain.'
    );
  });
});

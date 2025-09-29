const ORIGINAL_ENV = { ...process.env };

const loadHelper = ({ config = {}, env = {} } = {}) => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...env };

  jest.doMock('../env', () => ({
    NODE_ENV: 'test',
    BACKEND_PORT: 5002,
    APP_DOMAIN: undefined,
    ...config,
  }));

  // eslint-disable-next-line global-require
  const helper = require('../backendUrl');
  jest.dontMock('../env');
  return helper;
};

describe('backend base URL helper', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('prefers BACKEND_URL when provided and normalizes trailing slashes', () => {
    const helper = loadHelper({ env: { BACKEND_URL: 'https://api.example.com/base/' } });
    expect(helper.requireBackendBaseUrl()).toBe('https://api.example.com/base');
  });

  it('derives URL from APP_DOMAIN with protocol and port', () => {
    const helper = loadHelper({
      config: { NODE_ENV: 'production', BACKEND_PORT: 8443, APP_DOMAIN: 'api.example.com' },
    });
    expect(helper.requireBackendBaseUrl()).toBe('https://api.example.com:8443');
  });

  it('falls back to localhost when not in production', () => {
    const helper = loadHelper({ env: { BACKEND_URL: '', APP_DOMAIN: '' } });
    expect(helper.requireBackendBaseUrl()).toBe('http://localhost:5002');
  });

  it('surfaces an error when production URL cannot be resolved', () => {
    const helper = loadHelper({
      config: { NODE_ENV: 'production', APP_DOMAIN: undefined, BACKEND_PORT: 5002 },
      env: { BACKEND_URL: '' },
    });

    expect(helper.getBackendBaseUrl()).toBeUndefined();
    expect(helper.getBackendBaseUrlError()).toMatch(/Unable to determine backend base URL/);
  });
});

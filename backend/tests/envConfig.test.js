describe('config/env boolean parsing', () => {
  const ORIGINAL_ENV = { ...process.env };

  const loadConfig = () => {
    let loadedConfig;
    jest.isolateModules(() => {
      jest.doMock('dotenv', () => ({ config: jest.fn(() => ({ parsed: {} })) }));
      jest.doMock('dotenv-expand', () => ({ expand: jest.fn() }));
      loadedConfig = require('../src/config/env');
    });
    return loadedConfig;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt';
    process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session';
    process.env.TEST_DATABASE_URL =
      process.env.TEST_DATABASE_URL || 'postgresql://user:pass@localhost:5432/testdb';
    delete process.env.DATABASE_URL;
    delete process.env.ENABLE_INSTALL;
    delete process.env.INSTALL_API_ENABLED;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it.each([
    ['true', true],
    ['TRUE', true],
    ['1', true],
    ['yes', true],
    ['on', true],
    ['false', false],
    ['FALSE', false],
    ['0', false],
    ['no', false],
    ['off', false],
    ['', false],
    [undefined, false],
  ])('parses ENABLE_INSTALL=%s as %s', (value, expected) => {
    if (value === undefined) {
      delete process.env.ENABLE_INSTALL;
    } else {
      process.env.ENABLE_INSTALL = value;
    }

    const config = loadConfig();
    expect(config.ENABLE_INSTALL).toBe(expected);
  });

  it.each([
    ['true', true],
    ['1', true],
    ['on', true],
    ['false', false],
    ['0', false],
    ['off', false],
    ['', false],
    [undefined, false],
  ])('parses INSTALL_API_ENABLED=%s as %s', (value, expected) => {
    if (value === undefined) {
      delete process.env.INSTALL_API_ENABLED;
    } else {
      process.env.INSTALL_API_ENABLED = value;
    }

    const config = loadConfig();
    expect(config.INSTALL_API_ENABLED).toBe(expected);
  });

  it('throws a clear error for invalid boolean values', () => {
    process.env.ENABLE_INSTALL = 'maybe';
    expect(() => loadConfig()).toThrow(/ENABLE_INSTALL/);
  });
});

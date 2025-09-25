const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../src/config/database', () => {
  const builders = [];
  const createBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
    insert: jest.fn().mockResolvedValue(undefined),
  });

  const mockDb = jest.fn(() => {
    const builder = createBuilder();
    builders.push(builder);
    return builder;
  });

  mockDb.fn = { now: jest.fn(() => new Date()) };
  mockDb.__createBuilder = createBuilder;
  mockDb.__getBuilders = () => builders;
  mockDb.__clearBuilders = () => {
    builders.length = 0;
  };

  return mockDb;
});

const db = require('../src/config/database');
const service = require('../src/modules/socialLoginConfig/socialLoginConfig.service');

beforeEach(() => {
  jest.clearAllMocks();
  db.mockReset();
  db.__clearBuilders();
  db.mockImplementation(() => {
    const builder = db.__createBuilder();
    db.__getBuilders().push(builder);
    return builder;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(path.join(os.tmpdir(), 'skillbridge'), { recursive: true, force: true });
  delete process.env.SOCIAL_LOGIN_ENV_PATH;
});

describe('socialLoginConfigService.getSettings', () => {
  it('returns null when settings table is missing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    db.mockImplementationOnce(() => {
      const builder = db.__createBuilder();
      builder.first.mockRejectedValue(new Error('relation "settings" does not exist'));
      db.__getBuilders().push(builder);
      return builder;
    });

    const result = await service.getSettings();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load social login settings',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe('socialLoginConfigService.updateSettings', () => {
  it('persists settings even when the default .env file is not writable', async () => {
    const openSpy = jest.spyOn(fs, 'openSync').mockImplementation((target) => {
      if (String(target).endsWith('.env') && !String(target).includes('social-login.env')) {
        const error = new Error('permission denied');
        error.code = 'EACCES';
        throw error;
      }
      return 123;
    });
    jest.spyOn(fs, 'closeSync').mockImplementation(() => {});
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => '');
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const payload = { providers: { google: { clientId: 'client', clientSecret: 'secret' } } };

    await expect(service.updateSettings(payload)).resolves.toEqual(payload);

    const builders = db.__getBuilders();
    expect(builders[0].where).toHaveBeenCalledWith({ key: 'social_login_settings' });
    expect(builders[0].first).toHaveBeenCalled();
    expect(builders[1].insert).toHaveBeenCalledWith({
      key: 'social_login_settings',
      value: JSON.stringify(payload),
    });

    const writeTarget = writeSpy.mock.calls.map(([filePath]) => filePath);
    const fallbackPath = path.join(os.tmpdir(), 'skillbridge', 'social-login.env');
    expect(writeTarget).toContain(fallbackPath);

    openSpy.mockRestore();
  });

  it('does not throw if resolving the env file path fails unexpectedly', async () => {
    jest.spyOn(fs, 'openSync').mockImplementation(() => {
      const error = new Error('boom');
      error.code = 'EACCES';
      throw error;
    });
    jest.spyOn(fs, 'closeSync').mockImplementation(() => {});
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => '');
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const payload = { providers: { github: { clientId: 'id', clientSecret: 'secret' } } };

    await expect(service.updateSettings(payload)).resolves.toEqual(payload);

    const builders = db.__getBuilders();
    expect(builders[0].first).toHaveBeenCalled();
    expect(builders[1].insert).toHaveBeenCalled();
  });
});

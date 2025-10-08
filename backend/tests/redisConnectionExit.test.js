const mockExpress = require('express');

describe('Redis connection', () => {
  let exitSpy;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'jwt';
    process.env.REFRESH_TOKEN_SECRET = 'refresh';
    process.env.SESSION_SECRET = 'session';
    process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
    delete process.env.REDIS_URL;
  });

  it('exits the process if Redis connection fails', async () => {
    const mockConnect = jest.fn().mockRejectedValue(new Error('Redis down'));

    jest.mock('redis', () => ({
      createClient: jest.fn(() => ({ connect: mockConnect })),
    }));

    jest.mock('connect-redis', () => ({
      default: jest.fn().mockImplementation(function RedisStore() {
        return { on: jest.fn() };
      }),
    }));

    const mockLoggerError = jest.fn();
    jest.mock('../src/utils/logger.js', () => ({
      log: jest.fn(),
      warn: jest.fn(),
      error: mockLoggerError,
    }));

    jest.mock('../src/config/passport', () => ({
      passport: {
        initialize: () => (req, res, next) => next(),
        session: () => (req, res, next) => next(),
      },
      initStrategies: jest.fn(),
    }));

    jest.mock('../src/config/database', () => ({
      connectWithRetry: jest.fn(),
      migrate: { list: jest.fn().mockResolvedValue([[], []]) },
    }));

    jest.mock('../src/routes', () => mockExpress.Router());
    jest.mock('../src/jobs', () => jest.fn());
    jest.mock('../src/sockets', () => ({
      initSockets: jest.fn(),
      state: { io: {}, rooms: {}, participants: {}, userSockets: {} },
    }));

    const { startServer } = require('../src/server');

    await expect(startServer()).rejects.toThrow('exit');
    expect(mockConnect).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to connect to Redis'),
      expect.any(Error)
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

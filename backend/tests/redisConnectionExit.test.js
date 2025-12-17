const mockListen = jest.fn((port, host, cb) => {
  if (typeof host === 'function') {
    host();
  } else if (typeof cb === 'function') {
    cb();
  }
});

jest.mock('http', () => {
  const actual = jest.requireActual('http');
  return {
    ...actual,
    createServer: jest.fn(() => ({
      listen: mockListen,
      close: jest.fn(),
    })),
  };
});

describe('Redis connection', () => {
  let exitSpy;
  let mockLoggerError;
  let mockLoggerWarn;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockListen.mockClear();

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

  it('falls back to memory sessions when Redis connection fails', async () => {
    const mockConnect = jest.fn().mockRejectedValue(new Error('Redis down'));

    jest.mock('redis', () => ({
      createClient: jest.fn(() => ({
        connect: mockConnect,
        on: jest.fn(),
      })),
    }));

    jest.mock('connect-redis', () => ({
      default: jest.fn().mockImplementation(function RedisStore() {
        return {
          get: jest.fn(),
          set: jest.fn(),
          destroy: jest.fn(),
          touch: jest.fn(),
        };
      }),
    }));

    mockLoggerError = jest.fn();
    mockLoggerWarn = jest.fn();
    jest.mock('../src/utils/logger.js', () => ({
      log: jest.fn(),
      warn: mockLoggerWarn,
      error: mockLoggerError,
      debug: jest.fn(),
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
      migrate: { latest: jest.fn().mockResolvedValue([0, []]) },
    }));

    jest.mock('../src/routes', () => jest.fn((req, res, next) => next()));
    jest.mock('../src/jobs', () => jest.fn());
    jest.mock('../src/sockets', () => ({
      initSockets: jest.fn(),
      state: { io: {}, rooms: {}, participants: {}, userSockets: {} },
    }));

    const { startServer, server } = require('../src/server');

    await expect(startServer()).resolves.toBeUndefined();
    expect(mockConnect).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to connect to Redis'),
      expect.any(Error)
    );
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('in-memory session store')
    );
    expect(exitSpy).not.toHaveBeenCalled();
    server.close();
  });
});

const jwt = require('jsonwebtoken');

// Mock database and dependencies
jest.mock('../src/config/database', () => ({
  fn: { now: jest.fn() },
}));

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
  updateUser: jest.fn(),
  getUserRoles: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendOtpEmail: jest.fn(),
  sendPasswordChangeEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendNewUserAdminEmail: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(false),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

// In-memory mock for Redis
const mockRedisClient = (() => {
  const store = new Map();
  return {
    get: jest.fn(async (key) => store.get(key) || null),
    set: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    del: jest.fn(async (key) => {
      store.delete(key);
    }),
    __store: store,
  };
})();

jest.mock('../src/utils/redisClient', () => mockRedisClient);

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');
const redisClient = require('../src/utils/redisClient');

describe('loginUser rate limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.__store.clear();
    process.env.JWT_SECRET = 'testsecret';
    process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
  });

  it('locks after too many failed attempts for unknown user', async () => {
    const email = 'unknown@example.com';
    const ip = '127.0.0.1';
    userModel.findByEmail.mockResolvedValue(null);

    for (let i = 0; i < 5; i++) {
      await expect(
        authService.loginUser({ email, password: 'pass', ip })
      ).rejects.toThrow('Invalid credentials');
    }

    await expect(
      authService.loginUser({ email, password: 'pass', ip })
    ).rejects.toThrow('Too many failed login attempts. Try again later.');
  });
});


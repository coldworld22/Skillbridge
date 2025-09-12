jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
}));

jest.mock('../src/config/database', () => {
  const query = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
  };
  return jest.fn(() => query);
});

jest.mock('../src/utils/logger.js', () => ({
  error: jest.fn(),
}));

const store = {};
jest.mock('../src/utils/redisClient', () => ({
  __store: store,
  get: jest.fn((key) => Promise.resolve(store[key] || null)),
  set: jest.fn((key, val) => {
    store[key] = val;
    return Promise.resolve('OK');
  }),
  del: jest.fn((key) => {
    delete store[key];
    return Promise.resolve(1);
  }),
}));

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');
const redisClient = require('../src/utils/redisClient');

describe('auth.service.verifyOtp lockout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(redisClient.__store).forEach((k) => delete redisClient.__store[k]);
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
  });

  it('locks after too many invalid attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(
        authService.verifyOtp({ email: 'test@example.com', code: '000000' })
      ).rejects.toThrow('Invalid or expired OTP');
    }

    await expect(
      authService.verifyOtp({ email: 'test@example.com', code: '000000' })
    ).rejects.toThrow('Too many invalid OTP attempts');
  });
});


const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';

let mockUser;
let mockVerification;

jest.mock('../src/utils/redisClient', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../src/utils/otpAttempts', () => ({
  redisClient: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  logger: { error: jest.fn() },
  getOtpAttemptKey: jest.fn((id) => `otp:${id}`),
  recordFailedOtpAttempt: jest.fn(),
  clearOtpAttempts: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

const redisClient = require('../src/utils/redisClient');
const notificationService = require('../src/modules/notifications/notifications.service');
const messageService = require('../src/modules/messages/messages.service');

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
const bcrypt = require('bcrypt');

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn().mockResolvedValue([]),
  updateUser: jest.fn(),
  findByEmail: jest.fn(),
  getUserRoles: jest.fn().mockResolvedValue(['student']),
  getUserPermissions: jest.fn().mockResolvedValue([]),
}));
const userModel = require('../src/modules/users/user.model');

jest.mock('../src/config/database', () => {
  return jest.fn((table) => {
    if (table === 'users') {
      return {
        where: jest.fn(() => ({
          first: jest.fn(() => Promise.resolve(mockUser)),
          update: jest.fn((data) => {
            Object.assign(mockUser, data);
            return Promise.resolve(1);
          }),
        })),
      };
    }
    if (table === 'verifications') {
      return {
        where: jest.fn(() => ({
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          first: jest.fn(() => Promise.resolve(mockVerification)),
          update: jest.fn((data) => {
            Object.assign(mockVerification, data);
            return Promise.resolve(1);
          }),
        })),
      };
    }
    if (table === 'refresh_tokens') {
      return {
        insert: jest.fn().mockResolvedValue(1),
      };
    }
    return {
      insert: jest.fn().mockResolvedValue(1),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    };
  });
});
const db = require('../src/config/database');
db.raw = jest.fn();

const verifyService = require('../src/modules/verify/verify.service');
const authService = require('../src/modules/auth/services/auth.service');

const AppError = require('../src/utils/AppError');

describe('login after verification', () => {
  beforeEach(() => {
    mockUser = {
      id: 1,
      email: 'user@example.com',
      password_hash: 'passhash',
      is_email_verified: false,
      is_phone_verified: true,
      profile_complete: true,
      status: 'inactive',
    };
    mockVerification = {
      id: 1,
      user_id: 1,
      type: 'email',
      code: 'otpHash',
      verified: false,
      expires_at: new Date(Date.now() + 60000),
    };

    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('hash');
    userModel.findByEmail.mockImplementation(async (email) =>
      email === mockUser.email ? mockUser : null
    );
    userModel.updateUser.mockImplementation(async (id, data) => {
      Object.assign(mockUser, data);
      return [mockUser];
    });
    redisClient.get.mockResolvedValue(null);
    redisClient.set.mockResolvedValue();
    redisClient.del.mockResolvedValue();
    notificationService.createNotification.mockResolvedValue();
    messageService.createMessage.mockResolvedValue();
  });

  it('allows a user to log in after completing verification', async () => {
    await expect(
      authService.loginUser({
        email: mockUser.email,
        password: 'secret',
        ip: '1.1.1.1',
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    await verifyService.verifyOtp(1, 'email', '123456');

    expect(userModel.updateUser).toHaveBeenCalledWith(1, { status: 'active' });

    const result = await authService.loginUser({
      email: mockUser.email,
      password: 'secret',
      ip: '1.1.1.1',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user).toHaveProperty('id', 1);
  });
});


jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendOtpEmail: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/utils/logger.js', () => ({
  error: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
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

jest.mock('../src/config/database', () => {
  const usersQuery = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({
      is_email_verified: false,
      is_phone_verified: false,
      profile_complete: false,
    }),
    update: jest.fn().mockResolvedValue(1),
  };
  const verificationsQuery = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(1),
  };
  const mockDb = jest.fn((table) => {
    if (table === 'users') return usersQuery;
    if (table === 'verifications') return verificationsQuery;
    return {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    };
  });
  mockDb.raw = jest.fn();
  mockDb.__usersQuery = usersQuery;
  mockDb.__verificationsQuery = verificationsQuery;
  return mockDb;
});

const service = require('../src/modules/verify/verify.service');
const redisClient = require('../src/utils/redisClient');
const db = require('../src/config/database');
const bcrypt = require('bcrypt');
const verificationsQuery = db('verifications');

describe('verify.service.verifyOtp failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(redisClient.__store).forEach((k) => delete redisClient.__store[k]);
    verificationsQuery.first.mockResolvedValue(null);
  });

  it('returns 400 when verification record not found', async () => {
    await expect(service.verifyOtp(1, 'email', '000000')).rejects.toMatchObject({
      message: 'Invalid or expired OTP',
      statusCode: 400,
    });
  });

  it('returns 400 when code does not match', async () => {
    verificationsQuery.first.mockResolvedValue({
      id: 1,
      code: 'hash',
      verified: false,
    });
    bcrypt.compare.mockResolvedValue(false);
    await expect(service.verifyOtp(1, 'email', '111111')).rejects.toMatchObject({
      message: 'Invalid or expired OTP',
      statusCode: 400,
    });
    expect(redisClient.set).toHaveBeenCalled();
  });

  it('locks after too many invalid attempts', async () => {
    db.__verificationsQuery.first.mockResolvedValue(null);
    for (let i = 0; i < 5; i++) {
      await expect(service.verifyOtp(1, 'email', '000000')).rejects.toMatchObject({
        message: 'Invalid or expired OTP',
        statusCode: 400,
      });
    }

    await expect(service.verifyOtp(1, 'email', '000000')).rejects.toMatchObject({
      message: 'Too many invalid OTP attempts. Try again later.',
      statusCode: 429,
    });
  });
});

describe('verify.service.verifyOtp success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(redisClient.__store).forEach((k) => delete redisClient.__store[k]);
  });

  it('activates user when both email and phone are verified', async () => {
    // First call returns user with email verified but phone unverified
    db.__usersQuery.first
      .mockResolvedValueOnce({
        is_email_verified: true,
        is_phone_verified: false,
        status: 'pending',
        profile_complete: false,
      })
      .mockResolvedValueOnce({
        is_email_verified: true,
        is_phone_verified: true,
        status: 'pending',
        profile_complete: false,
      });

    db.__verificationsQuery.first.mockResolvedValue({
      id: 1,
      code: 'hash',
      verified: false,
    });

    bcrypt.compare.mockResolvedValue(true);

    await service.verifyOtp(1, 'phone', '123456');

    expect(db.__usersQuery.update).toHaveBeenNthCalledWith(1, {
      is_phone_verified: true,
    });
    expect(db.__usersQuery.update).toHaveBeenNthCalledWith(2, {
      status: 'active',
    });
  });
});


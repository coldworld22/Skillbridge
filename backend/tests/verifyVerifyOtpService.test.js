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
    first: jest.fn(),
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

describe('verify.service.verifyOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(redisClient.__store).forEach((k) => delete redisClient.__store[k]);
    db.__verificationsQuery.first.mockReset();
  });

  it('clears attempts on successful verification', async () => {
    const hashed = await bcrypt.hash('123456', 12);
    db.__verificationsQuery.first.mockResolvedValue({
      id: 'v1',
      user_id: 1,
      type: 'email',
      code: hashed,
      expires_at: new Date(Date.now() + 60000),
      verified: false,
    });

    const attemptKey = 'otpAttempt:1:email';
    redisClient.__store[attemptKey] = JSON.stringify({ count: 1, lockUntil: null });

    const result = await service.verifyOtp(1, 'email', '123456');
    expect(result).toEqual({ alreadyVerified: false });
    expect(redisClient.del).toHaveBeenCalledWith(attemptKey);
  });

  it('locks after too many invalid attempts', async () => {
    db.__verificationsQuery.first.mockResolvedValue(null);
    for (let i = 0; i < 5; i++) {
      await expect(service.verifyOtp(1, 'email', '000000')).rejects.toThrow(
        'Invalid or expired OTP'
      );
    }

    await expect(service.verifyOtp(1, 'email', '000000')).rejects.toThrow(
      'Too many invalid OTP attempts'
    );
  });
});


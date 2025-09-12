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
  return mockDb;
});

const service = require('../src/modules/verify/verify.service');
const redisClient = require('../src/utils/redisClient');

describe('verify.service.verifyOtp lockout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(redisClient.__store).forEach((k) => delete redisClient.__store[k]);
  });

  it('locks after too many invalid attempts', async () => {
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


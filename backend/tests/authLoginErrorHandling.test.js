jest.mock('../src/config/database', () => {
  const mockDb = jest.fn((table) => {
    if (table === 'refresh_tokens') {
      return { insert: jest.fn().mockResolvedValue() };
    }
    return {};
  });
  mockDb.transaction = jest.fn(async (cb) => cb(mockDb));
  mockDb.fn = { now: jest.fn() };
  return mockDb;
});

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
  updateUser: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
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
  hash: jest.fn().mockResolvedValue('hashedpw'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/utils/logger.js', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');
const notificationService = require('../src/modules/notifications/notifications.service');
const logger = require('../src/utils/logger.js');

describe('loginUser error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
    process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
  });

  it('returns tokens even if updateUser fails', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'active',
    };
    userModel.findByEmail.mockResolvedValue({ ...mockUser });
    userModel.updateUser.mockRejectedValue(new Error('db fail'));
    userModel.getUserRoles.mockResolvedValue([]);
    userModel.getUserPermissions.mockResolvedValue([]);

    const res = await authService.loginUser({
      email: 'test@example.com',
      password: 'pass',
    });

    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toBeTruthy();
    expect(res.user.id).toBe(1);
    expect(res.user.password_hash).toBeUndefined();
    expect(res.user.is_online).toBe(true);
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns tokens even if notification creation fails', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'active',
    };
    userModel.findByEmail.mockResolvedValue({ ...mockUser });
    userModel.updateUser.mockResolvedValue({});
    userModel.getUserRoles.mockResolvedValue([]);
    userModel.getUserPermissions.mockResolvedValue([]);
    notificationService.createNotification.mockRejectedValue(
      new Error('notify fail'),
    );

    const res = await authService.loginUser({
      email: 'test@example.com',
      password: 'pass',
    });

    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toBeTruthy();
    expect(res.user.id).toBe(1);
    expect(res.user.password_hash).toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});


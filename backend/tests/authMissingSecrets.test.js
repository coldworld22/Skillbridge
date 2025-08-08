const jwt = require('jsonwebtoken');

// Mock database and dependencies to avoid side effects
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
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password_hash: 'hashedpw',
  role: 'Student',
  status: 'active',
};

describe('loginUser token secret validation', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('fails when JWT_SECRET is missing', async () => {
    process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
    delete process.env.JWT_SECRET;

    const authService = require('../src/modules/auth/services/auth.service');
    const userModel = require('../src/modules/users/user.model');
    userModel.findByEmail.mockResolvedValue({ ...mockUser });
    userModel.updateUser.mockResolvedValue();
    userModel.getUserRoles.mockResolvedValue([]);

    await expect(
      authService.loginUser({ email: 'test@example.com', password: 'pass' })
    ).rejects.toThrow('Missing environment variable(s): JWT_SECRET');
  });

  it('fails when REFRESH_TOKEN_SECRET is missing', async () => {
    process.env.JWT_SECRET = 'testsecret';
    delete process.env.REFRESH_TOKEN_SECRET;

    const authService = require('../src/modules/auth/services/auth.service');
    const userModel = require('../src/modules/users/user.model');
    userModel.findByEmail.mockResolvedValue({ ...mockUser });
    userModel.updateUser.mockResolvedValue();
    userModel.getUserRoles.mockResolvedValue([]);

    await expect(
      authService.loginUser({ email: 'test@example.com', password: 'pass' })
    ).rejects.toThrow('Missing environment variable(s): REFRESH_TOKEN_SECRET');
  });
});

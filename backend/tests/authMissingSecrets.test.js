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

const ORIGINAL_ENV = { ...process.env };

describe('loginUser token secret validation', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      JWT_SECRET: 'testsecret',
      REFRESH_TOKEN_SECRET: 'refreshsecret',
      SESSION_SECRET: 'sessionsecret',
    };
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('fails when JWT_SECRET is missing', async () => {
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

  it('fails when JWT_SECRET is blank', () => {
    process.env.JWT_SECRET = '   ';

    expect(() => require('../src/config/env')).toThrow(
      'JWT_SECRET must not be empty'
    );
  });

  it('fails when REFRESH_TOKEN_SECRET is blank', () => {
    process.env.REFRESH_TOKEN_SECRET = '   ';

    expect(() => require('../src/config/env')).toThrow(
      'REFRESH_TOKEN_SECRET must not be empty'
    );
  });

  it('fails when SESSION_SECRET is blank', () => {
    process.env.SESSION_SECRET = '   ';

    expect(() => require('../src/config/env')).toThrow(
      'SESSION_SECRET must not be empty'
    );
  });
});

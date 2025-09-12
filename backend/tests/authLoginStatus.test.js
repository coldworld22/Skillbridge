jest.mock('../src/config/database', () => ({
  fn: { now: jest.fn() },
}));

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
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashedpw'),
}));

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');

describe('loginUser status flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
    process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
  });

  it('rejects pending users with verification message', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'pending',
      is_email_verified: false,
      is_phone_verified: false,
    });

    await expect(
      authService.loginUser({ email: 'a@example.com', password: 'pass' })
    ).rejects.toThrow(/verify your email and phone/i);
  });

  it('rejects partially verified users with verification message', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 'u2',
      email: 'b@example.com',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'pending',
      is_email_verified: true,
      is_phone_verified: false,
    });

    await expect(
      authService.loginUser({ email: 'b@example.com', password: 'pass' })
    ).rejects.toThrow(/verify your email and phone/i);
  });

  it('allows active users to login', async () => {
    const activeUser = {
      id: 'u3',
      email: 'c@example.com',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'active',
    };
    userModel.findByEmail.mockResolvedValue({ ...activeUser });
    userModel.updateUser.mockResolvedValue([activeUser]);
    userModel.getUserRoles.mockResolvedValue([]);
    userModel.getUserPermissions.mockResolvedValue([]);

    const issueSpy = jest
      .spyOn(authService, 'issueRefreshToken')
      .mockResolvedValue('refresh');

    const result = await authService.loginUser({
      email: 'c@example.com',
      password: 'pass',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user).toBeDefined();
    issueSpy.mockRestore();
  });
});

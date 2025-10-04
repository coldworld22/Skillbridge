jest.mock('../src/modules/verify/verify.service', () => ({
  verifyOtp: jest.fn(),
}));

process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://user:pass@localhost:5432/testdb';

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn(),
  updateUser: jest.fn(),
}));

const authService = require('../src/modules/auth/services/auth.service');
const verificationService = require('../src/modules/verify/verify.service');
const userModel = require('../src/modules/users/user.model');

describe('confirmVerificationOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('activates user immediately after email verification', async () => {
    verificationService.verifyOtp.mockResolvedValue({ alreadyVerified: false });
    userModel.findById.mockResolvedValue({
      id: 1,
      is_email_verified: true,
      is_phone_verified: false,
      status: 'pending',
    });

    await authService.confirmVerificationOtp({ user_id: 1, type: 'email', code: '123456' });

    expect(verificationService.verifyOtp).toHaveBeenCalledWith(1, 'email', '123456');
    expect(userModel.updateUser).toHaveBeenCalledWith(1, { status: 'active' });
  });

  it('does not activate user if both verifications are not complete', async () => {
    verificationService.verifyOtp.mockResolvedValue({ alreadyVerified: false });
    userModel.findById.mockResolvedValue({
      id: 1,
      is_email_verified: true,
      is_phone_verified: false,
      status: 'pending',
    });

    await authService.confirmVerificationOtp({ user_id: 1, type: 'phone', code: '123456' });

    expect(userModel.updateUser).not.toHaveBeenCalled();
  });

  it('activates user after phone verification when both are verified', async () => {
    verificationService.verifyOtp.mockResolvedValue({ alreadyVerified: false });
    userModel.findById.mockResolvedValue({
      id: 1,
      is_email_verified: true,
      is_phone_verified: true,
      status: 'pending',
    });

    await authService.confirmVerificationOtp({ user_id: 1, type: 'phone', code: '123456' });

    expect(userModel.updateUser).toHaveBeenCalledWith(1, { status: 'active' });
  });
});

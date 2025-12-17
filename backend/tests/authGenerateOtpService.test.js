jest.mock('../src/config/database', () => {
  const insert = jest.fn().mockResolvedValue();
  const mockDb = jest.fn((table) => {
    if (table === 'password_resets') {
      return { insert };
    }
    return {};
  });
  mockDb.raw = jest.fn();
  mockDb.fn = { now: jest.fn() };
  return mockDb;
});

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendOtpEmail: jest.fn(),
  sendPasswordChangeEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendNewUserAdminEmail: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/modules/verify/verify.service', () => ({
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');
const { sendOtpEmail } = require('../src/utils/email');
const smsService = require('../src/services/smsService');

describe('generateOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws error when phone is unverified for SMS OTP', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      phone: '+1234567890',
      is_phone_verified: false,
    });

    await expect(authService.generateOtp('test@example.com', 'sms')).rejects.toThrow(
      'A verified phone number is required before SMS OTPs can be sent'
    );

    expect(sendOtpEmail).not.toHaveBeenCalled();
    expect(smsService.sendSMS).not.toHaveBeenCalled();
  });

  it('throws error when phone is missing for SMS OTP', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      phone: null,
      is_phone_verified: false,
    });

    await expect(authService.generateOtp('test@example.com', 'sms')).rejects.toThrow(
      'A verified phone number is required before SMS OTPs can be sent'
    );

    expect(sendOtpEmail).not.toHaveBeenCalled();
    expect(smsService.sendSMS).not.toHaveBeenCalled();
  });
});

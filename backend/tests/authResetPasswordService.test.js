jest.mock('../src/config/database', () => {
  const passwordResetsTable = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue([{ id: 1, code_hash: 'otp_hash' }]),
    update: jest.fn().mockResolvedValue(),
  };

  const usersTable = {
    where: jest.fn().mockReturnValue({
      update: jest.fn().mockResolvedValue(),
    }),
  };

  const refreshTokensWhere = { del: jest.fn().mockResolvedValue() };
  const refreshTokensTable = {
    where: jest.fn().mockReturnValue(refreshTokensWhere),
  };

  const db = jest.fn((table) => {
    if (table === 'password_resets') return passwordResetsTable;
    if (table === 'users') return usersTable;
    if (table === 'refresh_tokens') return refreshTokensTable;
    return {};
  });
  db.__tables = {
    passwordResetsTable,
    usersTable,
    refreshTokensTable,
    refreshTokensWhere,
  };

  return db;
});

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendPasswordChangeEmail: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/modules/auth/utils/sanitizeUser', () => jest.fn((u) => ({ id: u.id, email: u.email })));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../src/services/tokenBlacklistService', () => ({
  addToken: jest.fn(),
}));

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');
const { sendPasswordChangeEmail } = require('../src/utils/email');
const notificationService = require('../src/modules/notifications/notifications.service');
const messageService = require('../src/modules/messages/messages.service');
const bcrypt = require('bcrypt');
const db = require('../src/config/database');
const { addToken } = require('../src/services/tokenBlacklistService');

describe('resetPassword service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { passwordResetsTable } = db.__tables;
    passwordResetsTable.select.mockResolvedValue([{ id: 1, code_hash: 'otp_hash' }]);
  });

  it('sends notification but not self message', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: 'old_hash',
    });

    bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    bcrypt.hash.mockResolvedValue('new_hash');

    const result = await authService.resetPassword({
      email: 'test@example.com',
      code: '123456',
      new_password: 'NewPass1!',
    });

    expect(sendPasswordChangeEmail).toHaveBeenCalledWith('test@example.com');
    expect(notificationService.createNotification).toHaveBeenCalledWith({
      user_id: 1,
      type: 'security',
      message: 'Your password was changed successfully',
    });
    expect(messageService.createMessage).not.toHaveBeenCalled();
    const { refreshTokensTable, refreshTokensWhere } = db.__tables;
    // Ensure refresh tokens were revoked
    expect(refreshTokensTable.where).toHaveBeenCalledWith({ user_id: 1 });
    expect(refreshTokensWhere.del).toHaveBeenCalled();
    expect(addToken).not.toHaveBeenCalled();
    expect(result).toEqual({
      user: { id: 1, email: 'test@example.com' },
      warnings: [],
    });
  });
  it('blacklists provided access token', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: 'old_hash',
    });

    bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    bcrypt.hash.mockResolvedValue('new_hash');

    const accessToken = 'access123';

    await authService.resetPassword({
      email: 'test@example.com',
      code: '123456',
      new_password: 'NewPass1!',
      accessToken,
    });

    expect(addToken).toHaveBeenCalledWith(accessToken);
  });

  it('returns warnings when email and notification fail', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 2,
      email: 'warn@example.com',
      password_hash: 'old_hash',
    });

    bcrypt.compare
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    bcrypt.hash.mockResolvedValue('new_hash');

    sendPasswordChangeEmail.mockRejectedValueOnce(new Error('smtp down'));
    notificationService.createNotification.mockRejectedValueOnce(
      new Error('db down'),
    );

    const result = await authService.resetPassword({
      email: 'warn@example.com',
      code: '123456',
      new_password: 'NewPass1!',
    });

    expect(result.warnings).toEqual([
      {
        type: 'email',
        message:
          'Password reset succeeded, but the confirmation email could not be sent.',
      },
      {
        type: 'notification',
        message:
          'Password reset succeeded, but the security notification could not be recorded.',
      },
    ]);
  });

  it('accepts a valid OTP that is not the newest record', async () => {
    const { passwordResetsTable } = db.__tables;

    userModel.findByEmail.mockResolvedValue({
      id: 3,
      email: 'multi@example.com',
      password_hash: 'old_hash',
    });

    passwordResetsTable.select.mockResolvedValueOnce([
      { id: 10, code_hash: 'old_hash_value' },
      { id: 11, code_hash: 'otp_hash' },
    ]);

    bcrypt.compare
      .mockResolvedValueOnce(false) // first record mismatch
      .mockResolvedValueOnce(true) // second record match
      .mockResolvedValueOnce(false); // new password differs from old

    bcrypt.hash.mockResolvedValue('new_hash');

    await authService.resetPassword({
      email: 'multi@example.com',
      code: '654321',
      new_password: 'Another1!',
    });

    // Ensure the matching record was marked as used
    expect(passwordResetsTable.where).toHaveBeenCalledWith({ id: 11 });
    expect(passwordResetsTable.update).toHaveBeenCalledWith({ used: true });
  });
});

describe('verifyOtp service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { passwordResetsTable } = db.__tables;
    passwordResetsTable.select.mockResolvedValue([{ id: 1, code_hash: 'otp_hash' }]);
  });

  it('returns true when a non-latest OTP matches', async () => {
    const { passwordResetsTable } = db.__tables;

    userModel.findByEmail.mockResolvedValue({
      id: 5,
      email: 'verify@example.com',
    });

    passwordResetsTable.select.mockResolvedValueOnce([
      { id: 21, code_hash: 'first_hash' },
      { id: 22, code_hash: 'otp_hash' },
    ]);

    bcrypt.compare
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const result = await authService.verifyOtp({
      email: 'verify@example.com',
      code: '222222',
    });

    expect(result).toBe(true);
  });
});

jest.mock('../src/config/database', () => {
  const passwordResetsTable = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 1, code_hash: 'otp_hash' }),
    update: jest.fn().mockResolvedValue(),
  };

  const usersTable = {
    where: jest.fn().mockReturnValue({
      update: jest.fn().mockResolvedValue(),
    }),
  };

  const db = jest.fn((table) => {
    if (table === 'password_resets') return passwordResetsTable;
    if (table === 'users') return usersTable;
    return {};
  });

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

jest.mock('../src/modules/auth/utils/sanitizeUser', () => jest.fn((u) => u));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');
const { sendPasswordChangeEmail } = require('../src/utils/email');
const notificationService = require('../src/modules/notifications/notifications.service');
const messageService = require('../src/modules/messages/messages.service');
const bcrypt = require('bcrypt');

describe('resetPassword service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends notification but not self message', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: 'old_hash',
    });

    bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    bcrypt.hash.mockResolvedValue('new_hash');

    await authService.resetPassword({
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
  });
});

jest.mock('../src/config/database', () => {
  const passwordResetsTable = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    first: jest.fn(),
  };
  const db = jest.fn((table) => {
    if (table === 'password_resets') return passwordResetsTable;
    return {};
  });
  db.passwordResetsTable = passwordResetsTable;
  return db;
});

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
}));

jest.mock('../src/utils/redisClient', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const authService = require('../src/modules/auth/services/auth.service');
const userModel = require('../src/modules/users/user.model');
const redisClient = require('../src/utils/redisClient');
const bcrypt = require('bcrypt');
const db = require('../src/config/database');
const passwordResetsTable = db.passwordResetsTable;

describe('verifyOtp retry counter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('locks out known email after too many failed attempts', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
    redisClient.get.mockResolvedValue(
      JSON.stringify({ count: 5, lockUntil: Date.now() + 10000 })
    );

    await expect(
      authService.verifyOtp({ email: 'test@example.com', code: '123456' })
    ).rejects.toMatchObject({ statusCode: 429 });

    expect(passwordResetsTable.first).not.toHaveBeenCalled();
  });

  it('increments counter on failed attempt for known email', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
    redisClient.get.mockResolvedValue(
      JSON.stringify({ count: 1, lockUntil: null })
    );
    passwordResetsTable.first.mockResolvedValue({ id: 2, code_hash: 'hash' });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.verifyOtp({ email: 'test@example.com', code: 'wrong' })
    ).rejects.toMatchObject({ message: expect.stringMatching(/invalid/i) });

    expect(redisClient.set).toHaveBeenCalled();
    const setArgs = redisClient.set.mock.calls[0];
    const info = JSON.parse(setArgs[1]);
    expect(info.count).toBe(2);
  });

  it('clears counter on success for known email', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
    redisClient.get.mockResolvedValue(null);
    passwordResetsTable.first.mockResolvedValue({ id: 3, code_hash: 'hash' });
    bcrypt.compare.mockResolvedValue(true);

    await authService.verifyOtp({ email: 'test@example.com', code: '123456' });

    expect(redisClient.del).toHaveBeenCalled();
  });

  it('locks out unknown email after too many attempts', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    redisClient.get.mockResolvedValue(
      JSON.stringify({ count: 5, lockUntil: Date.now() + 10000 })
    );

    await expect(
      authService.verifyOtp({ email: 'ghost@example.com', code: '123456' })
    ).rejects.toMatchObject({ statusCode: 429 });

    expect(passwordResetsTable.first).not.toHaveBeenCalled();
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  it('records failed attempt for unknown email', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    redisClient.get.mockResolvedValue(
      JSON.stringify({ count: 1, lockUntil: null })
    );

    await expect(
      authService.verifyOtp({ email: 'ghost@example.com', code: '123456' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(redisClient.set).toHaveBeenCalled();
    const setArgs = redisClient.set.mock.calls[0];
    const info = JSON.parse(setArgs[1]);
    expect(info.count).toBe(2);
  });
});

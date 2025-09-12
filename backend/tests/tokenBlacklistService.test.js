const crypto = require('crypto');
const mockIgnore = jest.fn();
const mockOnConflict = jest.fn(() => ({ ignore: mockIgnore }));
const mockInsert = jest.fn(() => ({ onConflict: mockOnConflict }));
const mockFirst = jest.fn();
const mockDel = jest.fn();
const mockAndWhere = jest.fn(() => ({ first: mockFirst, del: mockDel }));
const mockWhere = jest.fn(() => ({ andWhere: mockAndWhere, first: mockFirst, del: mockDel }));
const mockDb = jest.fn(() => ({ insert: mockInsert, where: mockWhere }));

jest.mock('../src/config/database.js', () => mockDb);

mockDb.fn = { now: jest.fn(() => new Date()) };

const mockLogger = {
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../src/utils/logger.js', () => mockLogger);

const { addToken, isTokenBlacklisted, removeExpiredTokens } = require('../src/services/tokenBlacklistService');

describe('tokenBlacklistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('addToken hashes token before storing', async () => {
    mockIgnore.mockResolvedValueOnce();
    await addToken('tok');
    const hash = crypto.createHash('sha256').update('tok').digest('hex');
    expect(mockInsert).toHaveBeenCalledWith({ token_hash: hash, expires_at: null });
    expect(mockOnConflict).toHaveBeenCalledWith('token_hash');
  });

  test('addToken logs and rethrows on failure', async () => {
    const err = new Error('db fail');
    mockIgnore.mockRejectedValueOnce(err);

    await expect(addToken('tok')).rejects.toThrow('db fail');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to add token to blacklist:',
      err
    );
  });

  test('isTokenBlacklisted propagates database errors', async () => {
    const err = new Error('query fail');
    mockFirst.mockRejectedValueOnce(err);

    await expect(isTokenBlacklisted('tok')).rejects.toThrow('query fail');
  });

  test('removeExpiredTokens purges old entries', async () => {
    await removeExpiredTokens();
    expect(mockWhere).toHaveBeenCalledWith('expires_at', '<', expect.anything());
    expect(mockDel).toHaveBeenCalled();
  });
});

const mockIgnore = jest.fn();
const mockOnConflict = jest.fn(() => ({ ignore: mockIgnore }));
const mockInsert = jest.fn(() => ({ onConflict: mockOnConflict }));
const mockFirst = jest.fn();
const mockWhere = jest.fn(() => ({ first: mockFirst }));
const mockDb = jest.fn(() => ({ insert: mockInsert, where: mockWhere }));

jest.mock('../src/config/database.js', () => mockDb);

const mockLogger = {
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../src/utils/logger.js', () => mockLogger);

const { addToken, isTokenBlacklisted } = require('../src/services/tokenBlacklistService');
const crypto = require('crypto');

describe('tokenBlacklistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('addToken hashes token before storing', async () => {
    mockIgnore.mockResolvedValueOnce();
    await addToken('tok');
    const hash = crypto.createHash('sha256').update('tok').digest('hex');
    expect(mockInsert).toHaveBeenCalledWith({ token_hash: hash });
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

  test('isTokenBlacklisted hashes token for lookup', async () => {
    const hash = crypto.createHash('sha256').update('tok').digest('hex');
    mockFirst.mockResolvedValueOnce({ token_hash: hash });
    const result = await isTokenBlacklisted('tok');
    expect(mockWhere).toHaveBeenCalledWith({ token_hash: hash });
    expect(result).toBe(true);
  });
});

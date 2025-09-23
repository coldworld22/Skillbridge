const jwt = require('jsonwebtoken');

jest.mock('../src/config/database', () => {
  const mockInsert = jest.fn().mockResolvedValue();
  const handler = jest.fn((table) => {
    if (table === 'refresh_tokens') {
      return { insert: mockInsert };
    }
    return {
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
      andWhere: jest.fn().mockReturnThis(),
      andWhereRaw: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };
  });
  handler.transaction = jest.fn(async (cb) => cb(handler));
  handler.fn = { now: jest.fn() };
  handler.raw = jest.fn();
  handler.mockInsert = mockInsert;
  return handler;
});

jest.mock('../src/services/tokenBlacklistService', () => ({
  addToken: jest.fn(),
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  updateUser: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  getAllPermissionCodes: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../src/utils/logger.js', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';

const authService = require('../src/modules/auth/services/auth.service');
const authMiddleware = require('../src/middleware/auth/authMiddleware');
const userModel = require('../src/modules/users/user.model');

describe('primary role resolution', () => {
  const baseUser = {
    id: 99,
    email: 'admin@example.com',
    password_hash: 'hashedpw',
    role: 'Student',
    status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
    process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
    userModel.findByEmail.mockResolvedValue({ ...baseUser });
    userModel.findById.mockResolvedValue({ ...baseUser });
    userModel.updateUser.mockResolvedValue();
    userModel.getUserRoles.mockResolvedValue(['Student', 'SuperAdmin']);
    userModel.getUserPermissions.mockResolvedValue([]);
    userModel.getAllPermissionCodes.mockResolvedValue(['perm']);
  });

  it('returns the elevated role in login payload and tokens', async () => {
    const result = await authService.loginUser({
      email: baseUser.email,
      password: 'Password1!',
    });

    expect(result.user.role).toBe('SuperAdmin');
    expect(result.user.roles).toEqual(['Student', 'SuperAdmin']);

    const decodedAccess = jwt.verify(result.accessToken, process.env.JWT_SECRET);
    expect(decodedAccess.role).toBe('SuperAdmin');
    expect(decodedAccess.roles).toEqual(['Student', 'SuperAdmin']);

    const decodedRefresh = jwt.verify(
      result.refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(decodedRefresh.role).toBe('SuperAdmin');
    expect(decodedRefresh.roles).toEqual(['Student', 'SuperAdmin']);
  });

  it('preserves admin access for elevated users during middleware checks', async () => {
    const { accessToken } = await authService.loginUser({
      email: baseUser.email,
      password: 'Password1!',
    });

    const req = {
      headers: { authorization: `Bearer ${accessToken}` },
      cookies: {},
    };
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json };
    const next = jest.fn();

    await authMiddleware.verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe('SuperAdmin');
    expect(req.user.roles).toEqual(['Student', 'SuperAdmin']);

    const adminNext = jest.fn();
    const adminRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    authMiddleware.isAdmin(req, adminRes, adminNext);
    expect(adminNext).toHaveBeenCalled();
  });
});

jest.mock('../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const mockRedisClient = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(),
  del: jest.fn().mockResolvedValue(),
};
jest.mock('../src/utils/redisClient', () => mockRedisClient);

const mockNotificationService = {
  createNotification: jest.fn().mockResolvedValue(),
};
jest.mock('../src/modules/notifications/notifications.service', () => mockNotificationService);

const mockSanitizeUser = jest.fn((user) => ({ id: user.id, role: user.role }));
jest.mock('../src/modules/auth/utils/sanitizeUser', () => mockSanitizeUser);

const mockUserModel = {
  findByEmail: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  updateUser: jest.fn().mockResolvedValue([]),
};
jest.mock('../src/modules/users/user.model', () => mockUserModel);

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-jti') }));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'signed-jwt'),
  verify: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed-token'),
}));

let mockUserRows = [];
let mockSocialLinks = [];
const refreshInsertMock = jest.fn().mockResolvedValue();

const makeChain = (rows = []) => {
  const select = jest.fn().mockResolvedValue(rows);
  const first = jest.fn().mockResolvedValue(rows[0] || null);
  const update = jest.fn().mockResolvedValue(rows);
  const del = jest.fn().mockResolvedValue();
  return { select, first, update, del };
};

const mockDb = jest.fn((table) => {
  if (table === 'refresh_tokens') {
    return { insert: refreshInsertMock };
  }
  if (table === 'users') {
    return { where: jest.fn(() => makeChain(mockUserRows)) };
  }
  if (table === 'user_social_links') {
    return { where: jest.fn(() => makeChain(mockSocialLinks)) };
  }
  return {
    where: jest.fn(() => makeChain([])),
    insert: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(),
  };
});

jest.mock('../src/config/database', () => mockDb);

const authServicePath = '../src/modules/auth/services/auth.service';
const profileControllerPath = '../src/modules/users/profile.controller';

describe('SuperAdmin canonical role hydration', () => {
  beforeEach(() => {
    jest.resetModules();
    mockUserRows = [];
    mockSocialLinks = [];
    refreshInsertMock.mockClear();
    Object.values(mockRedisClient).forEach((fn) => fn.mockClear?.());
    Object.values(mockNotificationService).forEach((fn) => fn.mockClear?.());
    mockSanitizeUser.mockClear();
    Object.values(mockUserModel).forEach((fn) => fn.mockClear?.());
    const jwt = require('jsonwebtoken');
    jwt.sign.mockClear();
    const bcryptMock = require('bcrypt');
    bcryptMock.compare.mockClear();
    bcryptMock.hash.mockClear();
    process.env.JWT_SECRET = 'test';
    process.env.REFRESH_TOKEN_SECRET = 'refresh';
  });

  it('returns canonical role from user_roles during login', async () => {
    const authService = require(authServicePath);
    const user = {
      id: 42,
      email: 'admin@example.com',
      password_hash: 'hash',
      status: 'active',
      role: 'Student',
    };
    mockUserModel.findByEmail.mockResolvedValue(user);
    mockUserModel.getUserRoles.mockResolvedValue(['SuperAdmin']);
    mockUserModel.getUserPermissions.mockResolvedValue(['manage_everything']);

    const result = await authService.loginUser({ email: user.email, password: 'Secret123!', ip: '127.0.0.1' });

    expect(result.user.roles).toEqual(['SuperAdmin']);
    expect(result.user.role).toBe('SuperAdmin');
    expect(mockSanitizeUser).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
  });

  it('getFullProfile preserves canonical role despite base user role mismatch', async () => {
    mockUserRows = [
      {
        id: 7,
        full_name: 'Super Admin',
        email: 'super@admin.test',
        phone: '1234567890',
        role: 'Student',
        gender: null,
        date_of_birth: null,
        avatar_url: null,
        is_email_verified: true,
        is_phone_verified: true,
        is_online: true,
        profile_complete: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    mockSocialLinks = [{ platform: 'github', url: 'https://github.com/super' }];

    const { getFullProfile } = require(profileControllerPath);
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    const req = {
      user: {
        id: 7,
        role: 'SuperAdmin',
        roles: ['SuperAdmin'],
        permissions: ['manage_everything'],
      },
    };

    await getFullProfile(req, { json, status });

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        role: 'SuperAdmin',
        roles: ['SuperAdmin'],
      })
    );
  });
});

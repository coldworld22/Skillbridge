process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
process.env.SESSION_SECRET = 'sessionsecret';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

jest.mock('../src/modules/auth/services/auth.service', () => ({
  loginUser: jest.fn(),
  rotateRefreshToken: jest.fn(),
  generateAccessToken: jest.fn(),
}));

jest.mock('../src/modules/socialLoginConfig/socialLoginConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue({ recaptcha: { active: false } }),
}));

jest.mock('../src/modules/recaptcha/recaptcha.service', () => ({
  verify: jest.fn(),
  shouldBypass: jest.fn(() => true),
}));

jest.mock('../src/utils/logger.js', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const authController = require('../src/modules/auth/controllers/auth.controller');
const authService = require('../src/modules/auth/services/auth.service');

describe('auth controller CSRF resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles csrf token generation failure during login', async () => {
    authService.loginUser.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 1 },
    });

    const req = {
      body: { email: 'user@example.com', password: 'Pass123!' },
      ip: '127.0.0.1',
      csrfToken: jest.fn(() => {
        throw new Error('csrf failed');
      }),
    };

    const res = {
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authController.login(req, res, next);
    await new Promise(setImmediate);

    expect(next).not.toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh',
      expect.any(Object)
    );
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Login successful',
      accessToken: 'access',
      user: { id: 1 },
    });
  });

  it('handles csrf token generation failure during refresh', async () => {
    authService.rotateRefreshToken.mockResolvedValue({
      decoded: { id: 2, role: 'User', roles: ['User'] },
      refreshToken: 'newRefresh',
    });
    authService.generateAccessToken.mockReturnValue('newAccess');

    const req = {
      cookies: { refreshToken: 'oldRefresh' },
      csrfToken: jest.fn(() => {
        throw new Error('csrf failed');
      }),
    };

    const res = {
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await authController.refreshToken(req, res, next);
    await new Promise(setImmediate);

    expect(next).not.toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'newRefresh',
      expect.any(Object)
    );
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token refreshed',
      accessToken: 'newAccess',
    });
  });
});


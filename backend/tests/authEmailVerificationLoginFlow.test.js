const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://user:pass@localhost:5432/testdb';

let mockUser;
let mockRefreshTokenTableInsert;

jest.mock('../src/config/database', () => {
  const roleTable = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 2 }),
  };
  const userRolesTable = {
    insert: jest.fn().mockResolvedValue(),
  };
  const refreshTokensTable = {
    insert: jest.fn().mockImplementation(async (...args) => {
      mockRefreshTokenTableInsert?.(...args);
      return 1;
    }),
  };

  const genericTable = {
    insert: jest.fn().mockResolvedValue(1),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(1),
  };

  const db = jest.fn((table) => {
    if (table === 'roles') return roleTable;
    if (table === 'user_roles') return userRolesTable;
    if (table === 'refresh_tokens') return refreshTokensTable;
    return genericTable;
  });

  db.transaction = jest.fn(async (cb) => cb(db));
  db.raw = jest.fn();
  db.fn = { now: jest.fn() };
  db.__tables = { roleTable, userRolesTable, refreshTokensTable, genericTable };
  return db;
});

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  insertUser: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  findAdmins: jest.fn(),
  updateUser: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendOtpEmail: jest.fn(),
  sendPasswordChangeEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendNewUserAdminEmail: jest.fn(),
}));

jest.mock('../src/utils/redisClient', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../src/modules/verify/verify.service', () => ({
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));

jest.mock('../src/modules/socialLoginConfig/socialLoginConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue({ recaptcha: { active: false } }),
}));

jest.mock('../src/modules/recaptcha/recaptcha.service', () => ({
  shouldBypass: jest.fn().mockReturnValue(true),
  verify: jest.fn().mockResolvedValue(true),
}));

const authService = require('../src/modules/auth/services/auth.service');
const authController = require('../src/modules/auth/controllers/auth.controller');
const userModel = require('../src/modules/users/user.model');
const verificationService = require('../src/modules/verify/verify.service');
const redisClient = require('../src/utils/redisClient');
const notificationService = require('../src/modules/notifications/notifications.service');
const messageService = require('../src/modules/messages/messages.service');
const emailUtils = require('../src/utils/email');
const db = require('../src/config/database');

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (value) => `hashed:${value}`),
  compare: jest.fn(async (value, hashed) => hashed === `hashed:${value}`),
}));

const bcrypt = require('bcrypt');

describe('Email verification activates account for login', () => {
  let app;
  let setImmediateSpy;

  beforeAll(() => {
    setImmediateSpy = jest.spyOn(global, 'setImmediate').mockImplementation((fn, ...args) => {
      fn(...args);
    });
  });

  afterAll(() => {
    setImmediateSpy.mockRestore();
  });

  beforeEach(() => {
    mockUser = null;
    mockRefreshTokenTableInsert = jest.fn();

    userModel.findByEmail.mockImplementation(async (email) =>
      mockUser && mockUser.email === email ? mockUser : null
    );
    userModel.findByPhone.mockResolvedValue(null);
    userModel.findAdmins.mockResolvedValue([]);
    userModel.insertUser.mockImplementation(async (data) => {
      mockUser = {
        id: 1,
        ...data,
      };
      return [mockUser];
    });
    userModel.getUserRoles.mockResolvedValue(['Student']);
    userModel.getUserPermissions.mockResolvedValue([]);
    userModel.updateUser.mockImplementation(async (id, data) => {
      if (mockUser && mockUser.id === id) {
        Object.assign(mockUser, data);
      }
      return [mockUser];
    });
    userModel.findById.mockImplementation(async (id) =>
      mockUser && mockUser.id === id ? mockUser : null
    );

    verificationService.sendOtp.mockResolvedValue({ alreadyVerified: false });
    verificationService.verifyOtp.mockImplementation(async () => ({ alreadyVerified: false }));

    redisClient.get.mockResolvedValue(null);
    redisClient.set.mockResolvedValue();
    redisClient.del.mockResolvedValue();

    notificationService.createNotification.mockResolvedValue();
    messageService.createMessage.mockResolvedValue();
    Object.values(emailUtils).forEach((fn) => fn.mockResolvedValue());

    bcrypt.hash.mockClear();
    bcrypt.compare.mockClear();

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.csrfToken = () => 'csrf-token';
      next();
    });
    app.post('/api/auth/login', (req, res, next) => authController.login(req, res, next));
    const errorHandler = require('../src/middleware/errorHandler');
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows login after email OTP confirmation activates the account', async () => {
    const registrationData = {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '+15555555555',
      password: 'StrongPass1!',
    };

    const { user } = await authService.registerUser(registrationData);

    expect(user).toMatchObject({ email: registrationData.email, status: 'pending' });
    expect(mockUser.status).toBe('pending');

    mockUser.is_email_verified = true;

    await authService.confirmVerificationOtp({
      user_id: mockUser.id,
      type: 'email',
      code: '123456',
    });

    expect(mockUser.status).toBe('active');
    expect(userModel.updateUser).toHaveBeenCalledWith(mockUser.id, { status: 'active' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: registrationData.email, password: registrationData.password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user).toMatchObject({ id: mockUser.id, email: registrationData.email });
  });
});


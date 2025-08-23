const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock database
jest.mock('../src/config/database', () => {
  const mockDb = jest.fn((table) => {
    if (table === 'roles') {
      return { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue({ id: 1 }) };
    }
    if (table === 'user_roles') {
      return { insert: jest.fn().mockResolvedValue() };
    }
    if (table === 'refresh_tokens') {
      return { insert: jest.fn().mockResolvedValue() };
    }
    if (table === 'blacklisted_tokens') {
      return {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockResolvedValue(),
      };
    }
    return {};
  });
  mockDb.fn = { now: jest.fn() };
  return mockDb;
});

// Mock models and services
jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  insertUser: jest.fn(),
  updateUser: jest.fn(),
  getUserRoles: jest.fn(),
  findAdmins: jest.fn(),
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

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpw'),
  compare: jest.fn().mockResolvedValue(true),
}));

process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';

const authService = require('../src/modules/auth/services/auth.service');
const authMiddleware = require('../src/middleware/auth/authMiddleware');
const userModel = require('../src/modules/users/user.model');

describe('Sensitive data sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
    process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
  });

  it('registerUser does not return password_hash', async () => {
    const mockUser = {
      id: 1,
      full_name: 'Test',
      email: 'test@example.com',
      phone: '123',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };
    userModel.findByEmail.mockResolvedValue(null);
    userModel.findByPhone.mockResolvedValue(null);
    userModel.insertUser.mockResolvedValue([mockUser]);
    userModel.getUserRoles.mockResolvedValue([]);
    userModel.findAdmins.mockResolvedValue([]);

    const result = await authService.registerUser({
      full_name: 'Test',
      email: 'test@example.com',
      phone: '123',
      password: 'pass',
    });

    expect(result.user.password_hash).toBeUndefined();
  });

  it('loginUser does not return password_hash', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'active',
    };
    userModel.findByEmail.mockResolvedValue({ ...mockUser });
    userModel.updateUser.mockResolvedValue([mockUser]);
    userModel.getUserRoles.mockResolvedValue([]);

    const issueSpy = jest
      .spyOn(authService, 'issueRefreshToken')
      .mockResolvedValue('refresh');

    const result = await authService.loginUser({
      email: 'test@example.com',
      password: 'pass',
    });

    expect(result.user.password_hash).toBeUndefined();
    issueSpy.mockRestore();
  });

  it('verifyToken attaches user without password_hash', async () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    userModel.findById.mockResolvedValue({
      id: 1,
      email: 't@example.com',
      password_hash: 'hashedpw',
      role: 'Student',
      status: 'active',
    });
    userModel.getUserRoles.mockResolvedValue([]);

    const app = express();
    app.get('/test', authMiddleware.verifyToken, (req, res) => {
      res.json(req.user);
    });

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.password_hash).toBeUndefined();
  });
});

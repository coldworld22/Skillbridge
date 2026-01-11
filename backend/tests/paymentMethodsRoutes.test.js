const request = require('supertest');
const express = require('express');

let tenantMembershipHandler = (_req, _res, next) => next();

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
  getAll: jest.fn(),
  getActive: jest.fn(),
  getPayPalSettings: jest.fn(),
  getPayPalClientId: jest.fn(),
  updatePayPalSettings: jest.fn(),
  getStripeSettings: jest.fn(),
  updateStripeSettings: jest.fn(),
  getCoinbaseSettings: jest.fn(),
  updateCoinbaseSettings: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(() => [{ id: 'admin1' }]),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'admin1' };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => {
    req.tenant = { id: 'tenant-1' };
    next();
  },
  ensureTenantMembership: jest.fn(() => (req, res, next) =>
    tenantMembershipHandler(req, res, next),
  ),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/storage', () => ({
  checkAndConsumeStorage: () => (_req, _res, next) => next(),
  subtractStorageUsage: jest.fn(),
}));

jest.mock('../src/modules/paymentMethods/paymentMethodIconUploadMiddleware', () => ({
  single: () => (req, _res, next) => {
    req.file = req.file || { filename: 'new-icon.png' };
    next();
  },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

const fs = require('fs');
const service = require('../src/modules/paymentMethods/paymentMethods.service');
const { subtractStorageUsage } = require('../src/middleware/storage');
const routes = require('../src/modules/paymentMethods/paymentMethods.routes');

const app = express();
app.use(express.json());
app.use('/api/payment-methods', routes);

describe('Payment methods routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tenantMembershipHandler = (_req, _res, next) => next();
  });

  it('subtracts storage when replacing an icon', async () => {
    service.getById.mockResolvedValue({
      id: '1',
      name: 'Bank',
      icon: '/uploads/payment-methods/old-icon.png',
      settings: {},
    });
    service.update.mockResolvedValue({
      id: '1',
      name: 'Bank',
      icon: '/uploads/payment-methods/new-icon.png',
      settings: {},
    });
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 256 });

    const res = await request(app)
      .patch('/api/payment-methods/1')
      .attach('icon', Buffer.from('test'), 'icon.png');

    expect(res.status).toBe(200);
    expect(service.update).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(subtractStorageUsage).toHaveBeenCalledWith('tenant-1', 256);
  });

  it('subtracts storage when deleting a method with an icon', async () => {
    service.getById.mockResolvedValue({
      id: '1',
      name: 'Card',
      icon: '/uploads/payment-methods/delete-icon.png',
    });
    service.delete.mockResolvedValue();
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 512 });

    const res = await request(app).delete('/api/payment-methods/1');

    expect(res.status).toBe(200);
    expect(service.delete).toHaveBeenCalledWith('1');
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(subtractStorageUsage).toHaveBeenCalledWith('tenant-1', 512);
  });

  it('requires tenant membership authorization', async () => {
    tenantMembershipHandler = (_req, res) =>
      res.status(403).json({ message: 'tenant_membership_required' });

    const res = await request(app).get('/api/payment-methods');

    expect(res.status).toBe(403);
  });
});

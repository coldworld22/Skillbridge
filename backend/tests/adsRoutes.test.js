const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/plans/plans.service', () => ({
  consumeAdCredit: jest.fn(),
}));

jest.mock('../src/modules/ads/ads.service', () => ({
  getAds: jest.fn(),
  createAd: jest.fn(),
  getAdById: jest.fn(),
  findByTitle: jest.fn(),
  updateAd: jest.fn(),
  deleteAd: jest.fn(),
  getAdAnalytics: jest.fn(),
  recordView: jest.fn(),
  purchaseAd: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(() => [{ id: 'admin1', email: 'admin@example.com' }]),
}));

jest.mock('../src/utils/email', () => ({
  sendAdSubmissionEmail: jest.fn(),
  sendAdApprovalEmail: jest.fn(),
  sendNewAdAdminEmail: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => {
  const verifyToken = jest.fn((req, _res, next) => {
    req.user = {
      id: 'user1',
      role: 'instructor',
      roles: ['instructor'],
      email: 'inst@example.com',
      full_name: 'Instructor One',
    };
    next();
  });
  const isInstructorOrAdmin = jest.fn((_req, _res, next) => next());
  return { verifyToken, isInstructorOrAdmin };
});

const service = require('../src/modules/ads/ads.service');
const planService = require('../src/modules/plans/plans.service');
const {
  sendAdSubmissionEmail,
  sendAdApprovalEmail,
  sendNewAdAdminEmail,
} = require('../src/utils/email');
const notificationService = require('../src/modules/notifications/notifications.service');
const messageService = require('../src/modules/messages/messages.service');
const auth = require('../src/middleware/auth/authMiddleware');
const routes = require('../src/modules/ads/ads.routes');

const app = express();
app.use(express.json());
app.use('/api/ads', routes);

describe('GET /api/ads', () => {
  it('returns ads list', async () => {
    const mock = [{ id: '1' }];
    service.getAds.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
  });

  it('filters ads by role', async () => {
    const mock = [{ id: '1' }];
    service.getAds.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads').query({ role: 'student' });
    expect(res.status).toBe(200);
    expect(service.getAds).toHaveBeenCalledWith(false, undefined, 'student', true);
    expect(res.body.data).toEqual(mock);
  });
});

describe('GET /api/ads/admin', () => {
  it('returns ads for the authenticated instructor', async () => {
    const mock = [{ id: '1', created_by: 'user1' }];
    service.getAds.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads/admin');
    expect(res.status).toBe(200);
    expect(service.getAds).toHaveBeenCalledWith(true, 'user1', undefined, false);
    expect(res.body.data).toEqual(mock);
  });

  it('filters ads by target role', async () => {
    const mock = [{ id: '1', created_by: 'user1' }];
    service.getAds.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads/admin').query({ role: 'student' });
    expect(res.status).toBe(200);
    expect(service.getAds).toHaveBeenCalledWith(true, 'user1', 'student', false);
  });
});

describe('GET /api/ads/admin/check-title', () => {
  it('returns exists true when title found', async () => {
    service.findByTitle.mockResolvedValue({ id: '1', title: 'Test' });
    const res = await request(app)
      .get('/api/ads/admin/check-title')
      .query({ title: 'Test' });
    expect(res.status).toBe(200);
    expect(service.findByTitle).toHaveBeenCalledWith('Test');
    expect(res.body.data.exists).toBe(true);
  });

  it('returns exists false when title not found', async () => {
    service.findByTitle.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/ads/admin/check-title')
      .query({ title: 'Unknown' });
    expect(res.status).toBe(200);
    expect(service.findByTitle).toHaveBeenCalledWith('Unknown');
    expect(res.body.data.exists).toBe(false);
  });
});

describe('POST /api/ads/admin', () => {
  it('creates ad', async () => {
    const payload = { title: 'Test', image_url: 'img.jpg' };
    service.createAd.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).post('/api/ads/admin').send(payload);
    expect(res.status).toBe(200);
    expect(service.createAd).toHaveBeenCalled();
    expect(sendAdSubmissionEmail).toHaveBeenCalledWith(
      'inst@example.com',
      'Instructor One',
      'Test'
    );
    expect(sendNewAdAdminEmail).toHaveBeenCalledWith(
      'admin@example.com',
      'Instructor One',
      'Test'
    );
    expect(notificationService.createNotification).toHaveBeenCalledWith({
      user_id: 'admin1',
      type: 'ad',
      message: 'New ad created: Test',
    });
    expect(messageService.createMessage).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: 'admin1',
      message: 'New ad created: Test',
    });
  });
});

describe('PUT /api/ads/:id', () => {
  it('updates ad', async () => {
    const payload = { title: 'Updated' };
    service.updateAd = jest.fn().mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).put('/api/ads/1').send(payload);
    expect(res.status).toBe(200);
    expect(service.updateAd).toHaveBeenCalledWith('1', expect.any(Object));
  });
});

describe('DELETE /api/ads/:id', () => {
  it('deletes ad', async () => {
    service.deleteAd = jest.fn().mockResolvedValue(1);
    const res = await request(app).delete('/api/ads/1');
    expect(res.status).toBe(200);
    expect(service.deleteAd).toHaveBeenCalledWith('1');
  });
});

describe('GET /api/ads/:id/analytics', () => {
  it('returns ad analytics', async () => {
    const analytics = { views: 5, ctr: 1, clicks: 2, unique_viewers: 3 };
    service.getAdAnalytics = jest.fn().mockResolvedValue(analytics);
    const res = await request(app).get('/api/ads/1/analytics');
    expect(res.status).toBe(200);
    expect(service.getAdAnalytics).toHaveBeenCalledWith('1');
    expect(res.body.data.views).toBe(5);
    expect(res.body.data.conversions).toBe(2);
  });
});

describe('POST /api/ads/:id/view', () => {
  it('records ad view', async () => {
    service.recordView.mockResolvedValue();
    const res = await request(app).post('/api/ads/1/view');
    expect(res.status).toBe(200);
    expect(service.recordView).toHaveBeenCalledWith('1', null);
  });
});

describe('POST /api/ads/:id/purchase', () => {
  beforeEach(() => {
    service.purchaseAd.mockReset();
    planService.consumeAdCredit.mockReset();
  });

  it('purchases ad when plan allows', async () => {
    planService.consumeAdCredit.mockResolvedValue(true);
    service.purchaseAd.mockImplementation(async (id, userId) => {
      const allowed = await planService.consumeAdCredit();
      return allowed ? { id, purchased_by: userId } : null;
    });
    const res = await request(app).post('/api/ads/1/purchase');
    expect(res.status).toBe(200);
    expect(service.purchaseAd).toHaveBeenCalledWith('1', 'user1');
  });

  it('returns 400 when plan limit exceeded', async () => {
    planService.consumeAdCredit.mockResolvedValue(false);
    service.purchaseAd.mockImplementation(async (id, userId) => {
      const allowed = await planService.consumeAdCredit();
      return allowed ? { id, purchased_by: userId } : null;
    });
    const res = await request(app).post('/api/ads/1/purchase');
    expect(res.status).toBe(400);
  });
});

describe('authorization on ad modifications', () => {
  beforeEach(() => {
    auth.isInstructorOrAdmin.mockClear();
    service.updateAd.mockClear();
    service.deleteAd.mockClear();
  });

  it('blocks unauthorized update', async () => {
    auth.isInstructorOrAdmin.mockImplementationOnce((req, res) => {
      res.status(403).json({ message: 'Forbidden' });
    });
    const res = await request(app).put('/api/ads/1').send({ title: 'Nope' });
    expect(res.status).toBe(403);
    expect(service.updateAd).not.toHaveBeenCalled();
  });

  it('blocks unauthorized delete', async () => {
    auth.isInstructorOrAdmin.mockImplementationOnce((req, res) => {
      res.status(403).json({ message: 'Forbidden' });
    });
    const res = await request(app).delete('/api/ads/1');
    expect(res.status).toBe(403);
    expect(service.deleteAd).not.toHaveBeenCalled();
  });
});

const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  }),
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  consumeAdCredit: jest.fn(),
  getPlanById: jest.fn(),
}));

jest.mock('../src/modules/ads/ads.service', () => ({
  getAds: jest.fn(),
  createAd: jest.fn(),
  getAdById: jest.fn(),
  getPublicAdById: jest.fn(),
  findByTitle: jest.fn(),
  updateAd: jest.fn(),
  deleteAd: jest.fn(),
  getAdAnalytics: jest.fn(),
  recordView: jest.fn(),
  recordClick: jest.fn(),
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
      plan_id: 'plan1',
      plan: { showAnalytics: true },
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
app.use((err, _req, res, _next) => {
  res.status(err.statusCode || 500).json({ message: err.message });
});

beforeEach(() => {
  jest.clearAllMocks();
});

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
    expect(service.getAds).toHaveBeenCalledWith(true, 'user1', undefined, false, true);
    expect(res.body.data).toEqual(mock);
  });

  it('filters ads by target role', async () => {
    const mock = [{ id: '1', created_by: 'user1' }];
    service.getAds.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads/admin').query({ role: 'student' });
    expect(res.status).toBe(200);
    expect(service.getAds).toHaveBeenCalledWith(true, 'user1', 'student', false, true);
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

describe('GET /api/ads/:id', () => {
  it('requires auth and returns ad details', async () => {
    const mock = { id: '1', title: 'Test' };
    service.getAdById.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads/1');
    expect(auth.verifyToken).toHaveBeenCalled();
    expect(auth.isInstructorOrAdmin).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
  });
});

describe('GET /api/ads/public/:id', () => {
  it('returns only public ad fields', async () => {
    const mock = {
      id: '1',
      title: 'Test',
      description: 'Desc',
      link_url: 'http://example.com',
      start_at: '2024-01-01',
      end_at: '2024-02-01',
      image_url: '/img.jpg',
      video_url: null,
    };
    service.getPublicAdById.mockResolvedValue(mock);
    const res = await request(app).get('/api/ads/public/1');
    expect(service.getPublicAdById).toHaveBeenCalledWith('1');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
  });
});

describe('POST /api/ads/admin', () => {
  it('creates ad within plan limits and consumes credit', async () => {
    const payload = { title: 'Test', image_url: 'img.jpg', allow_branding: true };
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      ad_credits: 2,
      features: [
        { feature_key: 'ads_max_ads', value: '5' },
        { feature_key: 'ads_allow_branding', value: 'true' },
      ],
    });
    service.getAds.mockResolvedValue([]);
    service.createAd.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).post('/api/ads/admin').send(payload);
    expect(res.status).toBe(200);
    expect(service.createAd).toHaveBeenCalled();
    expect(planService.consumeAdCredit).toHaveBeenCalledWith(
      'plan1',
      expect.anything()
    );
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

  it('rejects creation when ad credits exhausted', async () => {
    const payload = { title: 'Test', image_url: 'img.jpg' };
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      ad_credits: 0,
      features: [
        { feature_key: 'ads_max_ads', value: '5' },
        { feature_key: 'ads_allow_branding', value: 'true' },
      ],
    });
    service.getAds.mockResolvedValue([]);
    const res = await request(app).post('/api/ads/admin').send(payload);
    expect(res.status).toBe(403);
    expect(service.createAd).not.toHaveBeenCalled();
  });

  it('rejects creation when branding not allowed', async () => {
    const payload = { title: 'Test', image_url: 'img.jpg', allow_branding: true };
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      ad_credits: 2,
      features: [
        { feature_key: 'ads_max_ads', value: '5' },
        { feature_key: 'ads_allow_branding', value: 'false' },
      ],
    });
    service.getAds.mockResolvedValue([]);
    const res = await request(app).post('/api/ads/admin').send(payload);
    expect(res.status).toBe(403);
    expect(service.createAd).not.toHaveBeenCalled();
  });

  it('rejects creation when max ads exceeded', async () => {
    const payload = { title: 'Test', image_url: 'img.jpg' };
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      ad_credits: 2,
      features: [
        { feature_key: 'ads_max_ads', value: '1' },
        { feature_key: 'ads_allow_branding', value: 'true' },
      ],
    });
    service.getAds.mockResolvedValue([{ id: 'existing' }]);
    const res = await request(app).post('/api/ads/admin').send(payload);
    expect(res.status).toBe(403);
    expect(service.createAd).not.toHaveBeenCalled();
  });
});

describe('PUT /api/ads/:id', () => {
  it('updates ad', async () => {
    const payload = { title: 'Updated' };
    service.getAdById.mockResolvedValue({ id: '1', created_by: 'user1', allow_branding: false });
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      features: [
        { feature_key: 'ads_max_ads', value: '5' },
        { feature_key: 'ads_allow_branding', value: 'true' },
      ],
    });
    service.getAds.mockResolvedValue([{ id: '1' }]);
    service.updateAd = jest.fn().mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).put('/api/ads/1').send(payload);
    expect(res.status).toBe(200);
    expect(service.updateAd).toHaveBeenCalledWith('1', expect.any(Object));
  });

  it('rejects update when branding not allowed', async () => {
    const payload = { allow_branding: true };
    service.getAdById.mockResolvedValue({ id: '1', created_by: 'user1', allow_branding: false });
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      features: [
        { feature_key: 'ads_max_ads', value: '5' },
        { feature_key: 'ads_allow_branding', value: 'false' },
      ],
    });
    service.getAds.mockResolvedValue([{ id: '1' }]);
    const res = await request(app).put('/api/ads/1').send(payload);
    expect(res.status).toBe(403);
    expect(service.updateAd).not.toHaveBeenCalled();
  });

  it('rejects update when max ads exceeded', async () => {
    const payload = { title: 'Updated' };
    service.getAdById.mockResolvedValue({ id: '1', created_by: 'user1', allow_branding: false });
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      features: [
        { feature_key: 'ads_max_ads', value: '1' },
        { feature_key: 'ads_allow_branding', value: 'true' },
      ],
    });
    service.getAds.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const res = await request(app).put('/api/ads/1').send(payload);
    expect(res.status).toBe(403);
    expect(service.updateAd).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/ads/:id', () => {
  it('deletes ad', async () => {
    service.getAdById.mockResolvedValue({ id: '1', created_by: 'user1' });
    service.deleteAd = jest.fn().mockResolvedValue(1);
    const res = await request(app).delete('/api/ads/1');
    expect(res.status).toBe(200);
    expect(service.deleteAd).toHaveBeenCalledWith('1');
  });
});

describe('GET /api/ads/:id/analytics', () => {
  it('returns ad analytics when user has access', async () => {
    const analytics = { views: 5, ctr: 1, clicks: 2, unique_viewers: 3 };
    service.getAdAnalytics = jest.fn().mockResolvedValue(analytics);
    const res = await request(app).get('/api/ads/1/analytics');
    expect(res.status).toBe(200);
    expect(service.getAdAnalytics).toHaveBeenCalledWith('1');
    expect(res.body.data.views).toBe(5);
    expect(res.body.data.conversions).toBe(2);
  });

  it('returns 401 when unauthenticated', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => next());
    const res = await request(app).get('/api/ads/1/analytics');
    expect(res.status).toBe(401);
  });

  it('returns 403 when plan lacks analytics access', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = {
        id: 'user1',
        role: 'instructor',
        roles: ['instructor'],
        email: 'inst@example.com',
        full_name: 'Instructor One',
        plan: { showAnalytics: false },
      };
      next();
    });
    const res = await request(app).get('/api/ads/1/analytics');
    expect(res.status).toBe(403);
  });
});

describe('POST /api/ads/:id/view', () => {
  it('records ad view for active existing ad', async () => {
    service.getAdById.mockResolvedValue({ id: '1', is_active: true });
    service.recordView.mockResolvedValue();
    const res = await request(app).post('/api/ads/1/view');
    expect(res.status).toBe(200);
    expect(service.getAdById).toHaveBeenCalledWith('1');
  expect(service.recordView).toHaveBeenCalledWith(
    '1',
    null,
    expect.any(String),
    undefined
  );
  });

  it('returns 404 for missing ad', async () => {
    service.getAdById.mockResolvedValue(null);
    const res = await request(app).post('/api/ads/1/view');
    expect(res.status).toBe(404);
    expect(service.recordView).not.toHaveBeenCalled();
  });

  it('returns 403 for inactive ad', async () => {
    service.getAdById.mockResolvedValue({ id: '1', is_active: false });
    const res = await request(app).post('/api/ads/1/view');
    expect(res.status).toBe(403);
    expect(service.recordView).not.toHaveBeenCalled();
  });
});

describe('POST /api/ads/:id/click', () => {
  it('records ad click for active existing ad', async () => {
    service.getAdById.mockResolvedValue({ id: '1', is_active: true });
    service.recordClick.mockResolvedValue();
    const res = await request(app).post('/api/ads/1/click');
    expect(res.status).toBe(200);
    expect(service.getAdById).toHaveBeenCalledWith('1');
    expect(service.recordClick).toHaveBeenCalledWith('1');
  });

  it('returns 404 for missing ad', async () => {
    service.getAdById.mockResolvedValue(null);
    const res = await request(app).post('/api/ads/1/click');
    expect(res.status).toBe(404);
    expect(service.recordClick).not.toHaveBeenCalled();
  });

  it('returns 403 for inactive ad', async () => {
    service.getAdById.mockResolvedValue({ id: '1', is_active: false });
    const res = await request(app).post('/api/ads/1/click');
    expect(res.status).toBe(403);
    expect(service.recordClick).not.toHaveBeenCalled();
  });
});
// Service-level test ensuring getAds filters by start and end dates
describe('ads.service getAds active date filtering', () => {
  it('adds date range filters to the query', async () => {
    jest.resetModules();
    const whereCalls = [];
    const builder = {
      where: (...args) => {
        whereCalls.push(args);
        return builder;
      },
      whereNotNull: (...args) => {
        whereCalls.push(['whereNotNull', ...args]);
        return builder;
      },
      orderBy: () => builder,
      modify: (fn) => {
        fn(builder);
        return builder;
      },
    };
    const dbMock = () => builder;
    dbMock.fn = { now: () => 'NOW()' };
    jest.doMock('../src/config/database.js', () => dbMock);
    jest.unmock('../src/modules/ads/ads.service');
    const serviceReal = require('../src/modules/ads/ads.service');
    await serviceReal.getAds();
    expect(whereCalls).toEqual(
      expect.arrayContaining([
        ['start_at', '<=', 'NOW()'],
        ['end_at', '>=', 'NOW()'],
      ])
    );
  });
});

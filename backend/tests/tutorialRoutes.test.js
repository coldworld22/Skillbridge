const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({
  getTutorialsByCategory: jest.fn(),
  getTutorialAnalytics: jest.fn(),
  getTutorialById: jest.fn(),
  updateTutorial: jest.fn(),
  permanentlyDeleteTutorial: jest.fn(),
  togglePublishStatus: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: jest.fn((req, _res, next) => {
    req.user = { id: 'admin', role: 'admin', roles: ['admin'] };
    next();
  }),
  isInstructorOrAdmin: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
  isStudent: (_req, _res, next) => next(),
}));

const service = require('../src/modules/users/tutorials/tutorial.service');
const routes = require('../src/modules/users/tutorials/tutorial.routes');
const auth = require('../src/middleware/auth/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/users/tutorials', routes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/users/tutorials/category/:categoryId', () => {
  it('returns tutorials for the given category', async () => {
    const mockTutorials = [{ id: '1', title: 'Test Tutorial' }];
    service.getTutorialsByCategory.mockResolvedValue(mockTutorials);

    const res = await request(app).get('/api/users/tutorials/category/123');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockTutorials);
    expect(service.getTutorialsByCategory).toHaveBeenCalledWith('123');
  });
});

describe('GET /api/users/tutorials/admin/:id/analytics', () => {
  it('returns tutorial analytics', async () => {
    const analytics = { totalStudents: 5 };
    service.getTutorialAnalytics = jest.fn().mockResolvedValue(analytics);

    const res = await request(app).get('/api/users/tutorials/admin/1/analytics');
    expect(res.status).toBe(200);
    expect(service.getTutorialAnalytics).toHaveBeenCalledWith('1');
    expect(res.body.data).toEqual(analytics);
  });
});

describe('PUT /api/users/tutorials/admin/:id', () => {
  it("returns 403 when instructor updates another instructor's tutorial", async () => {
    service.getTutorialById.mockResolvedValue({ id: '1', instructor_id: 'owner' });
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: 'other', role: 'instructor', roles: ['instructor'] };
      next();
    });
    const payload = { title: 'New', category_id: 'cat', level: 'beginner' };
    const res = await request(app)
      .put('/api/users/tutorials/admin/1')
      .send(payload);
    expect(res.status).toBe(403);
    expect(service.updateTutorial).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/users/tutorials/admin/:id', () => {
  it("returns 403 when instructor deletes another instructor's tutorial", async () => {
    service.getTutorialById.mockResolvedValue({ id: '1', instructor_id: 'owner' });
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: 'other', role: 'instructor', roles: ['instructor'] };
      next();
    });
    const res = await request(app).delete('/api/users/tutorials/admin/1');
    expect(res.status).toBe(403);
    expect(service.permanentlyDeleteTutorial).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/users/tutorials/admin/:id/status', () => {
  it("returns 403 when instructor toggles another instructor's tutorial", async () => {
    service.getTutorialById.mockResolvedValue({ id: '1', instructor_id: 'owner' });
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: 'other', role: 'instructor', roles: ['instructor'] };
      next();
    });
    const res = await request(app).patch('/api/users/tutorials/admin/1/status');
    expect(res.status).toBe(403);
    expect(service.togglePublishStatus).not.toHaveBeenCalled();
  });
});

const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/bookReviews/bookReview.service', () => ({
  listReviews: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  ensurePurchased: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: jest.fn((req, _res, next) => next()),
}));

const service = require('../src/modules/bookReviews/bookReview.service');
const routes = require('../src/modules/bookReviews/bookReview.routes');
const auth = require('../src/middleware/auth/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/book-reviews', routes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PUT /api/book-reviews/:id', () => {
  it('allows author to update own review', async () => {
    auth.verifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: 'u1', role: 'student', roles: ['student'] };
      next();
    });
    service.findById.mockResolvedValue({ id: 'r1', user_id: 'u1' });
    service.updateReview.mockResolvedValue({ id: 'r1', user_id: 'u1', text: 'new' });
    const res = await request(app).put('/api/book-reviews/r1').send({ text: 'new' });
    expect(res.status).toBe(200);
    expect(service.updateReview).toHaveBeenCalledWith('r1', { text: 'new' });
  });

  it('forbids updating others review', async () => {
    auth.verifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: 'u2', role: 'student', roles: ['student'] };
      next();
    });
    service.findById.mockResolvedValue({ id: 'r1', user_id: 'u1' });
    const res = await request(app).put('/api/book-reviews/r1').send({ text: 'new' });
    expect(res.status).toBe(403);
    expect(service.updateReview).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/book-reviews/:id', () => {
  it('allows author to delete own review', async () => {
    auth.verifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: 'u1', role: 'student', roles: ['student'] };
      next();
    });
    service.findById.mockResolvedValue({ id: 'r1', user_id: 'u1' });
    service.deleteReview.mockResolvedValue();
    const res = await request(app).delete('/api/book-reviews/r1');
    expect(res.status).toBe(200);
    expect(service.deleteReview).toHaveBeenCalledWith('r1');
  });

  it('forbids deleting others review', async () => {
    auth.verifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: 'u2', role: 'student', roles: ['student'] };
      next();
    });
    service.findById.mockResolvedValue({ id: 'r1', user_id: 'u1' });
    const res = await request(app).delete('/api/book-reviews/r1');
    expect(res.status).toBe(403);
    expect(service.deleteReview).not.toHaveBeenCalled();
  });
});


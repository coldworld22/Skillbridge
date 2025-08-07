const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/books/book.service', () => ({
  listBooks: jest.fn(),
  getInstructorBookAnalytics: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/books/bookTag.service', () => ({
  findByName: jest.fn(),
  createTag: jest.fn(),
  getAllTags: jest.fn(),
  searchTags: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: '1' };
    next();
  },
  isInstructorOrAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/books/book.service');
const routes = require('../src/modules/books/instructor.routes');

const app = express();
app.use(express.json());
app.use('/api/instructor/books', routes);

beforeEach(() => jest.clearAllMocks());

describe('GET /api/instructor/books', () => {
  it('returns books for instructor', async () => {
    const list = [{ id: '1', title: 'Test' }];
    const meta = { total: 1, page: 1, perPage: 10, totalPages: 1 };
    service.listBooks.mockResolvedValue({ data: list, meta });
    const res = await request(app).get('/api/instructor/books');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(service.listBooks).toHaveBeenCalledWith(expect.objectContaining({ instructorId: '1' }));
  });
});

describe('GET /api/instructor/books/analytics', () => {
  it('returns analytics', async () => {
    const stats = { totalSales: 0, totalRevenue: 0, topBooks: [] };
    service.getInstructorBookAnalytics.mockResolvedValue(stats);
    const res = await request(app).get('/api/instructor/books/analytics');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(stats);
    expect(service.getInstructorBookAnalytics).toHaveBeenCalledWith('1');
  });
});

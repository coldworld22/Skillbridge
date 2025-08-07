const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/books/book.service', () => ({
  listBooks: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(() => []),
  findById: jest.fn(),
}));

jest.mock('../src/modules/books/bookTag.service', () => ({
  findByName: jest.fn(),
  createTag: jest.fn(),
  getAllTags: jest.fn(),
  searchTags: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: '1', role: 'instructor' }; next(); },
  isInstructorOrAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/books/book.service');
const routes = require('../src/modules/books/instructorBook.routes');

const app = express();
app.use('/api/instructor/books', routes);

describe('GET /api/instructor/books', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns instructor books', async () => {
    const list = [{ id: '1', title: 'Test' }];
    const meta = { total: 1, page: 1, perPage: 10, totalPages: 1 };
    service.listBooks.mockResolvedValue({ data: list, meta });

    const res = await request(app).get('/api/instructor/books');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(service.listBooks).toHaveBeenCalledWith({ instructorId: '1' });

  });
});

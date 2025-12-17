const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/books/book.service', () => ({
  listBooks: jest.fn(),
  getInstructorBookAnalytics: jest.fn(),
  createBook: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/books/book.utils', () => ({
  processTags: jest.fn(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
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
  verifyToken: jest.fn(),
  isInstructorOrAdmin: jest.fn(),
}));

const service = require('../src/modules/books/book.service');
const routes = require('../src/modules/books/instructorBook.routes');
const errorHandler = require('../src/middleware/errorHandler');
const auth = require('../src/middleware/auth/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/instructor/books', routes);
app.use(errorHandler);

describe('GET /api/instructor/books', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.verifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: '1', role: 'instructor' };
      next();
    });
    auth.isInstructorOrAdmin.mockImplementation((_req, _res, next) => next());
  });

  it('returns instructor books', async () => {
    const list = [{ id: '1', title: 'Test' }];
    const meta = { total: 1, page: 1, perPage: 10, totalPages: 1 };
    service.listBooks.mockResolvedValue({ data: list, meta });

    const res = await request(app).get('/api/instructor/books');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(service.listBooks).toHaveBeenCalledWith({ instructorId: '1' });
  });

  it('returns 401 for unauthorized access', async () => {
    auth.verifyToken.mockImplementation((req, res) =>
      res.status(401).json({ message: 'Unauthorized' })
    );
    const res = await request(app).get('/api/instructor/books');
    expect(res.status).toBe(401);
    expect(service.listBooks).not.toHaveBeenCalled();
  });

  it('handles service errors', async () => {
    service.listBooks.mockRejectedValue(new Error('Service error'));
    const res = await request(app).get('/api/instructor/books');
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/service error/i);
  });

  it('passes query parameters to the service', async () => {
    const list = [{ id: '1', title: 'Filtered' }];
    const meta = { total: 1, page: 2, perPage: 5, totalPages: 1 };
    service.listBooks.mockResolvedValue({ data: list, meta });

    const res = await request(app).get('/api/instructor/books?page=2&perPage=5&status=approved');

    expect(res.status).toBe(200);
    expect(service.listBooks).toHaveBeenCalledWith({
      page: '2',
      perPage: '5',
      status: 'approved',
      instructorId: '1',
    });
  });
});

describe('POST /api/instructor/books', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.verifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: '1', role: 'instructor' };
      next();
    });
    auth.isInstructorOrAdmin.mockImplementation((_req, _res, next) => next());
  });

  it('returns validation error for empty payload', async () => {
    const res = await request(app).post('/api/instructor/books').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation error/i);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(service.createBook).not.toHaveBeenCalled();
  });

  it('returns validation error for negative price', async () => {
    const payload = {
      title: 'Bad Book',
      price: -5,
      language: 'en',
      license_type: 'standard',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
    };
    const res = await request(app).post('/api/instructor/books').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation error/i);
    expect(service.createBook).not.toHaveBeenCalled();
  });
});

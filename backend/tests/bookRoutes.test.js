const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/books/book.service', () => ({
  createBook: jest.fn(),
  listBooks: jest.fn(),
  getBookById: jest.fn(),
  updateBook: jest.fn(),
  deleteBook: jest.fn(),
  clearBookTags: jest.fn(),
  getBookTags: jest.fn(),
  updateBookStatus: jest.fn(),
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
const routes = require('../src/modules/books/book.routes');
const messageService = require('../src/modules/messages/messages.service');
const notificationService = require('../src/modules/notifications/notifications.service');

const app = express();
app.use(express.json());
app.use('/api/books', routes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/books', () => {
  it('returns book list', async () => {
    const list = [{ id: '1', title: 'Test' }];
    const meta = { total: 1, page: 1, perPage: 10, totalPages: 1 };
    service.listBooks.mockResolvedValue({ data: list, meta });
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(res.body.meta).toEqual(meta);
    expect(service.listBooks).toHaveBeenCalled();
  });
});

describe('GET /api/books/:id', () => {
  it('returns a book', async () => {
    const book = { id: '1', title: 'One', status: 'approved' };
    service.getBookById.mockResolvedValue(book);
    const res = await request(app).get('/api/books/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(book);
    expect(service.getBookById).toHaveBeenCalledWith('1');
  });
});

describe('GET /api/books/admin/:id', () => {
  it('returns a book for admin', async () => {
    const book = { id: '1', title: 'One', status: 'pending' };
    const tags = [{ id: 1, name: 'tag' }];
    service.getBookById.mockResolvedValue(book);
    service.getBookTags.mockResolvedValue(tags);
    const res = await request(app).get('/api/books/admin/1');
    expect(res.status).toBe(200);
    expect(service.getBookById).toHaveBeenCalledWith('1');
    expect(service.getBookTags).toHaveBeenCalledWith('1');
    expect(res.body.data).toEqual({ ...book, tags });
  });
});

describe('POST /api/books', () => {
  it('creates a book', async () => {
    const payload = { title: 'New' };
    service.createBook.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).post('/api/books').send(payload);
    expect(res.status).toBe(200);
    expect(service.createBook).toHaveBeenCalled();
  });
});

describe('PUT /api/books/:id', () => {
  it('updates a book', async () => {
    const payload = { title: 'Updated' };
    service.getBookById.mockResolvedValue({ id: '1', instructor_id: '2', title: 'Old' });
    service.updateBook.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).put('/api/books/1').send(payload);
    expect(res.status).toBe(200);
    expect(service.updateBook).toHaveBeenCalledWith('1', expect.any(Object));
    expect(notificationService.createNotification).toHaveBeenCalledWith({
      user_id: '2',
      type: 'book_updated',
      message: expect.stringContaining('Updated'),
    });
    expect(messageService.createMessage).toHaveBeenCalledWith({
      sender_id: '1',
      receiver_id: '2',
      message: expect.stringContaining('Updated'),
    });
  });
});

describe('DELETE /api/books/:id', () => {
  it('deletes a book', async () => {
    const res = await request(app).delete('/api/books/1');
    expect(res.status).toBe(200);
    expect(service.clearBookTags).toHaveBeenCalledWith('1');
    expect(service.deleteBook).toHaveBeenCalledWith('1');
  });
});

describe('PATCH /api/books/:id/status', () => {
  it('updates book status', async () => {
    const book = { id: '1', status: 'active' };
    service.updateBookStatus.mockResolvedValue(book);
    const res = await request(app)
      .patch('/api/books/1/status')
      .send({ status: 'active' });
    expect(res.status).toBe(200);
    expect(service.updateBookStatus).toHaveBeenCalledWith('1', 'active');
    expect(res.body.data).toEqual(book);
  });
});

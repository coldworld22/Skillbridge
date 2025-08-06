const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/books/book.service', () => ({
  createBook: jest.fn(),
  listBooks: jest.fn(),
  getBookById: jest.fn(),
  updateBook: jest.fn(),
  deleteBook: jest.fn(),
  clearBookTags: jest.fn(),
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

const app = express();
app.use(express.json());
app.use('/api/books', routes);

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
    service.updateBook.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).put('/api/books/1').send(payload);
    expect(res.status).toBe(200);
    expect(service.updateBook).toHaveBeenCalledWith('1', expect.any(Object));
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

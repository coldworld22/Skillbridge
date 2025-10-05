const request = require('supertest');
const express = require('express');

process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://user:pass@localhost:5432/testdb';

jest.mock('../src/modules/books/book.service', () => ({
  createBook: jest.fn(),
  listBooks: jest.fn(),
  getBookById: jest.fn(),
  updateBook: jest.fn(),
  deleteBook: jest.fn(),
  clearBookTags: jest.fn(),
  getBookTags: jest.fn(),
  updateBookTags: jest.fn(),
  updateBookStatus: jest.fn(),
  getInstructorBookAnalytics: jest.fn(),
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  checkout: jest.fn(),
  addToWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn(),
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

jest.mock('../src/middleware/validate', () => {
  const actual = jest.requireActual('../src/middleware/validate');
  return (config) => {
    const middleware = actual(config);
    return async (req, res, next) => {
      if (req.body && typeof req.body === 'object' && 'is_free' in req.body) {
        req.body = { ...req.body };
        delete req.body.is_free;
      }
      return middleware(req, res, next);
    };
  };
});

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(() => []),
  findById: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: jest.fn((req, _res, next) => {
    req.user = { id: '1', role: 'admin', roles: ['admin'] };
    next();
  }),
  isAdmin: jest.fn((_req, _res, next) => next()),
  isStudent: jest.fn((_req, _res, next) => next()),
  isInstructorOrAdmin: jest.fn((_req, _res, next) => next()),
}));

const service = require('../src/modules/books/book.service');
const routes = require('../src/modules/books/book.routes');
const messageService = require('../src/modules/messages/messages.service');
const notificationService = require('../src/modules/notifications/notifications.service');
const userModel = require('../src/modules/users/user.model');
const auth = require('../src/middleware/auth/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/books', routes);
app.use(require('../src/middleware/errorHandler'));

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
    const payload = {
      title: 'New',
      price: 10,
      language: 'en',
      license_type: 'standard',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      is_free: false,
      status: 'pending',
    };
    service.createBook.mockResolvedValue({ id: '1', ...payload });
    userModel.findAdmins.mockResolvedValue([]);
    const res = await request(app).post('/api/books').send(payload);
    expect(res.status).toBe(200);
    expect(service.createBook).toHaveBeenCalled();
    const [dataArg] = service.createBook.mock.calls[0];
    expect(dataArg).not.toHaveProperty('is_free');
  });
});

describe('PUT /api/books/:id', () => {
  it('updates a book', async () => {
    const payload = { title: 'Updated' };
    service.getBookById.mockResolvedValue({ id: '1', instructor_id: '2', title: 'Old' });
    service.updateBook.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).put('/api/books/1').send(payload);
    expect(res.status).toBe(200);
    expect(service.updateBook).toHaveBeenCalledWith(
      '1',
      expect.any(Object),
      { removePreviewPages: false }
    );
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

  it("returns 403 when instructor updates another instructor's book", async () => {
    const payload = { title: 'Updated' };
    service.getBookById.mockResolvedValue({ id: '1', instructor_id: '2', title: 'Old' });
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'instructor', roles: ['instructor'] };
      next();
    });
    const res = await request(app).put('/api/books/1').send(payload);
    expect(res.status).toBe(403);
    expect(service.updateBook).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/books/:id', () => {
  it('deletes a book', async () => {
    service.getBookById.mockResolvedValue({ id: '1', instructor_id: '2' });
    const res = await request(app).delete('/api/books/1');
    expect(res.status).toBe(200);
    expect(service.clearBookTags).toHaveBeenCalledWith('1');
    expect(service.deleteBook).toHaveBeenCalledWith('1');
  });

  it("returns 403 when instructor deletes another instructor's book", async () => {
    service.getBookById.mockResolvedValue({ id: '1', instructor_id: '2' });
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'instructor', roles: ['instructor'] };
      next();
    });
    const res = await request(app).delete('/api/books/1');
    expect(res.status).toBe(403);
    expect(service.deleteBook).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/books/:id/status', () => {
  it('updates book status', async () => {
    const book = { id: '1', status: 'active', instructor_id: '2', title: 'Book' };
    service.getBookById.mockResolvedValue(book);
    service.updateBookStatus.mockResolvedValue(book);
    userModel.findAdmins.mockResolvedValue([]);
    userModel.findById.mockResolvedValue({ id: '2', email: 'user@example.com' });
    const res = await request(app)
      .patch('/api/books/1/status')
      .send({ status: 'active' });
    expect(res.status).toBe(200);
    expect(service.updateBookStatus).toHaveBeenCalledWith('1', 'active');
    expect(res.body.data).toEqual(book);
    expect(auth.isAdmin).toHaveBeenCalled();
  });

  it('returns 403 when instructor attempts to update book status', async () => {
    const book = { id: '1', status: 'pending', instructor_id: '1', title: 'Book' };
    service.getBookById.mockResolvedValue(book);
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'instructor', roles: ['instructor'] };
      next();
    });
    auth.isAdmin.mockImplementationOnce((_req, _res, next) => next());
    const res = await request(app)
      .patch('/api/books/1/status')
      .send({ status: 'active' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only admins/i);
    expect(service.updateBookStatus).not.toHaveBeenCalled();
  });
});

describe('POST /api/books/cart', () => {
  it('adds to cart', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue({ id: '10', status: 'active' });
    const res = await request(app)
      .post('/api/books/cart')
      .send({ bookId: '10' });
    expect(res.status).toBe(200);
    expect(service.addToCart).toHaveBeenCalledWith('1', 10);
  });

  it('removes from cart', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue({ id: '10', status: 'active' });
    const res = await request(app)
      .post('/api/books/cart')
      .send({ bookId: '10', action: 'remove' });
    expect(res.status).toBe(200);
    expect(service.removeFromCart).toHaveBeenCalledWith('1', 10);
  });

  it('returns 404 when book not found', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/books/cart')
      .send({ bookId: '10' });
    expect(res.status).toBe(404);
    expect(service.addToCart).not.toHaveBeenCalled();
  });

  it('returns 400 when book is inactive', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue({ id: '10', status: 'inactive' });
    const res = await request(app)
      .post('/api/books/cart')
      .send({ bookId: '10' });
    expect(res.status).toBe(400);
    expect(service.addToCart).not.toHaveBeenCalled();
  });
});

describe('POST /api/books/checkout', () => {
  it('processes checkout', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    const purchases = [{ id: 1 }];
    service.checkout.mockResolvedValue(purchases);
    const res = await request(app).post('/api/books/checkout');
    expect(res.status).toBe(200);
    expect(service.checkout).toHaveBeenCalledWith('1');
    expect(res.body.data).toEqual(purchases);
  });
});

describe('POST /api/books/wishlist', () => {
  it('adds to wishlist', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue({ id: '10', status: 'active' });
    const res = await request(app)
      .post('/api/books/wishlist')
      .send({ bookId: '10' });
    expect(res.status).toBe(200);
    expect(service.addToWishlist).toHaveBeenCalledWith('1', 10);
  });

  it('returns 404 when book not found', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/books/wishlist')
      .send({ bookId: '10' });
    expect(res.status).toBe(404);
    expect(service.addToWishlist).not.toHaveBeenCalled();
  });

  it('returns 400 when book is inactive', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue({ id: '10', status: 'inactive' });
    const res = await request(app)
      .post('/api/books/wishlist')
      .send({ bookId: '10' });
    expect(res.status).toBe(400);
    expect(service.addToWishlist).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/books/wishlist', () => {
  it('removes from wishlist', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue({ id: '10', status: 'active' });
    const res = await request(app)
      .delete('/api/books/wishlist')
      .send({ bookId: '10' });
    expect(res.status).toBe(200);
    expect(service.removeFromWishlist).toHaveBeenCalledWith('1', 10);
  });
});

describe('validation errors', () => {
  it('returns 400 for invalid create payload', async () => {
    const res = await request(app).post('/api/books').send({});
    expect(res.status).toBe(400);
    expect(service.createBook).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid update payload', async () => {
    service.getBookById.mockResolvedValue({ id: '1', instructor_id: '1' });
    const res = await request(app).put('/api/books/1').send({ price: 'abc' });
    expect(res.status).toBe(400);
    expect(service.updateBook).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid cart action', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    const res = await request(app)
      .post('/api/books/cart')
      .send({ bookId: '10', action: 'invalid' });
    expect(res.status).toBe(400);
    expect(service.addToCart).not.toHaveBeenCalled();
    expect(service.removeFromCart).not.toHaveBeenCalled();
  });

  it('returns 400 for wishlist without bookId', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    const res = await request(app).post('/api/books/wishlist').send({});
    expect(res.status).toBe(400);
    expect(service.addToWishlist).not.toHaveBeenCalled();
  });

  it('returns 404 when book not found', async () => {
    auth.verifyToken.mockImplementationOnce((req, _res, next) => {
      req.user = { id: '1', role: 'student', roles: ['student'] };
      next();
    });
    service.getBookById.mockResolvedValue(null);
    const res = await request(app)
      .delete('/api/books/wishlist')
      .send({ bookId: '10' });
    expect(res.status).toBe(404);
    expect(service.removeFromWishlist).not.toHaveBeenCalled();
  });
});


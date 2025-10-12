const request = require('supertest');
const express = require('express');

jest.mock('../library.service', () => ({
  listForStudent: jest.fn(),
  getBookForDownload: jest.fn(),
}));
const service = require('../library.service');

jest.mock('../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 's1', plan_id: 'plan1' }; next(); },
  isStudent: (_req, _res, next) => next(),
}));

jest.mock('../../plans/plans.service', () => ({ getPlanById: jest.fn() }));
const planService = require('../../plans/plans.service');

jest.mock('fs', () => ({
  constants: { R_OK: 4 },
  promises: { access: jest.fn(() => Promise.resolve()) },
  createReadStream: jest.fn(() => ({ on: jest.fn(), pipe: jest.fn() })),
}));

const routes = require('../library.routes');
const app = express();
app.use('/library', routes);

describe('library routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      features: [{ feature_key: 'books_download', value: 'true' }],
    });
    service.getBookForDownload.mockResolvedValue({ pdf_url: '/uploads/books/file.pdf', title: 'Book' });
  });

  test('allows download when purchased even if feature disabled', async () => {
    planService.getPlanById.mockResolvedValueOnce({
      id: 'plan1',
      features: [{ feature_key: 'books_download', value: 'false' }],
    });
    const res = await request(app).get('/library/download/1');
    expect(res.statusCode).toBe(200);
  });
});

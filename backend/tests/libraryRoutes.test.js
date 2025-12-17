const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/library/library.service', () => ({
  listForStudent: jest.fn(),
  getBookForDownload: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: '1' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
}));

const service = require('../src/modules/library/library.service');
const routes = require('../src/modules/library/library.routes');

const app = express();
app.use(express.json());
app.use('/api/library', routes);

describe('GET /api/library', () => {
  it('returns purchased books', async () => {
    const items = [
      {
        id: '1',
        title: 'Book',
        shortDescription: 'A cool book',
        author: 'Author',
        tags: ['tag'],
        isFree: false,
        price_paid: 10,
        purchasedAt: '2024-01-01T00:00:00Z',
        cover_image_url: '/cover',
        pdf_url: '/file.pdf',
        preview_url: '/preview',
      },
    ];
    service.listForStudent.mockResolvedValue(items);
    const res = await request(app).get('/api/library');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(items);
    expect(service.listForStudent).toHaveBeenCalled();
  });
});

describe('GET /api/library/download/:bookId', () => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, '../uploads');

  beforeAll(() => {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    fs.writeFileSync(path.join(uploadsDir, 'test.pdf'), 'test');
  });

  afterAll(() => {
    try {
      fs.unlinkSync(path.join(uploadsDir, 'test.pdf'));
    } catch (_) {}
  });

  it('allows download for purchased book', async () => {
    service.getBookForDownload.mockResolvedValue({
      pdf_url: 'test.pdf',
      title: 'Test Book',
    });
    const res = await request(app).get('/api/library/download/1');
    expect(res.status).toBe(200);
    expect(service.getBookForDownload).toHaveBeenCalledWith('1', '1');
  });

  it('blocks download if not purchased', async () => {
    service.getBookForDownload.mockResolvedValue(null);
    const res = await request(app).get('/api/library/download/2');
    expect(res.status).toBe(403);
  });
});

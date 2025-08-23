const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');

jest.mock('../src/modules/moderation/moderation.service', () => ({
  getFlaggedMessages: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'admin1' };
    next();
  },
}));

const service = require('../src/modules/moderation/moderation.service');
const routes = require('../src/modules/moderation/moderation.routes');

const app = express();
app.use(express.json());
app.use('/api/moderation', routes);
app.use(errorHandler);

describe('GET /api/moderation/flags', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns flagged messages', async () => {
    const flags = [
      {
        id: 1,
        user: 'student',
        role: 'Student',
        content: 'bad',
        matched_words: '["bad"]',
        time: '2025-01-01',
        status: 'Flagged',
      },
    ];
    service.getFlaggedMessages.mockResolvedValue(flags);
    const res = await request(app).get('/api/moderation/flags');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(flags);
    expect(service.getFlaggedMessages).toHaveBeenCalled();
  });
});

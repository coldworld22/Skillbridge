const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({
  getTutorialsByCategory: jest.fn(),
}));

const service = require('../src/modules/users/tutorials/tutorial.service');
const routes = require('../src/modules/users/tutorials/tutorial.routes');

const app = express();
app.use(express.json());
app.use('/api/users/tutorials', routes);

describe('GET /api/users/tutorials/category/:categoryId', () => {
  it('returns tutorials for the given category', async () => {
    const mockTutorials = [{ id: '1', title: 'Test Tutorial' }];
    service.getTutorialsByCategory.mockResolvedValue(mockTutorials);

    const res = await request(app).get('/api/users/tutorials/category/123');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockTutorials);
    expect(service.getTutorialsByCategory).toHaveBeenCalledWith('123');
  });
});

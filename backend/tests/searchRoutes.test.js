const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/search/search.service', () => ({
  searchClasses: jest.fn(),
  searchTutorials: jest.fn(),
  searchBooks: jest.fn(),
  searchInstructors: jest.fn(),
  searchOffers: jest.fn(),
  searchCommunity: jest.fn(),
  searchBlog: jest.fn(),
}));

const service = require('../src/modules/search/search.service');
const routes = require('../src/modules/search/search.routes');

const app = express();
app.use('/api/search', routes);

describe('GET /api/search', () => {
  it('returns grouped search results', async () => {
    service.searchClasses.mockResolvedValue([{ id: 1 }]);
    service.searchTutorials.mockResolvedValue([{ id: 2 }]);
    service.searchBooks.mockResolvedValue([{ id: 3 }]);
    service.searchInstructors.mockResolvedValue([]);
    service.searchOffers.mockResolvedValue([]);
    service.searchCommunity.mockResolvedValue([]);
    service.searchBlog.mockResolvedValue([]);

    const res = await request(app).get('/api/search').query({ q: 'term' });
    expect(res.status).toBe(200);
    expect(res.body.data.classes).toEqual([{ id: 1 }]);
    expect(service.searchClasses).toHaveBeenCalledWith('term');
    expect(service.searchBooks).toHaveBeenCalledWith('term');
  });

  it('returns 400 if query missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
  });
});

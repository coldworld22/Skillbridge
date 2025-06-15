const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/users/admin/instructors/instructorAdmin.service', () => ({
  getAllInstructors: jest.fn(),
  deleteInstructor: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/users/admin/instructors/instructorAdmin.service');
const routes = require('../src/modules/users/admin/instructors/instructorAdmin.routes');

const app = express();
app.use(express.json());
app.use('/api/users/admin/instructors', routes);

describe('GET /api/users/admin/instructors', () => {
  it('returns list of instructors', async () => {
    const mockInstructors = [{ id: '1', full_name: 'Jane' }];
    service.getAllInstructors.mockResolvedValue(mockInstructors);

    const res = await request(app).get('/api/users/admin/instructors');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockInstructors);
  });
});

describe('DELETE /api/users/admin/instructors/:id', () => {
  it('deletes instructor', async () => {
    service.deleteInstructor.mockResolvedValue();

    const res = await request(app).delete('/api/users/admin/instructors/123');
    expect(res.status).toBe(200);
    expect(service.deleteInstructor).toHaveBeenCalledWith('123');
  });
});

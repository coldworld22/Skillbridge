const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

const routes = require('../src/modules/media/media.routes');

const app = express();
app.use('/api/media', routes);

describe('GET /api/media', () => {
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const testFile = path.join(uploadsDir, 'test-file.txt');

  beforeAll(() => {
    fs.writeFileSync(testFile, 'hello');
  });

  afterAll(() => {
    fs.unlinkSync(testFile);
  });

  it('serves files within uploads directory', async () => {
    const res = await request(app).get('/api/media/test-file.txt');
    expect(res.status).toBe(200);
    expect(res.text).toBe('hello');
  });

  it('denies path traversal attempts', async () => {
    const res = await request(app).get('/api/media/../package.json');
    expect(res.status).toBe(403);
  });
});


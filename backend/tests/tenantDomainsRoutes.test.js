const request = require('supertest');
const express = require('express');
const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();
const mockTenantId = uuidv4();

jest.mock('../src/config/database', () => mockDb);

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user-1' }; next(); },
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: mockTenantId }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const routes = require('../src/modules/tenantDomains/tenantDomains.routes');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/tenant-domains', routes);
app.use(errorHandler);
let server;

describe('tenant domains routes', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('tenant_domains', (table) => {
      table.uuid('id').primary().defaultTo(mockDb.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').notNullable();
      table.text('domain').notNullable().unique();
      table.text('status').notNullable().defaultTo('pending');
      table.text('verification_token').notNullable();
      table.timestamp('verified_at');
      table.timestamps(true, true);
    });
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server?.close) server.close();
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('tenant_domains').del();
  });

  test('creates and lists domains for a tenant', async () => {
    const createRes = await request(server)
      .post('/api/tenant-domains')
      .send({ domain: 'school.example.com' });

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.domain).toBe('school.example.com');
    expect(createRes.body.data.status).toBe('pending');

    const listRes = await request(server).get('/api/tenant-domains');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].domain).toBe('school.example.com');
  });

  test('verifies a domain with token', async () => {
    const [seed] = await mockDb('tenant_domains')
      .insert({
        tenant_id: mockTenantId,
        domain: 'verify.me',
        status: 'pending',
        verification_token: 'tok-123',
      })
      .returning('*');

    const res = await request(server)
      .post(`/api/tenant-domains/${seed.id}/verify`)
      .send({ token: 'tok-123' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('verified');
  });

  test('deletes a domain', async () => {
    const [seed] = await mockDb('tenant_domains')
      .insert({
        tenant_id: mockTenantId,
        domain: 'delete.me',
        status: 'pending',
        verification_token: 'tok-del',
      })
      .returning('*');

    const res = await request(server).delete(`/api/tenant-domains/${seed.id}`);
    expect(res.status).toBe(200);
    const remaining = await mockDb('tenant_domains').where({ id: seed.id });
    expect(remaining).toHaveLength(0);
  });

  test('rejects duplicate domains', async () => {
    await mockDb('tenant_domains').insert({
      tenant_id: mockTenantId,
      domain: 'dup.me',
      status: 'pending',
      verification_token: 'tok-dup',
    });
    const res = await request(server)
      .post('/api/tenant-domains')
      .send({ domain: 'dup.me' });
    expect(res.status).toBe(409);
  });
});

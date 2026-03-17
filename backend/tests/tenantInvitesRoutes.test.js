const request = require('supertest');
const express = require('express');
const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database', () => mockDb);

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'admin-1', role: 'admin', roles: ['admin'] };
    next();
  },
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => {
    req.tenant = { id: 'tenant-1', slug: 'tenant1' };
    next();
  },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn().mockResolvedValue(),
}));

const routes = require('../src/modules/auth/routes/tenantInvite.routes');
const errorHandler = require('../src/middleware/errorHandler');

let app;
let server;

describe('tenant invites routes', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('full_name');
      table.string('email').unique();
      table.string('role');
      table.string('status');
      table.boolean('is_email_verified').defaultTo(false);
      table.boolean('profile_complete').defaultTo(false);
      table.timestamps(true, true);
    });

    await mockDb.schema.createTable('tenant_memberships', (table) => {
      table.uuid('id').primary();
      table.uuid('tenant_id').notNullable();
      table.uuid('user_id').notNullable();
      table.string('role').notNullable();
      table.string('status').notNullable();
      table.uuid('invited_by');
      table.timestamps(true, true);
      table.unique(['tenant_id', 'user_id']);
    });
  });

  afterAll(async () => {
    if (server?.close) server.close();
    await mockDb.destroy();
  });

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth/tenant-invites', routes);
    app.use(errorHandler);
    server = app.listen(0);
    await mockDb('tenant_memberships').del();
    await mockDb('users').del();
  });

  test('invites a new user and creates pending membership', async () => {
    const res = await request(server)
      .post('/api/auth/tenant-invites')
      .send({ email: 'newuser@example.com', role: 'student' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('student');
    expect(res.body.data.status).toBe('pending');
    const user = await mockDb('users').where({ email: 'newuser@example.com' }).first();
    expect(user).toBeTruthy();
  });

  test('accepts an invite and activates membership', async () => {
    const [user] = await mockDb('users')
      .insert({
        id: uuidv4(),
        email: 'invited@example.com',
        full_name: 'Invited',
        role: 'student',
        status: 'active',
        created_at: new Date(),
      })
      .returning('*');

    const [membership] = await mockDb('tenant_memberships')
      .insert({
        id: uuidv4(),
        tenant_id: '00000000-0000-0000-0000-000000000001',
        user_id: user.id,
        role: 'student',
        status: 'pending',
        invited_by: uuidv4(),
        created_at: new Date(),
      })
      .returning('*');

    const req = request(server).post('/api/auth/tenant-invites/accept');
    req.set('Authorization', 'Bearer token');
    const res = await req.send({ tenant_id: membership.tenant_id });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });
});

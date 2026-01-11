const request = require('supertest');
const express = require('express');
const { newDb } = require('pg-mem');

const pgMem = newDb();
const mockDb = pgMem.adapters.createKnex();
jest.mock('../src/config/database', () => mockDb);
const db = mockDb;

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/invoices/invoices.service', () => ({
  generateFromPayment: jest.fn(),
}));

jest.mock('../src/modules/payments/paymentAccess', () => ({
  grantAccess: jest.fn(),
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanById: jest.fn(async (id) => ({
    id,
    price_monthly: 100,
    price_yearly: 200,
    features: [],
  })),
}));

const paymentAccess = require('../src/modules/payments/paymentAccess');

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'user1' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: '00000000-0000-0000-0000-000000000001' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const studentRoutes = require('../src/modules/payments/bank.routes');
const adminRoutes = require('../src/modules/payments/bank.admin.routes');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/payments/bank', studentRoutes);
app.use('/api/admin/payments/bank', adminRoutes);
app.use(errorHandler);

describe('bank payment approval flow', () => {
  beforeAll(async () => {
    await db.schema.createTable('users', (table) => {
      table.string('id').primary();
      table.string('email');
      table.string('full_name');
      table.string('role');
      table.string('avatar_url');
      table.string('phone');
      table.boolean('is_online');
      table.string('status');
      table.boolean('profile_complete');
      table.boolean('is_email_verified');
      table.boolean('is_phone_verified');
    });

    await db.schema.createTable('payment_methods_config', (table) => {
      table.string('id').primary();
      table.string('type').notNullable();
      table.string('name');
      table.boolean('active').defaultTo(true);
      table.boolean('is_default').defaultTo(false);
      table.jsonb('settings');
    });

    await db.schema.createTable('plans', (table) => {
      table.string('id').primary();
      table.string('slug');
      table.float('price_monthly');
      table.float('price_yearly');
      table.string('target_role');
    });

    await db.schema.createTable('plan_features', (table) => {
      table.string('id').primary();
      table.string('plan_id');
      table.string('feature_key');
      table.string('value');
      table.string('description');
    });

    await db.schema.createTable('payments', (table) => {
      table.uuid('id').primary();
      table.string('user_id').notNullable();
      table.string('method_id').notNullable();
      table.string('item_type').notNullable();
      table.string('item_id').notNullable();
      table.float('amount').notNullable();
      table.string('currency').notNullable();
      table.string('status').notNullable();
      table.float('platform_fee').defaultTo(0);
      table.float('instructor_amount').defaultTo(0);
      table.string('coupon_id');
      table.jsonb('bank_details');
      table.uuid('tenant_id');
      table.timestamp('paid_at');
      table.timestamps(true, true);
    });

    await db.schema.createTable('settings', (table) => {
      table.string('key').primary();
      table.text('value').notNullable();
      table.timestamps(true, true);
    });

    await db('users').insert({
      id: 'user1',
      email: 'user@example.com',
      full_name: 'Test User',
      role: 'student',
    });
    await db('payment_methods_config').insert({
      id: 'pm1',
      type: 'bank',
      active: true,
      settings: {
        bank_name: 'Configured Bank',
        account_holder_name: 'SkillBridge LTD',
        account_number: 'USA1232456789000001',
        iban: 'DE89370400440532013000',
        swift_code: 'TESTDEFF',
        branch_address: 'Main Branch',
        instructions: 'Transfer & upload receipt',
      },
    });
    await db('plans').insert({
      id: 'plan1',
      slug: 'basic',
      price_monthly: 100,
      price_yearly: 200,
      target_role: 'student',
    });
  });

  afterAll(async () => {
    await db('payments').del();
    await db('plans').del();
    await db('payment_methods_config').del();
    await db('users').del();
    await db('settings').del();
    await db.destroy();
  });

  it('approves bank payment and updates status to paid', async () => {
    const initiateRes = await request(app)
      .post('/api/payments/bank/initiate')
      .send({ item_type: 'plan', item_id: 'plan1', amount: 100 });

    expect(initiateRes.status).toBe(200);
    const paymentId = initiateRes.body.data.id;
    const responseBankDetails =
      typeof initiateRes.body.data.bank_details === 'string'
        ? JSON.parse(initiateRes.body.data.bank_details)
        : initiateRes.body.data.bank_details;
    expect(responseBankDetails).toMatchObject({
      bank_name: 'Configured Bank',
      account_holder_name: 'SkillBridge LTD',
      account_number: 'USA1232456789000001',
      iban: 'DE89370400440532013000',
      swift_code: 'TESTDEFF',
      branch_address: 'Main Branch',
      instructions: 'Transfer & upload receipt',
    });
    expect(initiateRes.body.data.status).toBe('awaiting_approval');

    const approveRes = await request(app)
      .post(`/api/admin/payments/bank/${paymentId}/approve`)
      .send({});

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('paid');

    const payment = await db('payments').where({ id: paymentId }).first();
    expect(payment.status).toBe('paid');
    const storedBankDetails =
      typeof payment.bank_details === 'string'
        ? JSON.parse(payment.bank_details)
        : payment.bank_details;
    expect(storedBankDetails).toMatchObject({
      bank_name: 'Configured Bank',
      iban: 'DE89370400440532013000',
      swift_code: 'TESTDEFF',
    });
    // grantAccess should be invoked to provision the plan subscription
    expect(paymentAccess.grantAccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: paymentId, item_type: 'plan' })
    );
  });
});

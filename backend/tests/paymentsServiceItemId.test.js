const knex = require('knex');

const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

jest.mock('../src/config/database', () => mockDb);

const paymentsService = require('../src/modules/payments/payments.service');

beforeAll(async () => {
  await mockDb.schema.createTable('payments', (table) => {
    table.string('id').primary();
    table.string('user_id');
    table.string('method_id');
    table.string('item_type');
    table.text('item_id').notNullable();
    table.decimal('amount', 10, 2).notNullable().defaultTo(0);
    table.string('currency').notNullable().defaultTo('USD');
    table.string('status').notNullable();
    table.decimal('platform_fee', 10, 2).defaultTo(0);
    table.decimal('instructor_amount', 10, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(mockDb.fn.now());
    table.timestamp('updated_at').defaultTo(mockDb.fn.now());
  });

  await mockDb.schema.createTable('payment_schedules', (table) => {
    table.increments('id').primary();
    table.string('payment_id');
    table.integer('installment_number');
    table.decimal('amount', 10, 2);
    table.timestamp('due_date');
  });
});

afterAll(async () => {
  await mockDb.destroy();
});

beforeEach(async () => {
  await mockDb('payments').del();
  await mockDb('payment_schedules').del();
});

describe('payments.service.create', () => {
  it('persists numeric item IDs as text', async () => {
    const payment = await paymentsService.create({
      id: 'pay-1',
      user_id: 'student-1',
      method_id: 'method-1',
      item_type: 'book',
      item_id: 8,
      amount: 25,
      currency: 'USD',
      status: 'awaiting_approval',
    });

    expect(payment.item_id).toBe('8');

    const stored = await mockDb('payments').where({ id: 'pay-1' }).first();
    expect(stored.item_id).toBe('8');
  });
});

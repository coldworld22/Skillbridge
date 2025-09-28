const knex = require('knex');

const STATUS = { PAID: 'paid' };

jest.mock('../../payments.service', () => ({
  STATUS,
  create: jest.fn(() => Promise.resolve({ id: 'payment-id' })),
}));

jest.mock('../../../../config/database', () => jest.fn());

const paymentsService = require('../../payments.service');
const { recordPlanCoveredPayment } = require('../planPayments');

describe('planPayments helper', () => {
  let db;

  beforeEach(async () => {
    paymentsService.create.mockClear();

    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });

    await db.schema.createTable('payment_methods_config', (table) => {
      table.string('id');
      table.string('type');
      table.string('name');
      table.boolean('is_default');
      table.timestamp('created_at');
    });
  });

  afterEach(async () => {
    await db.destroy();
  });

  test('records plan payment with nullable method when none configured', async () => {
    await recordPlanCoveredPayment({
      trx: db,
      userId: 'user-1',
      itemId: 'class-1',
      itemType: 'class',
      source: 'subscription',
    });

    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        item_id: 'class-1',
        item_type: 'class',
        amount: 0,
        currency: 'USD',
        status: STATUS.PAID,
        source: 'subscription',
        method_id: null,
        paid_at: expect.any(Date),
      }),
      [],
      db,
    );
  });

  test('uses configured subscription method when available', async () => {
    await db('payment_methods_config').insert({
      id: 'method-1',
      type: 'subscription',
      name: 'Plan Subscription',
      is_default: 0,
      created_at: new Date(),
    });

    await recordPlanCoveredPayment({
      trx: db,
      userId: 'user-2',
      itemId: 'tutorial-1',
      itemType: 'tutorial',
      source: 'subscription',
    });

    expect(paymentsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-2',
        item_id: 'tutorial-1',
        item_type: 'tutorial',
        method_id: 'method-1',
      }),
      [],
      db,
    );
  });
});

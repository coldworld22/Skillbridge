const knex = require('knex');

const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

jest.mock('../../../config/database', () => mockDb);

const db = require('../../../config/database');
const service = require('../paymentMethods.service');

const originalEnv = {
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE: process.env.PAYPAL_MODE,
};

beforeAll(async () => {
  await db.schema.createTable('payment_methods_config', (table) => {
    table.string('id').primary();
    table.string('name');
    table.string('type');
    table.boolean('active').defaultTo(true);
    table.boolean('is_default').defaultTo(false);
    table.json('settings');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });
});

afterAll(async () => {
  await db.schema.dropTableIfExists('payment_methods_config');
  await db.destroy();
  process.env.PAYPAL_CLIENT_ID = originalEnv.PAYPAL_CLIENT_ID;
  process.env.PAYPAL_CLIENT_SECRET = originalEnv.PAYPAL_CLIENT_SECRET;
  process.env.PAYPAL_MODE = originalEnv.PAYPAL_MODE;
});

beforeEach(async () => {
  await db('payment_methods_config').del();
  process.env.PAYPAL_CLIENT_ID = originalEnv.PAYPAL_CLIENT_ID;
  process.env.PAYPAL_CLIENT_SECRET = originalEnv.PAYPAL_CLIENT_SECRET;
  process.env.PAYPAL_MODE = originalEnv.PAYPAL_MODE;
});

test('matches methods by type case-insensitively', async () => {
  await db('payment_methods_config').insert({
    id: 'bank-1',
    name: 'Bank Transfer',
    type: 'Bank',
  });

  const method = await service.getByType('bank');
  expect(method).toBeTruthy();
  expect(method.id).toBe('bank-1');
});

test('falls back to matching by name when type differs', async () => {
  await db('payment_methods_config').insert({
    id: 'bank-2',
    name: 'Bank Transfer',
    type: 'Manual',
  });

  const method = await service.getByType('bank');
  expect(method).toBeTruthy();
  expect(method.id).toBe('bank-2');
});

test('returns null when no matching method exists', async () => {
  const method = await service.getByType('nonexistent');
  expect(method).toBeNull();
});

describe('PayPal settings', () => {
  test('normalizes stored credentials and falls back to env values', async () => {
    process.env.PAYPAL_CLIENT_ID = 'env-id';
    process.env.PAYPAL_CLIENT_SECRET = 'env-secret';
    process.env.PAYPAL_MODE = 'live';

    await db('payment_methods_config').insert({
      id: 'paypal-1',
      name: 'PayPal',
      type: 'paypal',
      settings: JSON.stringify({
        clientId: ' stored-id ',
        clientSecret: ' stored-secret ',
        mode: ' LIVE ',
      }),
    });

    const settings = await service.getPayPalSettings();

    expect(settings).toEqual({
      client_id: 'stored-id',
      client_secret: 'stored-secret',
      mode: 'live',
    });
  });

  test('uses environment variables when no stored credentials exist', async () => {
    process.env.PAYPAL_CLIENT_ID = 'env-only-id';
    process.env.PAYPAL_CLIENT_SECRET = 'env-only-secret';
    process.env.PAYPAL_MODE = 'sandbox';

    await db('payment_methods_config').insert({
      id: 'paypal-2',
      name: 'PayPal',
      type: 'paypal',
      settings: '{}',
    });

    const settings = await service.getPayPalSettings();

    expect(settings).toEqual({
      client_id: 'env-only-id',
      client_secret: 'env-only-secret',
      mode: 'sandbox',
    });
  });

  test('stores normalized keys when updating credentials', async () => {
    await db('payment_methods_config').insert({
      id: 'paypal-3',
      name: 'PayPal',
      type: 'paypal',
      settings: JSON.stringify({
        clientId: 'legacy-id',
        clientSecret: 'legacy-secret',
        mode: 'LIVE',
      }),
    });

    await service.updatePayPalSettings({
      client_id: ' new-id ',
      client_secret: ' new-secret ',
      mode: 'LiVe',
    });

    const savedSettings = await service.getPayPalSettings();

    expect(savedSettings).toEqual({
      client_id: 'new-id',
      client_secret: 'new-secret',
      mode: 'live',
    });
  });

  test('preserves stored secret when only updating other fields', async () => {
    await db('payment_methods_config').insert({
      id: 'paypal-4',
      name: 'PayPal',
      type: 'paypal',
      settings: JSON.stringify({
        client_id: 'existing-id',
        client_secret: 'existing-secret',
        mode: 'sandbox',
      }),
    });

    await service.updatePayPalSettings({
      client_id: 'updated-id',
      mode: 'LIVE',
    });

    const savedSettings = await service.getPayPalSettings();

    expect(savedSettings).toEqual({
      client_id: 'updated-id',
      client_secret: 'existing-secret',
      mode: 'live',
    });
  });
});

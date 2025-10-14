const knex = require('knex');

const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

jest.mock('../../../config/database', () => mockDb);

const db = require('../../../config/database');
const service = require('../paymentMethods.service');

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
});

beforeEach(async () => {
  await db('payment_methods_config').del();
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

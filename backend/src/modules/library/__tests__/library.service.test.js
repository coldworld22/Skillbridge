const knex = require('knex');

// In-memory sqlite for unit test
const db = knex({ client: 'sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true });

jest.mock('../../../config/database', () => {
  const knex = require('knex');
  return knex({ client: 'sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true });
});

const database = require('../../../config/database');
const service = require('../library.service');

beforeAll(async () => {
  await database.schema.createTable('book_purchases', (t) => {
    t.increments('id');
    t.string('student_id');
    t.integer('book_id');
    t.decimal('price_paid', 10, 2).notNullable().defaultTo(0);
    t.timestamp('purchased_at');
  });
});

afterAll(async () => {
  await database.destroy();
});

describe('library.service.recordPurchase', () => {
  test('inserts once and returns same row on second call', async () => {
    const first = await service.recordPurchase('s1', 101, 9.99);
    const second = await service.recordPurchase('s1', 101, 9.99);
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(first.id).toBe(second.id);
    const rows = await database('book_purchases').where({ student_id: 's1', book_id: 101 });
    expect(rows).toHaveLength(1);
  });
});


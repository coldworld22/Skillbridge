const knex = require('knex');

jest.setTimeout(20000);

// Mock DB used by cart.service
jest.mock('../../../config/database', () => {
  const knex = require('knex');
  return knex({ client: 'sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true });
});

const db = require('../../../config/database');
const cart = require('../cart.service');

beforeAll(async () => {
  await db.schema.createTable('carts', (t) => {
    t.increments('id');
    t.string('user_id').unique();
  });
  await db.schema.createTable('cart_items', (t) => {
    t.increments('id');
    t.string('user_id');
    t.integer('item_id');
    t.string('name');
    t.string('item_type');
    t.decimal('price', 10, 2).defaultTo(0);
    t.integer('quantity').defaultTo(1);
    t.timestamp('added_at');
    t.boolean('reminder_sent').defaultTo(false);
  });
});

afterAll(async () => {
  await db.destroy();
});

describe('cart.service with book items', () => {
  const user = 'stu1';
  test('add/list/update/remove book item', async () => {
    const added = await cart.add(user, { id: 77, name: 'Sample Book', item_type: 'book', price: 12.5 });
    expect(added).toMatchObject({ id: 77, name: 'Sample Book', item_type: 'book', price: 12.5, quantity: 1 });

    const list1 = await cart.list(user);
    expect(list1).toHaveLength(1);
    expect(list1[0]).toMatchObject({ id: 77, item_type: 'book', quantity: 1 });

    const updated = await cart.update(user, 77, 3, 'book');
    expect(updated.quantity).toBe(3);

    const removed = await cart.remove(user, 77, 'book');
    expect(removed).toMatchObject({ id: 77, item_type: 'book' });

    const list2 = await cart.list(user);
    expect(list2).toHaveLength(0);
  });
});


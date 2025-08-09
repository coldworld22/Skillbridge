const knex = require('knex');

const mockDb = knex({
  client: 'sqlite3',
  connection: {
    filename: ':memory:'
  },
  useNullAsDefault: true
});

jest.mock('../src/config/database.js', () => mockDb);

const cartsMigration = require('../src/migrations/20250810122000_create_carts_table');
const cartItemsMigration = require('../src/migrations/20250810122100_create_cart_items_table');

const service = require('../src/modules/cart/cart.service');

describe('Cart service with DB', () => {
  beforeAll(async () => {
    await cartsMigration.up(mockDb);
    await cartItemsMigration.up(mockDb);
  });

  afterAll(async () => {
    await cartItemsMigration.down(mockDb);
    await cartsMigration.down(mockDb);
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('cart_items').del();
    await mockDb('carts').del();
  });

  test('adds and lists items per user', async () => {
    await service.add('u1', { id: 'p1', name: 'Prod1' });
    await service.add('u1', { id: 'p2', name: 'Prod2' });
    await service.add('u2', { id: 'p3', name: 'Prod3' });
    const u1Items = await service.list('u1');
    const u2Items = await service.list('u2');
    expect(u1Items).toHaveLength(2);
    expect(u2Items).toHaveLength(1);
  });

  test('increments quantity when adding same item', async () => {
    await service.add('u1', { id: 'p1', name: 'Prod1' });
    await service.add('u1', { id: 'p1', name: 'Prod1' });
    const items = await service.list('u1');
    expect(items[0].quantity).toBe(2);
  });

  test('updates and removes items', async () => {
    await service.add('u1', { id: 'p1', name: 'Prod1' });
    await service.update('u1', 'p1', 5);
    let items = await service.list('u1');
    expect(items[0].quantity).toBe(5);
    const removed = await service.remove('u1', 'p1');
    expect(removed).toMatchObject({ id: 'p1' });
    items = await service.list('u1');
    expect(items).toHaveLength(0);
  });
});

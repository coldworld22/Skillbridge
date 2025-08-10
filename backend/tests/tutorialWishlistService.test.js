const knex = require('knex');

const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

jest.mock('../src/config/database', () => mockDb);

const service = require('../src/modules/users/tutorials/wishlist/tutorialWishlist.service');
const AppError = require('../src/utils/AppError');

beforeAll(async () => {
  await mockDb.schema.createTable('tutorials', (table) => {
    table.string('id').primary();
    table.string('status');
    table.string('moderation_status');
  });
  await mockDb.schema.createTable('tutorial_wishlist', (table) => {
    table.string('id').primary();
    table.string('user_id');
    table.string('tutorial_id');
    table.unique(['user_id','tutorial_id']);
    table.timestamp('created_at').defaultTo(mockDb.fn.now());
  });
});

afterAll(async () => {
  await mockDb.schema.dropTableIfExists('tutorial_wishlist');
  await mockDb.schema.dropTableIfExists('tutorials');
  await mockDb.destroy();
});

beforeEach(async () => {
  await mockDb('tutorial_wishlist').del();
  await mockDb('tutorials').del();
});

describe('tutorialWishlist.service add', () => {
  test('throws error if tutorial does not exist', async () => {
    await expect(service.add('u1','t1')).rejects.toBeInstanceOf(AppError);
  });

  test('throws error if tutorial is not approved or published', async () => {
    await mockDb('tutorials').insert({ id: 't2', status: 'draft', moderation_status: 'Pending' });
    await expect(service.add('u1','t2')).rejects.toBeInstanceOf(AppError);
  });

  test('adds item when tutorial is approved and published', async () => {
    await mockDb('tutorials').insert({ id: 't3', status: 'published', moderation_status: 'Approved' });
    const item = await service.add('u1','t3');
    expect(item).toMatchObject({ user_id: 'u1', tutorial_id: 't3' });
    const rows = await mockDb('tutorial_wishlist');
    expect(rows).toHaveLength(1);
  });
});

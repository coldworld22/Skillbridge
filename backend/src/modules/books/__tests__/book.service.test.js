const knex = require('knex');

// Create an in-memory SQLite database for testing
const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

// Mock the database module used in the service
jest.mock('../../../config/database', () => mockDb);

const db = require('../../../config/database');
const { listBooks } = require('../book.service');

beforeAll(async () => {
  await db.schema.createTable('books', (table) => {
    table.increments('id');
    table.string('title');
    table.string('author');
    table.integer('category_id');
    table.string('status');
    table.float('price');
    table.string('language');
    table.string('instructor_id');
    table.timestamp('created_at');
  });

  const books = [
    { id: 1, title: 'A', instructor_id: '1', created_at: new Date('2023-01-01') },
    { id: 2, title: 'B', instructor_id: '2', created_at: new Date('2023-01-02') },
    { id: 3, title: 'C', instructor_id: '1', created_at: new Date('2023-01-03') },
  ];
  await db('books').insert(books);
});

afterAll(async () => {
  await db.destroy();
});

describe('listBooks', () => {
  test('filters by instructorId', async () => {
    const result = await listBooks({ instructorId: '1' });
    expect(result.data).toHaveLength(2);
    expect(result.data.every((b) => b.instructor_id === '1')).toBe(true);
    expect(result.meta.total).toBe(2);
  });
});

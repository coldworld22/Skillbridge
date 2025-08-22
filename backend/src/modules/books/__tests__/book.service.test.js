const knex = require('knex');
const QueryBuilder = require('knex/lib/query/querybuilder');

QueryBuilder.prototype.whereILike = function (column, value) {
  return this.whereRaw(`LOWER(${column}) LIKE LOWER(?)`, [value]);
};

QueryBuilder.prototype.orWhereILike = function (column, value) {
  return this.orWhereRaw(`LOWER(${column}) LIKE LOWER(?)`, [value]);
};

// Create an in-memory SQLite database for testing
const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

// Mock the database module used in the service
jest.mock('../../../config/database', () => mockDb);

const db = require('../../../config/database');
const { listBooks, checkout } = require('../book.service');

beforeAll(async () => {
  await db.schema.createTable('books', (table) => {
    table.increments('id');
    table.string('title');
    table.string('author');
    table.text('short_description');
    table.text('detailed_description');
    table.integer('category_id');
    table.string('status');
    table.float('price');
    table.string('language');
    table.string('instructor_id');
    table.timestamp('created_at');
  });

  await db.schema.createTable('book_cart', (table) => {
    table.uuid('student_id');
    table.integer('book_id');
    table.integer('quantity').defaultTo(1);
  });

  await db.schema.createTable('book_purchases', (table) => {
    table.increments('id');
    table.uuid('student_id');
    table.integer('book_id');
    table.decimal('price_paid').notNullable().defaultTo(0);
    table.timestamp('purchased_at');
  });

  const books = [
    {
      id: 1,
      title: 'A',
      author: 'AuthorMatch',
      short_description: 'ShortDesc1',
      detailed_description: 'DetailedDesc1',
      instructor_id: '1',
      created_at: new Date('2023-01-01'),
      price: 10,
    },
    {
      id: 2,
      title: 'B',
      author: 'Author2',
      short_description: 'ShortMatch',
      detailed_description: 'DetailedDesc2',
      instructor_id: '2',
      created_at: new Date('2023-01-02'),
      price: 15,
    },
    {
      id: 3,
      title: 'C',
      author: 'Author3',
      short_description: 'ShortDesc3',
      detailed_description: 'DetailedMatch',
      instructor_id: '1',
      created_at: new Date('2023-01-03'),
      price: 20,
    },
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

  test('search matches author', async () => {
    const result = await listBooks({ search: 'AuthorMatch' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(1);
  });

  test('search matches short_description', async () => {
    const result = await listBooks({ search: 'ShortMatch' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(2);
  });

  test('search matches detailed_description', async () => {
    const result = await listBooks({ search: 'DetailedMatch' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(3);
  });
});

describe('checkout', () => {
  const studentId = 'student1';

  beforeEach(async () => {
    await db('book_cart').del();
    await db('book_purchases').del();
  });

  test('throws error when book already purchased', async () => {
    await db('book_cart').insert({ student_id: studentId, book_id: 1 });
    await db('book_purchases').insert({
      student_id: studentId,
      book_id: 1,
      price_paid: 10,
    });

    await expect(checkout(studentId)).rejects.toThrow('Book already purchased');

    const purchases = await db('book_purchases').where({ student_id: studentId });
    expect(purchases).toHaveLength(1);
  });

  test('completes checkout when no duplicates', async () => {
    await db('book_cart').insert({ student_id: studentId, book_id: 2 });
    const purchases = await checkout(studentId);
    expect(purchases).toHaveLength(1);
    const inDb = await db('book_purchases').where({
      student_id: studentId,
      book_id: 2,
    });
    expect(inDb).toHaveLength(1);
    const cart = await db('book_cart').where({ student_id: studentId });
    expect(cart).toHaveLength(0);
  });
});

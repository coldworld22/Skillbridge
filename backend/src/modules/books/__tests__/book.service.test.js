const knex = require('knex');
const QueryBuilder = require('knex/lib/query/querybuilder');
const fs = require('fs');
const path = require('path');

jest.setTimeout(30000);

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
jest.mock('../../plans/subscription.helper', () => ({
  getActiveStudentPlanId: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../payments/helpers/planRevenue', () => ({
  calculateInstructorAmount: jest.fn().mockResolvedValue(0),
}));
jest.mock('../../payouts/wallet.service', () => ({
  increment: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../payments/payments.service', () => ({
  create: jest.fn(async (data) => ({ ...data, status: 'awaiting_approval' })),
  approveBankPayment: jest.fn(async (id, payload) => ({
    id,
    ...payload,
    status: 'paid',
  })),
  STATUS: { AWAITING_APPROVAL: 'awaiting_approval', PAID: 'paid' },
}));
jest.mock('../../library/library.service', () => ({
  recordPurchase: jest.fn(),
}));
jest.mock('../../payments/paymentAccess', () => ({
  grantAccess: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../payments/payments.service', () => ({
  STATUS: { PAID: 'paid', AWAITING_APPROVAL: 'awaiting_approval' },
  create: jest.fn(async (data) => ({ id: 'pay-' + Math.random(), ...data, status: 'awaiting_approval' })),
  approveBankPayment: jest.fn(async (id, data) => ({ id, ...data, status: 'paid' })),
}));

jest.mock('../../payments/paymentAccess', () => ({
  grantAccess: jest.fn(() => Promise.resolve()),
}));

const db = require('../../../config/database');
const { listBooks, checkout, updateBook } = require('../book.service');
const paymentsService = require('../../payments/payments.service');
const { grantAccess } = require('../../payments/paymentAccess');

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
    table.string('cover_image_url');
    table.string('pdf_url');
    table.text('preview_pages');
    table.json('included_plans').notNullable().defaultTo('[]');
  });

  await db.schema.createTable('book_cart', (table) => {
    table.uuid('student_id');
    table.integer('book_id');
    table.integer('quantity').defaultTo(1);
  });

  await db.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
  });

  await db.schema.createTable('book_purchases', (table) => {
    table.increments('id');
    table.uuid('student_id');
    table.integer('book_id');
    table.decimal('price_paid').notNullable().defaultTo(0);
    table.timestamp('purchased_at');
  });

  await db.schema.createTable('payment_methods_config', (table) => {
    table.uuid('id');
    table.string('type');
    table.boolean('active');
    table.string('name');
    table.json('settings');
  });
  await db('payment_methods_config').insert({
    id: 'bank1',
    type: 'bank',
    active: 1,
    name: 'Bank',
  });

  await db.schema.createTable('payments', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id');
    table.uuid('method_id');
    table.string('item_type');
    table.integer('item_id');
    table.decimal('amount', 10, 2);
    table.string('currency');
    table.string('status');
    table.decimal('platform_fee', 10, 2).defaultTo(0);
    table.decimal('instructor_amount', 10, 2).defaultTo(0);
    table.timestamp('paid_at');
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
      status: 'active',
      category_id: null,
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
      status: 'active',
      category_id: null,
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
      status: 'active',
      category_id: null,
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

describe.skip('checkout', () => {
  const studentId = 'student1';

  beforeEach(async () => {
    await db('book_cart').del();
    await db('book_purchases').del();
    await db('payments').del();
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
    const payments = await db('payments');
    expect(payments).toHaveLength(0);
  });

  test('completes checkout when no duplicates', async () => {
    await db('book_cart').insert({ student_id: studentId, book_id: 2 });
    const payments = await checkout(studentId);
    expect(payments).toHaveLength(1);
    const payInDb = await db('payments').where({
      user_id: studentId,
      item_id: 2,
      item_type: 'book',
    });
    expect(payInDb).toHaveLength(1);
    const cart = await db('book_cart').where({ student_id: studentId });
    expect(cart).toHaveLength(0);
    const purchases = await db('book_purchases').where({ student_id: studentId });
    expect(purchases).toHaveLength(0);

    const approved = await paymentsService.approveBankPayment(payments[0].id, {
      amount: 15,
      item_id: 2,
      item_type: 'book',
    });
    await grantAccess(approved);
    const after = await db('book_purchases').where({
      student_id: studentId,
      book_id: 2,
    });
    expect(after).toHaveLength(1);
  });

  test('throws error when book is inactive', async () => {
    await db('books').insert({
      id: 4,
      title: 'D',
      author: 'Author4',
      short_description: 'ShortDesc4',
      detailed_description: 'DetailedDesc4',
      instructor_id: '1',
      created_at: new Date('2023-01-04'),
      price: 25,
      status: 'inactive',
    });
    await db('book_cart').insert({ student_id: studentId, book_id: 4 });
    await expect(checkout(studentId)).rejects.toThrow('inactive or not found');
    const cart = await db('book_cart').where({ student_id: studentId });
    expect(cart).toHaveLength(1);
    const purchases = await db('book_purchases').where({ student_id: studentId });
    expect(purchases).toHaveLength(0);
    const payments = await db('payments');
    expect(payments).toHaveLength(0);
  });

  test('throws error when book ID is missing', async () => {
    await db('book_cart').insert({ student_id: studentId, book_id: 999 });
    await expect(checkout(studentId)).rejects.toThrow('inactive or not found');
    const cart = await db('book_cart').where({ student_id: studentId });
    expect(cart).toHaveLength(1);
    const purchases = await db('book_purchases').where({ student_id: studentId });
    expect(purchases).toHaveLength(0);
    const payments = await db('payments');
    expect(payments).toHaveLength(0);
  });
});

describe.skip('updateBook', () => {
  test('removes old media files when new ones are uploaded', async () => {
    const bookId = 100;
    const uploadsDir = path.join(__dirname, '../../../../uploads/books');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const oldCover = path.join(uploadsDir, 'oldcover.jpg');
    const oldPdf = path.join(uploadsDir, 'oldbook.pdf');
    fs.writeFileSync(oldCover, 'old cover');
    fs.writeFileSync(oldPdf, 'old pdf');

    await db('books').insert({
      id: bookId,
      title: 'UpdateMe',
      instructor_id: '1',
      created_at: new Date(),
      price: 0,
      cover_image_url: '/uploads/books/oldcover.jpg',
      pdf_url: '/uploads/books/oldbook.pdf',
    });

    await updateBook(bookId, {
      cover_image_url: '/uploads/books/newcover.jpg',
      pdf_url: '/uploads/books/newbook.pdf',
    });

    expect(fs.existsSync(oldCover)).toBe(false);
    expect(fs.existsSync(oldPdf)).toBe(false);

    const updated = await db('books').where({ id: bookId }).first();
    expect(updated.cover_image_url).toBe('/uploads/books/newcover.jpg');
    expect(updated.pdf_url).toBe('/uploads/books/newbook.pdf');
  });
});

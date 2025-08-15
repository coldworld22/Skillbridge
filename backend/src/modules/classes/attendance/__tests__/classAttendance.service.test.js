const knex = require('knex');

// In-memory SQLite database for testing
const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

jest.mock('../../../../config/database', () => mockDb);

const db = require('../../../../config/database');
const service = require('../classAttendance.service');
const { v4: uuidv4 } = require('uuid');

beforeAll(async () => {
  await db.schema.createTable('users', table => {
    table.uuid('id').primary();
    table.string('full_name');
  });
  await db.schema.createTable('online_classes', table => {
    table.uuid('id').primary();
    table.string('title');
  });
  await db.schema.createTable('class_enrollments', table => {
    table.uuid('class_id');
    table.uuid('user_id');
  });
  await db.schema.createTable('class_lessons', table => {
    table.uuid('id').primary();
    table.uuid('class_id');
    table.string('title');
  });
  await db.schema.createTable('class_attendance', table => {
    table.uuid('id').primary();
    table.uuid('class_id');
    table.uuid('lesson_id');
    table.uuid('user_id');
    table.boolean('attended');
    table.timestamp('timestamp');
  });

  const classId = 'class1';
  const lesson1 = 'lesson1';
  const lesson2 = 'lesson2';
  await db('online_classes').insert({ id: classId, title: 'Class' });
  await db('class_lessons').insert([
    { id: lesson1, class_id: classId, title: 'L1' },
    { id: lesson2, class_id: classId, title: 'L2' },
  ]);
  await db('users').insert([
    { id: 'u1', full_name: 'User 1' },
    { id: 'u2', full_name: 'User 2' },
  ]);
  await db('class_enrollments').insert([
    { class_id: classId, user_id: 'u1' },
    { class_id: classId, user_id: 'u2' },
  ]);
  await db('class_attendance').insert({
    id: uuidv4(),
    class_id: classId,
    lesson_id: lesson1,
    user_id: 'u1',
    attended: true,
    timestamp: new Date(),
  });
  await db('class_attendance').insert({
    id: uuidv4(),
    class_id: classId,
    lesson_id: lesson2,
    user_id: 'u2',
    attended: true,
    timestamp: new Date(),
  });
});

afterAll(async () => {
  await db.destroy();
});

describe('classAttendance.service', () => {
  test('getByClass returns attendance per lesson', async () => {
    const res1 = await service.getByClass('lesson1');
    const res2 = await service.getByClass('lesson2');

    expect(res1).toHaveLength(2);
    expect(res1.find((r) => r.user_id === 'u1').attended).toBe(1);
    expect(res1.find((r) => r.user_id === 'u2').attended).toBeNull();

    expect(res2).toHaveLength(2);
    expect(res2.find((r) => r.user_id === 'u2').attended).toBe(1);
    expect(res2.find((r) => r.user_id === 'u1').attended).toBeNull();
  });
});

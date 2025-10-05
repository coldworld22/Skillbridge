const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();

jest.mock('../../../../config/database', () => mockDb);

const service = require('../classNotification.service');

describe('classNotification.service', () => {
  const classId = uuidv4();
  const activeUserId = uuidv4();
  const cancelledUserId = uuidv4();
  const unsubscribedUserId = uuidv4();

  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('full_name');
      table.string('email');
      table.string('phone');
      table.string('locale');
    });

    await mockDb.schema.createTable('class_enrollments', (table) => {
      table.uuid('id').primary();
      table.uuid('user_id');
      table.uuid('class_id');
      table.string('status');
      table.timestamp('enrolled_at');
    });

    await mockDb.schema.createTable('class_reminder_subscriptions', (table) => {
      table.uuid('id').primary();
      table.uuid('user_id');
      table.uuid('class_id');
      table.timestamp('created_at');
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('class_reminder_subscriptions').del();
    await mockDb('class_enrollments').del();
    await mockDb('users').del();

    await mockDb('users').insert([
      {
        id: activeUserId,
        full_name: 'Active Student',
        email: 'active@example.com',
        phone: '555-1000',
        locale: 'en-US',
      },
      {
        id: cancelledUserId,
        full_name: 'Cancelled Student',
        email: 'cancelled@example.com',
        phone: '555-2000',
        locale: 'en-US',
      },
      {
        id: unsubscribedUserId,
        full_name: 'Unsubscribed Student',
        email: 'unsubscribed@example.com',
        phone: '555-3000',
        locale: 'en-US',
      },
    ]);

    await mockDb('class_enrollments').insert([
      {
        id: uuidv4(),
        user_id: activeUserId,
        class_id: classId,
        status: 'enrolled',
        enrolled_at: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: uuidv4(),
        user_id: cancelledUserId,
        class_id: classId,
        status: 'cancelled',
        enrolled_at: new Date('2024-01-02T10:00:00Z'),
      },
      {
        id: uuidv4(),
        user_id: unsubscribedUserId,
        class_id: classId,
        status: 'enrolled',
        enrolled_at: new Date('2024-01-03T10:00:00Z'),
      },
    ]);

    await mockDb('class_reminder_subscriptions').insert([
      {
        id: uuidv4(),
        user_id: activeUserId,
        class_id: classId,
        created_at: new Date('2024-01-01T11:00:00Z'),
      },
      {
        id: uuidv4(),
        user_id: cancelledUserId,
        class_id: classId,
        created_at: new Date('2024-01-02T11:00:00Z'),
      },
    ]);
  });

  test('returns only active, subscribed students', async () => {
    const students = await service.getSubscribedStudentsByClass(classId);

    expect(students).toHaveLength(1);
    expect(students[0]).toEqual(
      expect.objectContaining({
        email: 'active@example.com',
        phone: '555-1000',
        status: 'enrolled',
        locale: 'en-US',
      }),
    );
  });
});
